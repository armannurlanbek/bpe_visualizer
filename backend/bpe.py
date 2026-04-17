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
    for piece in pieces:
        if piece.startswith(" "):
            out.append(SPACE_MARKER + piece[1:])
        elif piece.isspace():
            out.append(SPACE_MARKER)
        else:
            out.append(piece)
    return [token for token in out if token]


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
            steps.append(
                {
                    "step": step + 1,
                    "pair": [best[0], best[1]],
                    "count": count,
                    "words_before": words_before,
                    "words_after": words_after,
                    "new_token": new_token,
                }
            )

    if return_steps:
        return merges, vocab, steps
    return merges, vocab


def save_tokenizer(merges, vocab, path="tokenizer.json"):
    data = {
        "version": "1.0",
        "vocab": vocab,
        "merges": [f"{a} {b}" for a, b in merges],
    }
    with open(path, "w", encoding="utf-8") as file:
        json.dump(data, file, ensure_ascii=False, indent=2)


def load_tokenizer(path="tokenizer.json"):
    with open(path, "r", encoding="utf-8") as file:
        data = json.load(file)
    vocab = {tok: int(idx) for tok, idx in data["vocab"].items()}
    merges = [tuple(merge.split(" ")) for merge in data["merges"]]
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

    ids = [vocab.get(token, unk_id) for token in tokens]
    return tokens, ids


def decode(ids, vocab):
    id_to_token = {idx: token for token, idx in vocab.items()}
    tokens = [id_to_token.get(token_id, "<unk>") for token_id in ids]
    text = "".join(tokens)
    return text.replace(SPACE_MARKER, " ")
