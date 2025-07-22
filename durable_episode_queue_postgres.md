# Durable Episode Queue with Postgres

## Objective

Provide a fault-tolerant, restart-safe queue for Graphiti episodes so that _every_ `add_memory` request is persisted immediately, processed exactly-once, and automatically retried on transient failures (e.g., Ollama 500 / timeout).

---

## High-Level Architecture

```
Client → add_memory (producer) ──┐
                                │ 1. INSERT row status=queued
                                │ 2. XADD uuid to Redis Stream
                                ▼
Postgres table `episode_queue`   ├──┐
                                 │  │
Redis Stream `episode_tasks`     │  │  (Durable Queue)
                                 │  │
Episode Worker (consumer) ◄──────┘  │
   1. XREADGROUP uuid               │
   2. UPDATE status=processing      │
   3. graphiti.add_episode()        │
   4a. success → status=done        │
   4b. fail   → status=error + msg  │
         if retry_count < N ────────┘  XADD uuid (delay)
```

> **Why both Postgres _and_ Redis?**  
> _Postgres_ gives durable storage & queryability (audit, manual re-queue).  
> _Redis Streams_ provide lightweight, scalable delivery & consumer-group semantics.

---

## Database Schema (PostgreSQL)

```sql
CREATE TABLE IF NOT EXISTS episode_queue (
    uuid          UUID PRIMARY KEY,
    payload       JSONB                NOT NULL, -- raw add_memory args
    status        TEXT                 NOT NULL CHECK (status IN ('queued','processing','done','error')),
    retry_count   INTEGER              NOT NULL DEFAULT 0,
    error_message TEXT,
    queued_at     TIMESTAMPTZ          NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMPTZ          NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_episode_queue_status ON episode_queue(status);
```

### Status meanings

- **queued** — awaiting worker pickup
- **processing** — currently being ingested
- **done** — successfully written to Neo4j/FalkorDB
- **error** — ingestion failed; can be retried

---

## Producer Changes (`add_memory`)

1. Build `episode_payload = {...}` from incoming function args.
2. `INSERT` row (`status='queued'`).
3. `XADD episode_tasks * uuid <uuid>` to Redis Stream.
4. Return immediate "queued" response (unchanged API).

All three steps wrapped in a single async function; roll back the DB insert if Redis push fails.

---

## Worker Logic

Pseudo-code (async):

```python
while True:
    entries = await redis.xreadgroup('workers', consumer_id, streams={'episode_tasks': '>'}, count=1, block=5000)
    for stream, msgs in entries:
        for msg_id, data in msgs:
            uuid = data['uuid']
            row = await pg.fetchrow('SELECT * FROM episode_queue WHERE uuid=$1', uuid)
            if not row or row['status'] == 'done':
                redis.xack('episode_tasks', 'workers', msg_id)
                continue
            await pg.execute('UPDATE episode_queue SET status="processing", updated_at=NOW() WHERE uuid=$1', uuid)
            try:
                await graphiti.add_episode(**row['payload'])
                await pg.execute('UPDATE episode_queue SET status="done", updated_at=NOW() WHERE uuid=$1', uuid)
                redis.xack('episode_tasks', 'workers', msg_id)
            except Exception as e:
                await pg.execute('UPDATE episode_queue SET status="error", error_message=$2, retry_count=retry_count+1, updated_at=NOW() WHERE uuid=$1', uuid, str(e))
                redis.xack('episode_tasks', 'workers', msg_id)
                if row['retry_count'] + 1 < MAX_RETRIES:
                    await asyncio.sleep(backoff(row['retry_count']))
                    redis.xadd('episode_tasks', {'uuid': uuid})
```

---

## Instrumenting Ollama Calls

Modify the part of `graphiti.add_episode` (or wrapper) that sends requests to Ollama:

```python
try:
    response = await asyncio.wait_for(ollama_client.chat(...), timeout=OLLAMA_TIMEOUT)
except (asyncio.TimeoutError, HTTPError) as e:
    raise RuntimeError(f'Ollama failure: {e}')
```

The raised exception bubbles to the worker, triggers status=error, and the retry flow.

---

## Deployment Updates

1. **Docker Compose**
   ```yaml
   services:
     postgres:
       image: postgres:16
       environment:
         POSTGRES_USER: graphiti
         POSTGRES_PASSWORD: secret
         POSTGRES_DB: graphiti
       volumes:
         - pgdata:/var/lib/postgresql/data
     redis:
       image: redis:7-alpine
     graphiti-mcp:
       build: ./mcp_server
       depends_on:
         - postgres
         - redis
       environment:
         DATABASE_URL: postgres://graphiti:secret@postgres:5432/graphiti
         REDIS_URL: redis://redis:6379/0
   volumes:
     pgdata:
   ```
2. **Environment Vars**
   - `DATABASE_URL` — Postgres DSN
   - `REDIS_URL` — Redis connection URI
   - `EPISODE_MAX_RETRIES` (default 3)
   - `EPISODE_RETRY_BACKOFF` (e.g., exponential)

---

## Management CLI / HTTP Endpoints

- `GET /queue?status=error` – list failed episodes.
- `POST /queue/{uuid}/retry` – reset status to queued & push to stream.
- `DELETE /queue/{uuid}` – remove row.

---

## Testing Checklist

- Unit tests for producer & worker functions.
- Integration test: enqueue → kill worker → restart → confirm `status=done`.
- Simulate Ollama timeout (mock) → verify error row & retry.

---

## Future Enhancements

- Dead-letter queue for permanent failures.
- Prometheus metrics (`queue_length`, `failed_total`).
- Web UI for queue inspection.
