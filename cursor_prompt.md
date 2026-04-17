# BPE Tokenizer Visualizer — Cursor Plan Mode Prompt

Build a full-stack educational web app that visualizes how the Byte Pair Encoding (BPE) tokenization algorithm works. The goal is a portfolio-quality demo that teaches people what BPE does by letting them watch it train and encode text in real time, and compare it side-by-side with OpenAI's production tokenizer (tiktoken).

## Context & Goal

I'm an LLM engineering student building this as a portfolio piece for UK/EU/USA tech job applications. I already have a working Python BPE implementation in `bpe.py` (see "Existing BPE Code" section below) — you're wrapping it in a beautiful web interface.

The aesthetic reference is **3blue1brown** — educational, colorful, playful but not childish. Think soft gradients, smooth animations, math/diagram-heavy feel. Inspiration: 3blue1brown.com, Distill.pub, The Pudding's data essays.

## Tech Stack

**Frontend (deploy to Vercel):**
- React 18 with Vite (NOT Next.js — keep it simple SPA)
- TailwindCSS for styling
- Framer Motion for animations (critical — the BPE merges need to feel alive)
- Lucide React for icons
- Recharts for the comparison charts
- TypeScript

**Backend (deploy to Render or Railway free tier):**
- FastAPI
- Python 3.11+
- `tiktoken` library for comparison
- CORS middleware enabled for the deployed frontend origin
- No database — everything is stateless API calls

## Repository Structure

```
bpe-visualizer/
├── README.md                    # polished README with screenshots, live demo link, tech stack
├── LICENSE                      # MIT
├── .gitignore                   # Python + Node
├── backend/
│   ├── bpe.py                   # my existing BPE code (provided below)
│   ├── api.py                   # FastAPI app with /train, /encode, /compare endpoints
│   ├── requirements.txt         # fastapi, uvicorn, tiktoken, pydantic
│   ├── render.yaml              # Render deploy config
│   └── sample_corpora/
│       ├── english.txt          # first 50KB of an English novel
│       ├── russian.txt          # first 50KB of Russian text
│       └── kazakh.txt           # first 50KB of Kazakh text
├── frontend/
│   ├── package.json
│   ├── tsconfig.json
│   ├── vite.config.ts
│   ├── tailwind.config.js
│   ├── index.html
│   ├── src/
│   │   ├── main.tsx
│   │   ├── App.tsx              # top-level layout with mode toggle
│   │   ├── api.ts               # typed fetch functions to backend
│   │   ├── types.ts             # TypeScript types for API responses
│   │   ├── components/
│   │   │   ├── Header.tsx       # logo, GitHub link, mode toggle
│   │   │   ├── ModeToggle.tsx   # train vs encode vs compare
│   │   │   ├── TrainingView.tsx # main training playground
│   │   │   ├── EncodingView.tsx # encoding playground
│   │   │   ├── CompareView.tsx  # tiktoken side-by-side
│   │   │   ├── Token.tsx        # animated token pill component
│   │   │   ├── MergeRule.tsx    # single merge rule row
│   │   │   ├── VocabGrid.tsx    # full vocabulary display
│   │   │   ├── Stats.tsx        # metric cards (tokens per word, etc.)
│   │   │   └── Explainer.tsx    # inline explanations per section
│   │   ├── lib/
│   │   │   ├── colors.ts        # color palette for tokens
│   │   │   └── animations.ts    # shared Framer Motion variants
│   │   └── styles.css
│   └── public/
│       └── favicon.svg
└── deploy.md                    # step-by-step deploy guide for me
```

## Backend — API Contracts

### `POST /api/train`
Train BPE on provided text, return merges and vocab incrementally.

Request:
```json
{
  "text": "low lower newest wider",
  "num_merges": 10
}
```

Response:
```json
{
  "merges": [["e", "r"], ["l", "o"], ["lo", "w"]],
  "vocab": {"l": 0, "o": 1, "w": 2, "e": 3, "r": 4, "er": 5, "lo": 6, "low": 7},
  "steps": [
    {
      "step": 1,
      "pair": ["e", "r"],
      "count": 3,
      "words_before": [["l","o","w"], ["l","o","w","e","r"]],
      "words_after": [["l","o","w"], ["l","o","w","er"]]
    }
  ],
  "initial_chars": ["l", "o", "w", "e", "r", "n", ...]
}
```

