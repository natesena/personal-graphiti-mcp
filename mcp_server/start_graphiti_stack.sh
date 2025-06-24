#!/bin/bash
set -e

# Models to pull (edit as needed)
EMBED_MODEL="nomic-embed-text"
LLM_MODEL="deepseek-r1:8b"

# Start Ollama container
echo "[1/3] Starting Ollama container..."
docker compose up -d ollama

# Pull embedding model
echo "[2/3] Pulling embedding model: $EMBED_MODEL"
docker compose exec ollama ollama pull $EMBED_MODEL

# Pull LLM model
echo "[2/3] Pulling LLM model: $LLM_MODEL"
docker compose exec ollama ollama pull $LLM_MODEL

# Start the full stack
echo "[3/3] Starting the full stack (Neo4j, Ollama, MCP server)..."
docker compose up 