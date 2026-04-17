import type {
  CompareResponse,
  CorporaResponse,
  CorpusResponse,
  EncodeResponse,
  TrainResponse,
} from './types'

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8000'

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers ?? {}),
    },
    ...options,
  })

  if (!response.ok) {
    const detail = await response.text()
    throw new Error(detail || `Request failed (${response.status}).`)
  }

  return (await response.json()) as T
}

export function trainBpe(text: string, numMerges: number): Promise<TrainResponse> {
  return request<TrainResponse>('/api/train', {
    method: 'POST',
    body: JSON.stringify({ text, num_merges: numMerges }),
  })
}

export function encodeText(
  text: string,
  merges: [string, string][],
  vocab: Record<string, number>
): Promise<EncodeResponse> {
  return request<EncodeResponse>('/api/encode', {
    method: 'POST',
    body: JSON.stringify({ text, merges, vocab }),
  })
}

export function compareTokenizers(
  text: string,
  merges: [string, string][],
  vocab: Record<string, number>,
  model = 'gpt-4'
): Promise<CompareResponse> {
  return request<CompareResponse>('/api/compare', {
    method: 'POST',
    body: JSON.stringify({ text, merges, vocab, model }),
  })
}

export function getSampleCorpora(): Promise<CorporaResponse> {
  return request<CorporaResponse>('/api/sample-corpora')
}

export function getCorpus(id: string): Promise<CorpusResponse> {
  return request<CorpusResponse>(`/api/corpus/${id}`)
}