The `steps` array is what powers the step-by-step animation on the frontend.

### `POST /api/encode`
Encode text using previously trained merges+vocab.

Request:
```json
{
  "text": "lower",
  "merges": [["e", "r"], ["l", "o"]],
  "vocab": {"l": 0, "o": 1, ...}
}
```

Response:
```json
{
  "tokens": ["low", "er"],
  "ids": [7, 5],
  "tokens_per_char": 0.4
}
```

### `POST /api/compare`
Compare my BPE to tiktoken on the same text.

Request:
```json
{
  "text": "lower newest widely",
  "merges": [...],
  "vocab": {...},
  "model": "gpt-4"
}
```

Response:
```json
{
  "my_tokens": ["low", "er", " ", "new", "est"],
  "my_ids": [7, 5, 8, 9, 10],
  "tiktoken_tokens": ["lower", " newest", " widely"],
  "tiktoken_ids": [15115, 24138, 13990],
  "my_count": 5,
  "tiktoken_count": 3,
  "my_vocab_size": 25,
  "tiktoken_vocab_size": 100277
}
```

### `GET /api/sample-corpora`
Return list of available sample corpora.

Response:
```json
{
  "corpora": [
    {"id": "english", "name": "English novel excerpt", "chars": 50000, "preview": "It was the best of times..."},
    {"id": "russian", "name": "Russian text sample", "chars": 50000, "preview": "В некотором царстве..."},
    {"id": "kazakh", "name": "Kazakh text sample", "chars": 50000, "preview": "Бір кезде..."}
  ]
}
```

### `GET /api/corpus/{id}`
Return the full text of a sample corpus.

## Frontend — Design Language

**Color palette (3b1b inspired):**
- Background: warm cream `#FDFBF7` (light mode) / deep blue-black `#0E1117` (dark mode)
- Primary accent: vibrant blue `#3B82F6`
- Secondary: warm amber `#F59E0B`
- Success/merge highlight: teal `#14B8A6`
- Text: rich dark `#1F2937` / soft cream `#F3F4F6`
- Token colors cycle through a rainbow palette (HSL-spaced) so adjacent tokens are always visually distinct

**Typography:**
- Body: Inter (Google Fonts)
- Monospace (for tokens, code): JetBrains Mono
- Display (big numbers, headlines): Fraunces for an editorial/3b1b touch

**Layout:**
- Max width 1200px, centered
- Generous whitespace (py-12, gap-8 everywhere)
- Cards with subtle shadow and 12px border radius
- Top header with logo "BPE Lab" (or similar), GitHub icon link, mode toggle (Train / Encode / Compare)

**Animation language:**
- When a merge happens: the two tokens slide together, pulse, then fuse into one new token with a soft color flash
- When typing in the encode box: tokens re-render with a stagger animation
- Charts fade in and bars grow from zero
- Page transitions use AnimatePresence with a soft crossfade

## Frontend — Three Main Views

### 1. TrainingView (default)
A playground where the user types or selects a corpus, picks a number of merges, and watches BPE learn.

Layout top-to-bottom:
- Explainer card: "BPE learns a tokenizer by repeatedly merging the most frequent pair of adjacent characters. Watch it happen below."
- Input section: textarea for corpus OR dropdown to pick sample corpus, slider for num_merges (1-50), "Train" button
- Training step visualization:
  - "Step X of Y" header with prev/next buttons and auto-play toggle
  - Current best pair displayed prominently with count
  - Grid of words showing their tokens as colored pills
  - Highlight which tokens are being merged this step (animated)
  - Before/after comparison for the current step
- Merge rules panel: ordered list of all learned rules so far, newest at top
- Vocabulary panel: all tokens as colored pills, grouped by length (1 char, 2 chars, 3+)
- Stats row: total tokens, merged tokens, average token length, compression ratio

### 2. EncodingView
User types any text and watches it get tokenized live against the trained tokenizer.

