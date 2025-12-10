---
title: Gmail Categorization
subtitle: Semantic search engine over your Gmail archive that finds relevant emails
  by meaning, not just keywords. Built for power users who live in their inbox and
  want fast retrieval and training data for AI email assistants. Uses SentenceTransformers
  embeddings, FAISS vector indexing, and MBOX parsing with incremental index updates
  and cleaned conversation threads.
slug: gmail-categorization
date: '2025-03-05'
updated: '2025-03-06'
tags:
- python
maturity: prototype
featured: false
visibility: public
heroImage: /generated/logos/gmail-categorization.png
---
## Overview

Gmail-Categorization is an experiment in building a local, privacy-preserving semantic search and categorization pipeline for my Gmail archive. Instead of relying on keyword search, I use sentence embeddings and a FAISS vector index to find relevant emails based on meaning, not just exact text matches. The project also includes tooling for parsing mbox files, threading conversations, cleaning email bodies, and generating training data for an email-response assistant tuned to my writing style.

## Role & Context

I built this project end-to-end as a personal productivity and ML-infrastructure exercise. My goals were to:

- Index a large personal email corpus efficiently on my own machine.
- Explore semantic search with sentence-transformer embeddings and FAISS.
- Build utilities for ongoing ingestion (append-only) rather than one-off indexing.
- Prototype dataset creation for a personalized email assistant using real email threads.

Everything from data extraction to indexing and querying is implemented in Python scripts in this repository.

## Tech Stack

- Python
- FAISS (Facebook AI Similarity Search)
- sentence-transformers (`all-MiniLM-L6-v2`)
- pandas
- NumPy
- `mailbox` and `email` standard libraries
- tqdm

## Problem

Traditional email search is largely keyword-based and often fails in a few common situations:

- I vaguely remember an email “about a project timeline” but not the specific phrasing, sender, or subject.
- I want to find “all emails where I promised to follow up” or “introductions I received for internships” which are more semantic than lexical.
- I want to build ML models on top of my email history (for auto-replies or prioritization), which requires structured, de-duplicated, thread-aware data.

I wanted a local toolchain that:

1. Ingests my Gmail archive in mbox format.
2. Cleans and normalizes email content.
3. Indexes emails using semantic embeddings to support natural-language queries.
4. Incrementally updates the index as new emails arrive.
5. Optionally generates conversation-level data suitable for fine-tuning an LLM to reply “like me.”

## Approach / Architecture

I designed the project as a collection of focused scripts rather than a monolithic app:

- **Ingestion & Indexing (`main.py`)**
  - Read multiple mbox files (e.g., `Important`, `Sent`) using the `mailbox` module.
  - Normalize each message into a tuple: `(Subject, Sender, Body, FullText)`.
  - Encode `FullText` using a sentence-transformers model.
  - Build a FAISS L2 index over the resulting vectors and save it alongside a CSV copy of the email metadata.

- **Incremental Updates (`append.py`)**
  - Parse new mbox data.
  - De-duplicate against already indexed `FullText` entries.
  - Encode only new messages and append their vectors to the existing FAISS index.
  - Merge metadata and persist the updated CSV and index.

- **Semantic Search (`search.py`)**
  - Load the saved FAISS index and the `emails.csv`.
  - Encode a free-text query into the same embedding space.
  - Use FAISS to retrieve top-k nearest emails and display their subject, sender, and a snippet.

- **Threading & Dataset Creation (`sample_emails.py`, `sample_chains.py`)**
  - Parse mbox files into structured message objects, including threading fields like `Message-ID`, `In-Reply-To`, and `References`.
  - Clean bodies by stripping quoted previous messages.
  - Reconstruct threads and filter to those where I have at least one sent email.
  - Export conversation snippets for use in a JSONL training file (`openai_training.jsonl`), with a fixed system prompt that captures my desired email tone.

This architecture keeps responsibilities separated: parsing, indexing, querying, and dataset generation can all evolve independently.

## Key Features

- Semantic email search using sentence-transformer embeddings and FAISS.
- Local, file-based index persisted as `email_index.faiss` plus a CSV metadata store.
- Incremental index updates with de-duplication of already indexed messages.
- Robust email parsing from mbox archives, including basic body decoding and normalization.
- Thread reconstruction based on `In-Reply-To` and `References` headers.
- Cleaning utilities to remove quoted reply chains from email bodies.
- JSONL training samples for a personalized email-response assistant.

## Technical Details

The ingestion pipeline in `main.py` starts by defining a list of mbox paths:

```python
MBOX_PATHS = ["raw_mail/Important.mbox", "raw_mail/Sent.mbox"]
MAX_EMAILS = 5000
model = SentenceTransformer("all-MiniLM-L6-v2")
```

### Email Extraction and Normalization

I use the `mailbox.mbox` interface to iterate through messages, handling missing fields and decoding bodies defensively:

