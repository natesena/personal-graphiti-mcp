import os
from dotenv import load_dotenv
from graphiti_core.embedder.openai import OpenAIEmbedder, OpenAIEmbedderConfig
from openai import AsyncOpenAI
import asyncio

# Load environment variables from .env
load_dotenv()

# Mimic the config logic from MCP server
DEFAULT_EMBEDDING_MODEL = os.environ.get('EMBEDDER_MODEL_NAME', 'nomic-embed-text')
DEFAULT_LLM_MODEL = os.environ.get('DEFAULT_LLM_MODEL', 'deepseek-r1:8b')

embedding_model = DEFAULT_EMBEDDING_MODEL
llm_model = DEFAULT_LLM_MODEL
api_key = os.environ.get('OPENAI_API_KEY')
base_url = os.environ.get('OPENAI_BASE_URL')

config = OpenAIEmbedderConfig(
    api_key=api_key,
    embedding_model=embedding_model,
    base_url=base_url,
)

# Print out the config for verification
print(f"Embedding endpoint URL: {config.base_url}")
print(f"Embedding model name: {config.embedding_model}")
print(f"API key: {config.api_key}")

# Optionally, try to instantiate the embedder (does not make a request)
embedder = OpenAIEmbedder(config=config)
print("Embedder client initialized successfully.")

async def test_embedding():
    try:
        result = await embedder.create("hello world")
        print("Embedding vector (first 5 values):", result[:5])
    except Exception as e:
        print("Embedding request failed:", e)

async def test_llm():
    try:
        client = AsyncOpenAI(api_key=api_key, base_url=base_url)
        response = await client.chat.completions.create(
            model=llm_model,
            messages=[{"role": "user", "content": "Say hello from Ollama!"}],
            max_tokens=32,
        )
        print("LLM response:", response.choices[0].message.content)
    except Exception as e:
        print("LLM request failed:", e)

async def main():
    print("\n--- Testing embedding ---")
    await test_embedding()
    print("\n--- Testing LLM completion ---")
    await test_llm()

if __name__ == "__main__":
    asyncio.run(main()) 