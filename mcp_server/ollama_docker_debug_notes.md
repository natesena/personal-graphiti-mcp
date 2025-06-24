# Graphiti MCP Server + Ollama Docker Debug Log

## Process Summary

### 1. Initial Setup

- Cloned the Graphiti repo and confirmed the presence of the `graphiti_core/` directory in the project root.
- Ensured the `mcp_server/` directory contains the Dockerfile, server entrypoint, and test scripts.
- Set up `.env` and `docker-compose.yml` to use Ollama for both LLM and embeddings.

### 2. Dockerfile and Build Steps

- Dockerfile copies all project code and runs `pip install -e .` to install the project in editable mode.
- The goal is for the MCP server container to be able to import and use `graphiti_core`.

### 3. pyproject.toml Configuration

- Confirmed `[project]` section includes:
  - `name = "graphiti-core"`
  - `packages = [{ include = "graphiti_core", from = "." }]`
- This should tell Python to only install `graphiti_core` as a package.

### 4. Test Script

- Added a test script (`test_ollama_embedding_url.py`) to verify embedding and LLM endpoints from inside the Docker container.

## Current Error

When building the Docker image, the following error occurs:

```
error: Multiple top-level modules discovered in a flat-layout: ['test_ollama_embedding_url', 'graphiti_mcp_server'].
To avoid accidental inclusion of unwanted files or directories,
setuptools will not proceed with this build.
```

- This means setuptools is confused by the presence of multiple top-level Python files in the project root.
- Only `graphiti_core` should be installed as a package, but setuptools is trying to auto-discover packages and finds extra files.

## Next Steps

- Add `[tool.setuptools] packages = ["graphiti_core"]` to `pyproject.toml` to explicitly specify the package.
- If the error persists, move non-package scripts (like `test_ollama_embedding_url.py` and `graphiti_mcp_server.py`) into the `mcp_server/` directory so they are not in the project root.
- Rebuild the Docker image and test again.

---

**This file serves as a running log of the Docker/Ollama MCP server setup and debugging process.**
