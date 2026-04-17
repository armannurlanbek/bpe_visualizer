from pathlib import Path
import os
from typing import Dict, List, Tuple

import tiktoken
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

try:
    from .bpe import encode, pre_tokenize, train_bpe
except ImportError:
    from bpe import encode, pre_tokenize, train_bpe

BASE_DIR = Path(__file__).parent
CORPORA_DIR = BASE_DIR / "sample_corpora"

CORPORA_META = {
    "english": "English novel excerpt",
    "russian": "Russian text sample",
    "kazakh": "Kazakh text sample",
}


class TrainRequest(BaseModel):
    text: str = Field(min_length=1)
    num_merges: int = Field(ge=1, le=200)


class TrainStep(BaseModel):
    step: int
    pair: List[str]
    count: int
    words_before: List[List[str]]
    words_after: List[List[str]]
    new_token: str


class TrainResponse(BaseModel):
    merges: List[List[str]]
    vocab: Dict[str, int]
    steps: List[TrainStep]
    initial_chars: List[str]


class EncodeRequest(BaseModel):
    text: str
    merges: List[List[str]]
    vocab: Dict[str, int]


class EncodeResponse(BaseModel):
    tokens: List[str]
    ids: List[int]
    tokens_per_char: float


class CompareRequest(BaseModel):
    text: str
    merges: List[List[str]]
    vocab: Dict[str, int]
    model: str = "gpt-4"


class CompareResponse(BaseModel):
    my_tokens: List[str]
    my_ids: List[int]
    tiktoken_tokens: List[str]
    tiktoken_ids: List[int]
    my_count: int
    tiktoken_count: int
    my_vocab_size: int
    tiktoken_vocab_size: int


class CorpusMeta(BaseModel):
    id: str
    name: str
    chars: int
    preview: str


class CorporaResponse(BaseModel):
    corpora: List[CorpusMeta]


class CorpusResponse(BaseModel):
    id: str
    name: str
    text: str


def normalize_merges(merges: List[List[str]]) -> List[Tuple[str, str]]:
    out = []
    for pair in merges:
        if len(pair) != 2:
            raise HTTPException(status_code=400, detail="Each merge must have exactly two tokens.")
        out.append((pair[0], pair[1]))
    return out


def read_corpus(corpus_id: str) -> str:
    corpus_path = CORPORA_DIR / f"{corpus_id}.txt"
    if not corpus_path.exists():
        raise HTTPException(status_code=404, detail="Corpus not found.")
    return corpus_path.read_text(encoding="utf-8")


def get_encoding_for_model(model: str):
    try:
        return tiktoken.encoding_for_model(model)
    except KeyError:
        return tiktoken.get_encoding("cl100k_base")


app = FastAPI(title="BPE Visualizer API", version="1.0.0")

cors_origins = os.getenv("CORS_ORIGINS", "http://localhost:5173").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[origin.strip() for origin in cors_origins if origin.strip()],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health():
    return {"status": "ok"}


@app.post("/api/train", response_model=TrainResponse)
def train_endpoint(request: TrainRequest):
    merges, vocab, steps = train_bpe(request.text, request.num_merges, return_steps=True)
    initial_chars = sorted({char for token in pre_tokenize(request.text) for char in token})
    return {
        "merges": [[left, right] for left, right in merges],
        "vocab": vocab,
        "steps": steps,
        "initial_chars": initial_chars,
    }


@app.post("/api/encode", response_model=EncodeResponse)
def encode_endpoint(request: EncodeRequest):
    merges = normalize_merges(request.merges)
    tokens, ids = encode(request.text, merges, request.vocab)
    denom = max(len(request.text), 1)
    return {
        "tokens": tokens,
        "ids": ids,
        "tokens_per_char": round(len(tokens) / denom, 4),
    }


@app.post("/api/compare", response_model=CompareResponse)
def compare_endpoint(request: CompareRequest):
    merges = normalize_merges(request.merges)
    my_tokens, my_ids = encode(request.text, merges, request.vocab)

    encoding = get_encoding_for_model(request.model)
    tiktoken_ids = encoding.encode(request.text)
    tiktoken_tokens = [
        encoding.decode_single_token_bytes(token_id).decode("utf-8", errors="replace")
        for token_id in tiktoken_ids
    ]

    return {
        "my_tokens": my_tokens,
        "my_ids": my_ids,
        "tiktoken_tokens": tiktoken_tokens,
        "tiktoken_ids": tiktoken_ids,
        "my_count": len(my_tokens),
        "tiktoken_count": len(tiktoken_tokens),
        "my_vocab_size": len(request.vocab),
        "tiktoken_vocab_size": encoding.n_vocab,
    }


@app.get("/api/sample-corpora", response_model=CorporaResponse)
def list_corpora():
    corpora = []
    for corpus_id, name in CORPORA_META.items():
        text = read_corpus(corpus_id)
        corpora.append(
            {
                "id": corpus_id,
                "name": name,
                "chars": len(text),
                "preview": (text[:180] + "...") if len(text) > 180 else text,
            }
        )
    return {"corpora": corpora}


@app.get("/api/corpus/{corpus_id}", response_model=CorpusResponse)
def get_corpus(corpus_id: str):
    if corpus_id not in CORPORA_META:
        raise HTTPException(status_code=404, detail="Corpus not found.")
    return {
        "id": corpus_id,
        "name": CORPORA_META[corpus_id],
        "text": read_corpus(corpus_id),
    }