Layout:
- Explainer card: "Encoding applies learned merge rules in order to new text"
- Large textarea for input (live-updates as they type, debounced 200ms)
- Result: text rendered as colored token pills with the token ID in a small badge
- Stats: character count, token count, tokens-per-character ratio
- Toggle to show/hide the step-by-step merge application

### 3. CompareView
Side-by-side comparison with tiktoken to show "here's what the real production tokenizer does."

Layout:
- Explainer: "OpenAI's tiktoken uses 100K+ merges trained on the entire internet. Here's how it compares to yours."
- Shared input textarea
- Two columns side by side: "Your BPE" and "tiktoken (GPT-4)"
  - Each shows the tokenized output with colored pills
  - Token count displayed prominently
- Comparison bar chart: tokens per sample sentence (Recharts)
- Multilingual demo: pre-filled buttons for "English", "Russian", "Kazakh" that swap the input and re-tokenize, showing how tokens-per-word varies dramatically across languages. This is the key insight the whole app builds toward.

## Existing BPE Code

This is my working `bpe.py`. Put it in `backend/bpe.py` and wrap it in the FastAPI endpoints. You may need to modify `train_bpe` to also return the per-step history for the animation — add a parameter `return_steps=True` that makes it also record each step's before/after state.

```python
import json
import re
from collections import Counter

PRE_TOKENIZE_PATTERN = re.compile(
    r"""'s|'t|'re|'ve|'m|'ll|'d| ?\w+| ?[^\s\w]+|\s+""",
    re.UNICODE,
)
SPACE_MARKER = "\u2581"


def pre_tokenize(text):
    pieces = PRE_TOKENIZE_PATTERN.findall(text)
    out = []
    for p in pieces:
        if p.startswith(" "):
            out.append(SPACE_MARKER + p[1:])
        elif p.isspace():
            out.append(SPACE_MARKER)
        else:
            out.append(p)
    return [p for p in out if p]


def get_pair_counts(word_freqs):
    pairs = {}
    for word, freq in word_freqs.items():
        for i in range(len(word) - 1):
            pair = (word[i], word[i + 1])
            pairs[pair] = pairs.get(pair, 0) + freq
    return pairs


def get_best_pair(pair_counts):
    return max(pair_counts, key=lambda p: (pair_counts[p], -ord(p[0][0]), -ord(p[1][0])))


def merge_in_word(word, a, b):
    new_word = []
    i = 0
    while i < len(word):
        if i < len(word) - 1 and word[i] == a and word[i + 1] == b:
            new_word.append(a + b)
            i += 2
        else:
            new_word.append(word[i])
            i += 1
    return tuple(new_word)


def merge_all(word_freqs, pair):
    a, b = pair
    new_freqs = {}
    for word, freq in word_freqs.items():
        merged = merge_in_word(word, a, b)
        new_freqs[merged] = new_freqs.get(merged, 0) + freq
    return new_freqs


def train_bpe(text, num_merges, return_steps=False):
    pre_tokens = pre_tokenize(text)
    word_freqs = Counter(pre_tokens)
    word_freqs = {tuple(word): freq for word, freq in word_freqs.items()}

    all_chars = sorted({ch for word in word_freqs for ch in word})
    vocab = {ch: i for i, ch in enumerate(all_chars)}
    vocab["<unk>"] = len(vocab)

    merges = []
    steps = []
    for step in range(num_merges):
        counts = get_pair_counts(word_freqs)
        if not counts:
            break
        best = get_best_pair(counts)
        count = counts[best]
        words_before = [list(w) for w in word_freqs.keys()]
        word_freqs = merge_all(word_freqs, best)
        words_after = [list(w) for w in word_freqs.keys()]

        merges.append(best)
        new_token = best[0] + best[1]
        if new_token not in vocab:
            vocab[new_token] = len(vocab)

        if return_steps:
            steps.append({
                "step": step + 1,
                "pair": list(best),
                "count": count,
                "words_before": words_before,
                "words_after": words_after,
                "new_token": new_token,
            })

    if return_steps:
        return merges, vocab, steps
    return merges, vocab


def build_merge_ranks(merges):
    return {tuple(pair): i for i, pair in enumerate(merges)}


def encode_word(word, merge_ranks):
    word = list(word)
    while len(word) > 1:
        best_pair = None
        best_rank = float("inf")
        for i in range(len(word) - 1):
            pair = (word[i], word[i + 1])
            rank = merge_ranks.get(pair, float("inf"))
            if rank < best_rank:
                best_rank = rank
                best_pair = pair
        if best_pair is None:
            break
        a, b = best_pair
        new_word = []
        i = 0
        while i < len(word):
            if i < len(word) - 1 and word[i] == a and word[i + 1] == b:
                new_word.append(a + b)
                i += 2
            else:
                new_word.append(word[i])
                i += 1
        word = new_word
    return word


def encode(text, merges, vocab):
    merge_ranks = build_merge_ranks(merges)
    unk_id = vocab.get("<unk>", 0)

    tokens = []
    for pre_tok in pre_tokenize(text):
        chars = [c if c in vocab else "<unk>" for c in pre_tok]
        tokens.extend(encode_word(tuple(chars), merge_ranks))

    ids = [vocab.get(t, unk_id) for t in tokens]
    return tokens, ids


def decode(ids, vocab):
    id_to_token = {i: tok for tok, i in vocab.items()}
    tokens = [id_to_token.get(i, "<unk>") for i in ids]
    text = "".join(tokens)
    text = text.replace(SPACE_MARKER, " ")
    return text
```

