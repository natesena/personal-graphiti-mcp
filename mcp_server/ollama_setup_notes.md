# Graphiti MCP Server with Ollama: Setup & Changes Log

This document summarizes all changes and steps taken to set up the Graphiti MCP server to use Ollama for LLMs, including Docker Compose, environment variables, and model management. It also notes the next step for using an Ollama embedding model.

---

## 1. Docker Compose Changes

- **Added Ollama service** to `docker-compose.yml`:
  ```yaml
  ollama:
    image: ollama/ollama
    ports:
      - "11434:11434"
    volumes:
      - ollama_data:/root/.ollama
  ```
- **Added persistent volume** for Ollama:
  ```yaml
  volumes:
    ollama_data:
  ```
- **Configured `graphiti-mcp` service** to use Ollama:
  - Set `OPENAI_BASE_URL` to `http://ollama:11434/v1` in the environment section.
  - Set `OPENAI_API_KEY` and `MODEL_NAME` to use values from `.env`.
  - Example:
    ```yaml
    environment:
      - OPENAI_API_KEY=${OPENAI_API_KEY}
      - MODEL_NAME=${MODEL_NAME}
      - OPENAI_BASE_URL=http://ollama:11434/v1
    ```

---

## 2. .env File Setup

- Created `.env` in the `mcp_server/` directory with:
  ```env
  OPENAI_API_KEY=ollama
  MODEL_NAME=deepseek-r1:8b
  NEO4J_URI=bolt://neo4j:7687
  NEO4J_USER=neo4j
  NEO4J_PASSWORD=demodemo
  ```
- **No `NEO4J_PORT` variable needed.**
- Ensure `.env` is in the same directory as `docker-compose.yml` and you run `docker compose up` from there.

---

## 3. Pulling Ollama LLM Model

- Started the Ollama service in the background:
  ```bash
  docker compose up -d ollama
  ```
- Pulled the required LLM model into the running container:
  ```bash
  docker compose exec ollama ollama pull deepseek-r1:8b
  ```
- After the model is downloaded, started the full stack:
  ```bash
  docker compose up
  ```

---

## 4. MCP Client Configuration

- For Docker-based setup, use `mcp_config_sse_example.json` and point your client to `http://localhost:8000/sse`.
- Only use the stdio config if running the MCP server as a subprocess (not typical for Docker).

---

## 5. Next Steps: Ollama Embedding Model

- **Current status:** The MCP server and Graphiti Core expect OpenAI-compatible embedding endpoints.
- **To use an Ollama embedding model:**
  - You will need to:
    1. Pull an embedding model in the Ollama container (e.g., `ollama pull nomic-embed-text` or another supported embedding model).
    2. Update the `.env` and/or Docker Compose to set the embedding model name (e.g., `EMBEDDER_MODEL_NAME=nomic-embed-text`).
    3. Ensure the code (Graphiti Core and MCP server) is configured to use the embedding endpoint at `http://ollama:11434/v1/embeddings` (if supported by Ollama and the model).
  - **Note:** As of now, Ollama's OpenAI-compatible API for embeddings is experimental and may require code changes if not natively supported by Graphiti Core.

---

## 6. Troubleshooting

- If you see warnings about missing environment variables, check that `.env` is present, correctly named, and you are running Docker Compose from the right directory.
- If you see model not found errors, ensure you have pulled the model in the Ollama container.
- Remove the `version:` line from `docker-compose.yml` if you see a warning about it being obsolete.

---

**For further changes or embedding model integration, see the Next Steps section above.**
