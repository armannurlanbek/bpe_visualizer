# BPE Lab: Tokenizer Visualizer

An interactive full-stack app that teaches Byte Pair Encoding (BPE) by animating training merges, live encoding, and side-by-side comparison with OpenAI's `tiktoken`.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)
![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-0.110+-009688?logo=fastapi&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-Strict-3178C6?logo=typescript&logoColor=white)
![Tailwind](https://img.shields.io/badge/TailwindCSS-3.x-06B6D4?logo=tailwindcss&logoColor=white)
![Stars](https://img.shields.io/github/stars/your-username/bpe-lab?style=social)

Live demo: [https://your-demo-url.vercel.app](https://your-demo-url.vercel.app)

## Screenshot / GIF

Add your final hero screenshot or short GIF here after first deployment.

## What Is This?

Byte Pair Encoding starts with characters and repeatedly merges the most frequent adjacent pair to build useful subword units.  
This project makes that process visible so learners can build intuition for how tokenizers compress text and why production tokenization differs across languages.

## Features

- 🎬 Animated step-by-step BPE training with merge history and before/after token grids
- ✍️ Live encoding playground with token IDs and compression metrics
- ⚖️ Side-by-side comparison between your trained BPE and `tiktoken` (`gpt-4`)
- 🌍 Multilingual quick demos (English, Russian, Kazakh) to reveal tokenization differences
- 🌗 Responsive dark/light UI inspired by educational visual essays
- 🧠 Stateless backend API design (no DB, merges/vocab passed in requests)

## How BPE Works

1. Split text into pre-tokens and characters.
2. Count adjacent token-pair frequency.
3. Merge the most frequent pair into a new token.
4. Repeat for `N` merges.
5. Reuse learned merges to encode new text.

<!-- Add a custom diagram here later -->
`[Diagram placeholder: training loop + encoding path]`

## Running Locally

### 1) Backend (FastAPI)

```bash
cd backend
python -m venv .venv
# Windows:
.venv\Scripts\activate
# macOS/Linux:
# source .venv/bin/activate
pip install -r requirements.txt
uvicorn api:app --reload --host 0.0.0.0 --port 8000
```

API base URL: `http://localhost:8000`

### 2) Frontend (React + Vite)

```bash
cd frontend
npm install
npm run dev
```

Optional env:

```bash
# frontend/.env
VITE_API_URL=http://localhost:8000
```

## Deployment

See [deploy.md](./deploy.md) for Render + Vercel step-by-step deployment.

## Credits

- Built during learning at **nFactorial School**
- Inspired by tokenizer visual explainers including `tiktokenizer.vercel.app`

## Tech Stack

- Frontend: React 18, TypeScript, Vite, TailwindCSS, Framer Motion, Recharts, Lucide React
- Backend: FastAPI, Python 3.11+, `tiktoken`
