FROM python:3.11-slim

WORKDIR /app

# Install uv for package management
RUN apt-get update && apt-get install -y curl && \
    curl -LsSf https://astral.sh/uv/install.sh | sh && \
    apt-get clean && rm -rf /var/lib/apt/lists/*

# Add uv to PATH
ENV PATH="/root/.local/bin:${PATH}"

ENV MCP_SERVER_HOST="0.0.0.0"

# Copy pyproject.toml and install dependencies
COPY pyproject.toml .
COPY README.md .
COPY graphiti_core ./graphiti_core
RUN ls -l ./graphiti_core
RUN pip install poetry
RUN poetry config virtualenvs.create false
RUN poetry install --no-root

# Copy application code
COPY mcp_server/graphiti_mcp_server.py .
COPY mcp_server/test_ollama_embedding_url.py .

EXPOSE 8000

# Set environment variables
ENV PYTHONUNBUFFERED=1

# Command to run the application
CMD ["uv", "run", "graphiti_mcp_server.py"]
