export type Mode = 'train' | 'encode' | 'compare'

export interface TrainStep {
  step: number
  pair: [string, string]
  count: number
  words_before: string[][]
  words_after: string[][]
  new_token: string
}

export interface TrainResponse {
  merges: [string, string][]
  vocab: Record<string, number>
  steps: TrainStep[]
  initial_chars: string[]
}

export interface EncodeResponse {
  tokens: string[]
  ids: number[]
  tokens_per_char: number
}

export interface CompareResponse {
  my_tokens: string[]
  my_ids: number[]
  tiktoken_tokens: string[]
  tiktoken_ids: number[]
  my_count: number
  tiktoken_count: number
  my_vocab_size: number
  tiktoken_vocab_size: number
}

export interface CorpusMeta {
  id: string
  name: string
  chars: number
  preview: string
}

export interface CorporaResponse {
  corpora: CorpusMeta[]
}

export interface CorpusResponse {
  id: string
  name: string
  text: string
}

export interface TrainedTokenizerState {
  merges: [string, string][]
  vocab: Record<string, number>
  steps: TrainStep[]
  initialChars: string[]
}