- Subject defaults to `"(No Subject)"` if absent.
- Sender defaults to `"Unknown Sender"`.
- Body is taken from `msg.get_payload(decode=True)` and decoded as UTF-8 with `errors="ignore"`; on failure, the body falls back to an empty string.

Each email is consolidated into a `FullText` block:

```python
full_text = f"Subject: {subject}\nSender: {sender}\nBody: {body}"
emails.append((subject, sender, body, full_text))
```

To avoid unbounded memory growth and to keep the index small while prototyping, I:

- Sample a maximum number of emails per mbox: `max_emails // len(mbox_paths)`.
- Randomly subsample if a mailbox exceeds that quota (`random.sample`).

The emails are converted into a pandas DataFrame with columns:

- `Subject`
- `Sender`
- `Body`
- `FullText`

and saved to `emails.csv`.

### Embedding and Indexing

I use `SentenceTransformer("all-MiniLM-L6-v2")` to encode the `FullText` column:

```python
email_vectors = model.encode(df["FullText"].tolist(), convert_to_numpy=True)
d = email_vectors.shape[1]
index = faiss.IndexFlatL2(d)
index.add(email_vectors)
faiss.write_index(index, "email_index.faiss")
```

The choice of `IndexFlatL2` trades off advanced recall/speed options for simplicity and predictable behavior. For this dataset size, brute-force L2 search is acceptable.

### Incremental Updates and De-duplication

`append.py` handles appending new messages:

1. Load the existing index and CSV if present; otherwise, initialize empty structures.
2. Parse a new mbox (`NEW_MBOX_PATH`) into email tuples similar to `main.py`.
3. De-duplicate by checking whether each new email’s `FullText` is already in `existing_emails`.

```python
filtered_emails = [email for email in new_emails if email[3] not in existing_emails]
```

4. Encode only `filtered_emails` and add them to the FAISS index (`index.add(new_vectors)`).
5. Concatenate `df_existing` and `df_new` and write back to `emails.csv`.

This gives me an append-only workflow without needing to rebuild the index from scratch.

### Semantic Search

`search.py` loads the shared model and index:

```python
model = SentenceTransformer("all-MiniLM-L6-v2")
index = faiss.read_index("email_index.faiss")
df = pd.read_csv("emails.csv").fillna("")
```

For any text query:

```python
query_vector = model.encode([query], convert_to_numpy=True)
distances, indices = index.search(query_vector, top_n)
results = df.iloc[indices[0]]
```

I then print each result with:

- Subject
- Sender
- First 200 characters of the body as a snippet

This loop runs inside a simple REPL so I can iteratively refine queries interactively.

### Threading and Training Data

`sample_emails.py` and `sample_chains.py` focus on structuring email conversations:

- Extract headers: `Message-ID`, `In-Reply-To`, `References`, `From`, `To`, `Subject`, `Date`.
- Parse dates via `email.utils.parsedate_to_datetime`.
- Use `clean_email_body` to get a text body stripped of quoted history:
  - For multipart messages, walk parts and select `text/plain`.
  - Remove quoted lines starting with `>` or containing `"wrote:"`.

`build_threads` uses `defaultdict(list)` to:

- Map each message by `message_id`.
- Attach replies using:
  - Direct `in_reply_to` references where possible.
  - Fallback to scanning `references` fields for a known ID.
- Filter threads to those containing at least one of my own sent messages, identified via a set of sent message IDs.
- Sort threads by most recent message date.

The resulting structures are suitable for conversion into OpenAI-style conversation examples, stored in `openai_training.jsonl` where each line has:

- A `system` message with my email-response style.
- A `user` message containing the incoming email.
- An `assistant` message containing my real reply.

This file can then be used to fine-tune or adapt an LLM to answer emails in my voice.

## Results

- Indexed thousands of personal emails into a FAISS vector store with minimal memory overhead.
- Achieved intuitive semantic search behavior: I can type a natural-language description of an email and retrieve relevant messages even when phrasing and keywords differ.
- Established a repeatable append workflow that keeps the index and CSV in sync as new mail is exported.
- Generated a real-world, thread-aware dataset suitable for training a personalized email assistant.

## Lessons Learned

- **Data hygiene matters:** Handling missing headers, inconsistent encodings, and multipart messages is critical before any ML work can be effective.
- **Simple FAISS setups go a long way:** For modest corpus sizes, `IndexFlatL2` plus good embeddings is more than enough; complexity can be deferred.
- **De-duplication strategy needs care:** Using `FullText` as a uniqueness key works initially but could be improved with message IDs or hashes for robustness.
- **Thread reconstruction is subtle:** `In-Reply-To` and `References` can be incomplete or inconsistent; a conservative threading approach avoids mis-grouping but leaves room for refinement.
- **Training data from real conversations is powerful:** Real-world email threads provide rich examples for modeling tone, structure, and reply patterns in a personalized assistant.

## Links

- [GitHub Repository](https://github.com/IsaiahJMurray/Gmail-Categorization)
- Demo: _TBD_