## tiktoken Integration

In the backend, use `tiktoken.encoding_for_model("gpt-4")` to get the real tokenizer. Expose this through the `/api/compare` endpoint. Decode tiktoken tokens back to their string representation using `encoding.decode_single_token_bytes(id).decode("utf-8", errors="replace")` for display.

## Sample Corpora

Populate `backend/sample_corpora/` with:
- `english.txt`: First ~50KB of "Pride and Prejudice" from Project Gutenberg (public domain)
- `russian.txt`: First ~50KB of "Преступление и наказание" (Dostoyevsky, public domain)
- `kazakh.txt`: ~50KB of public-domain Kazakh text (Abai Kunanbaiuly's Қара сөздер works well)

If you can't find these, use placeholder comments indicating the user should download them.

## README Requirements

The README.md is critical — this is what recruiters see first. Include:

1. **Hero section** — project name, one-line description, live demo link (placeholder), GitHub stars badge, license badge, tech stack badges
2. **Screenshot/GIF** — reserve space at the top for a hero screenshot (I'll add one later)
3. **What is this?** — 2 sentence explanation of BPE and why this project exists
4. **Features** — bulleted list with emoji icons
5. **How BPE works** — short explanation with a diagram placeholder
6. **Running locally** — clear instructions for both frontend and backend
7. **Deployment** — link to deploy.md
8. **Credits** — nFactorial School, inspired by tiktokenizer.vercel.app
9. **Tech stack** — badges for React, FastAPI, TypeScript, Tailwind

Use a clean markdown style with h2 dividers and emoji sparingly.

## Deploy Guide (deploy.md)

Step-by-step for deploying:
1. **Backend to Render**: push to GitHub, connect Render, use `render.yaml`, get URL
2. **Frontend to Vercel**: push to GitHub, import in Vercel, set `VITE_API_URL` env var to backend URL
3. **CORS update**: add the Vercel URL to backend's allowed origins
4. **Custom domain (optional)**: point bpe-lab.yourdomain.com

## What I Want You to Do

1. Create the full repository structure above
2. Write all files with complete, production-quality code
3. Use the existing `bpe.py` as-is — don't refactor its algorithm, only extend it with `return_steps=True` support
4. Make the frontend genuinely beautiful — this is a portfolio piece, design matters as much as functionality
5. Add tasteful Framer Motion animations, especially for the merge steps — that's the "wow" moment
6. Write a truly polished README — it should look like a top-tier open source project
7. Include helpful inline comments in the React components so I can learn from the code

## Constraints

- No backend state — every request is stateless; trained merges/vocab are passed back and forth in requests
- Keep dependencies minimal — no heavy UI libraries beyond what's listed
- Dark mode must work — respect `prefers-color-scheme`
- Mobile responsive — should look fine on a phone, even if primary target is desktop
- TypeScript strict mode enabled on frontend

Build this as one cohesive product. Start by proposing the plan, then execute file-by-file.
