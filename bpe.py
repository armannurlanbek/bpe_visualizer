import json
import re
from collections import Counter

# GPT-2 style pre-tokenization regex — splits contractions, letters, numbers,
# punctuation, and whitespace into separate pieces before BPE sees them.
PRE_TOKENIZE_PATTERN = re.compile(
    r"""'s|'t|'re|'ve|'m|'ll|'d| ?\w+| ?[^\s\w]+|\s+""",
    re.UNICODE,
)

# Marker that represents a leading space inside a token. SentencePiece uses ▁;
# we use the same character so decode can recover spaces correctly.
SPACE_MARKER = "\u2581"  # ▁


def pre_tokenize(text):
    """Split raw text into pre-tokens and mark leading spaces with ▁.

    "hello world" → ["▁hello", "▁world"]
    "don't"       → ["▁don", "'t"]
    """
    pieces = PRE_TOKENIZE_PATTERN.findall(text)
    out = []
    for p in pieces:
        if p.startswith(" "):
            out.append(SPACE_MARKER + p[1:])
        elif p.isspace():
            # collapse any other whitespace runs into a single marker
            out.append(SPACE_MARKER)
        else:
            out.append(p)
    return [p for p in out if p]  # drop empty


def get_pair_counts(word_freqs):
    """Count pairs, weighted by word frequency.

    word_freqs: dict of {tuple_of_tokens: frequency}
    returns:    dict of {(tok_a, tok_b): total_count}
    """
    pairs = {}
    for word, freq in word_freqs.items():
        for i in range(len(word) - 1):
            pair = (word[i], word[i + 1])
            pairs[pair] = pairs.get(pair, 0) + freq
    return pairs


def get_best_pair(pair_counts):
    """Pick the highest-count pair. Ties broken alphabetically for reproducibility."""
    return max(pair_counts, key=lambda p: (pair_counts[p], -ord(p[0][0]), -ord(p[1][0])))


def merge_in_word(word, a, b):
    """Apply one merge rule to a single word (tuple of tokens)."""
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
    """Apply one merge rule across all words, preserving frequencies."""
    a, b = pair
    new_freqs = {}
    for word, freq in word_freqs.items():
        merged = merge_in_word(word, a, b)
        new_freqs[merged] = new_freqs.get(merged, 0) + freq
    return new_freqs


def train_bpe(text, num_merges):
    """Train a BPE tokenizer on text."""
    # Pre-tokenize and count word frequencies — this is the key speedup.
    # "the the the" doesn't get processed 3 times, it gets weight=3.
    pre_tokens = pre_tokenize(text)
    word_freqs = Counter(pre_tokens)

    # Split each unique word into characters (as a tuple so it's hashable).
    word_freqs = {tuple(word): freq for word, freq in word_freqs.items()}

    # Build initial vocab from all characters seen.
    all_chars = sorted({ch for word in word_freqs for ch in word})
    vocab = {ch: i for i, ch in enumerate(all_chars)}
    vocab["<unk>"] = len(vocab)

    merges = []
    for step in range(num_merges):
        counts = get_pair_counts(word_freqs)
        if not counts:
            break
        best = get_best_pair(counts)
        word_freqs = merge_all(word_freqs, best)
        merges.append(best)
        new_token = best[0] + best[1]
        if new_token not in vocab:
            vocab[new_token] = len(vocab)

    return merges, vocab


def save_tokenizer(merges, vocab, path="tokenizer.json"):
    data = {
        "version": "1.0",
        "vocab": vocab,
        "merges": [f"{a} {b}" for a, b in merges],
    }
    with open(path, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    print(f"saved {len(vocab)} tokens, {len(merges)} merges → {path}")


def load_tokenizer(path="tokenizer.json"):
    with open(path, "r", encoding="utf-8") as f:
        data = json.load(f)
    vocab = {tok: int(idx) for tok, idx in data["vocab"].items()}
    merges = [tuple(m.split(" ")) for m in data["merges"]]
    return merges, vocab


def build_merge_ranks(merges):
    """Precompute {pair: rank} for O(1) merge priority lookup during encode."""
    return {pair: i for i, pair in enumerate(merges)}


def encode_word(word, merge_ranks):
    """Encode a single pre-token (tuple of chars) using priority-based merges.

    Instead of iterating through ALL merge rules like our naive version,
    we repeatedly find the best-ranked pair present in THIS word and merge it.
    This is the same approach tiktoken uses.
    """
    word = list(word)
    while len(word) > 1:
        # find the pair in this word with the smallest (= earliest) rank
        best_pair = None
        best_rank = float("inf")
        for i in range(len(word) - 1):
            pair = (word[i], word[i + 1])
            rank = merge_ranks.get(pair, float("inf"))
            if rank < best_rank:
                best_rank = rank
                best_pair = pair

        if best_pair is None:
            break  # no applicable merge rules left

        # merge every occurrence of that pair in the word
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
    """Encode text into (tokens, ids) using priority-based merges."""
    merge_ranks = build_merge_ranks(merges)
    unk_id = vocab["<unk>"]

    tokens = []
    for pre_tok in pre_tokenize(text):
        # fall back to <unk> for characters not in vocab
        chars = [c if c in vocab else "<unk>" for c in pre_tok]
        tokens.extend(encode_word(tuple(chars), merge_ranks))

    ids = [vocab.get(t, unk_id) for t in tokens]
    return tokens, ids


def decode(ids, vocab):
    """Decode token IDs back to text, restoring spaces from ▁ markers."""
    id_to_token = {i: tok for tok, i in vocab.items()}
    tokens = [id_to_token.get(i, "<unk>") for i in ids]
    text = "".join(tokens)
    # restore spaces: ▁ at the start of a token means there was a space before it
    text = text.replace(SPACE_MARKER, " ")
    return text


# --- tests ---
if __name__ == "__main__":
    corpus = "low lower lowest newer newest wider width low low"

    merges, vocab = train_bpe(corpus, num_merges=15)
    print(f"vocab size: {len(vocab)}  merges: {len(merges)}")
    print("first 5 merges:", merges[:5])

    save_tokenizer(merges, vocab)
    merges2, vocab2 = load_tokenizer()
    assert merges == merges2
    assert vocab == vocab2
    print("save/load round-trip OK")

    # encode tests
    for text in ["lower", "lowers", "narrow", "low lower", "hello world"]:
        tokens, ids = encode(text, merges, vocab)
        decoded = decode(ids, vocab)
        match = "✓" if decoded == text else "✗"
        print(f"  {match}  {text!r:20} → {tokens}")
        print(f"     decoded: {decoded!r}")

    # full round-trip
    text = "low lower newest"
    _, ids = encode(text, merges, vocab)
    assert decode(ids, vocab) == text, "round-trip failed"
    print("\nfull round-trip OK — spaces preserved correctly")