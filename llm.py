import os
import requests
import json

OLLAMA_URL = "http://localhost:11434/api/generate"
MODEL_NAME = os.getenv("OLLAMA_MODEL", "llama3")
FAST_MODEL_NAME = os.getenv("OLLAMA_FAST_MODEL", "llama3.2")
DEFAULT_OPTIONS = {
    "temperature": 0.7,  # Increased for faster generation
    "num_predict": 280,
    "top_p": 0.5  # Reduced for faster, more focused responses
}


def generate_llm_response(prompt, use_fast_model=False, extra_options=None):
    """Generate response without streaming (for non-streaming use cases)"""
    options = DEFAULT_OPTIONS.copy()
    if extra_options:
        options.update(extra_options)

    preferred_model = FAST_MODEL_NAME if use_fast_model else MODEL_NAME

    def _call_model(model):
        resp = requests.post(
            OLLAMA_URL,
            json={
                "model": model,
                "prompt": prompt,
                "stream": False,
                "options": options,
            },
            timeout=180,
        )
        resp.raise_for_status()
        return resp.json()["response"]

    try:
        return _call_model(preferred_model)
    except Exception:
        if preferred_model != MODEL_NAME:
            try:
                return _call_model(MODEL_NAME)
            except Exception as e:
                raise
        raise


    response.raise_for_status()
    return response.json()["response"]


def generate_llm_response_stream(prompt, use_fast_model=False, extra_options=None):
    """Generate response with streaming for real-time display"""
    options = DEFAULT_OPTIONS.copy()
    if extra_options:
        options.update(extra_options)

    preferred_model = FAST_MODEL_NAME if use_fast_model else MODEL_NAME

    def _call_stream(model):
        resp = requests.post(
            OLLAMA_URL,
            json={
                "model": model,
                "prompt": prompt,
                "stream": True,
                "options": options,
            },
            stream=True,
            timeout=180,
        )
        resp.raise_for_status()
        return resp

    try:
        return _call_stream(preferred_model)
    except Exception:
        if preferred_model != MODEL_NAME:
            return _call_stream(MODEL_NAME)
        raise



# 🔥 MODEL WARMUP (reduces first request delay)
try:
    generate_llm_response("Hi")
except:
    pass
