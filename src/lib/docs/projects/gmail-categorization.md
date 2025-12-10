---
title: Gmail Categorization
subtitle: Semantic search engine for Gmail that lets you retrieve past emails by meaning
  instead of keywords, built for power users who live in their inbox. Parses mbox
  archives, embeds messages with SentenceTransformers, and indexes them in FAISS for
  fast vector similarity search and incremental updates.
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

Gmail-Categorization is an experimental project where I index my personal email archives and enable fast, semantic search over them. Instead of relying on basic text matching (subject, keywords), I use sentence embeddings and a FAISS vector index to retrieve the emails that are conceptually closest to a natural language query.

Beyond search, I also started building tooling to extract, clean, and structure email threads for downstream uses like personalization, AI assistants, and potential fine-tuning datasets.

## Role & Context

I designed and implemented this project end-to-end:

- Parsing and cleaning raw Gmail `.mbox` exports
- Building a semantic vector index for emails
- Implementing a CLI-based semantic search interface
- Creating utilities to incrementally update the index
- Prototyping dataset generation for an email-writing assistant fine-tuned on my own email history

This was a personal project to explore practical applications of embeddings, FAISS, and email data, as well as to prepare training data for a personalized assistant.

## Tech Stack

- Python
- FAISS (Facebook AI Similarity Search)
- sentence-transformers (`all-MiniLM-L6-v2`)
- pandas
- NumPy
- tqdm
- Python `mailbox` and `email` standard libraries
- JSON / JSONL for dataset export

## Problem

Gmail’s default search is good for keywords and filters, but not as good at:

- Finding emails that are semantically related to a topic even if they don’t share obvious keywords
- Surfacing past conversations that “feel similar” to a new situation (e.g., scholarship emails, internship logistics, event coordination)
- Reusing my own writing style to draft new responses

I wanted a local, scriptable system that:

- Indexes my email content using embeddings
- Supports fast, approximate nearest-neighbor search
- Can be incrementally updated as I export more mail
- Produces structured data suitable for training or prompting an AI assistant that writes emails like I do

## Approach / Architecture

I structured the project into three main layers:

1. **Data ingestion (from `.mbox` to tabular data)**  
   - Use Python’s `mailbox.mbox` to parse Gmail exports from different labels (e.g., Important, Sent).
   - Normalize each message into a consistent schema: subject, sender, body, and a combined `FullText` field.
   - Clean the body where needed, decoding, stripping binary artifacts, and optionally removing quoted reply chains.

2. **Embedding + indexing (semantic search backend)**  
   - Use `SentenceTransformer("all-MiniLM-L6-v2")` to convert `FullText` into dense vectors.
   - Store these vectors in a FAISS `IndexFlatL2` for efficient similarity search.
   - Persist both the index (`email_index.faiss`) and the metadata (`emails.csv`) so searches can run without reprocessing.

3. **Search and maintenance utilities**  
   - `search.py`: a simple CLI loop that takes a natural language query, embeds it, and queries the FAISS index for nearest neighbors, printing top matching emails.
   - `append.py`: an incremental updater that parses new `.mbox` files, deduplicates them against existing data, embeds the new emails, and appends them to the FAISS index and CSV.
   - `sample_emails.py` / `sample_chains.py`: utilities to parse mailboxes into structured threads and export cleaned email exchanges, eventually used to build an `openai_training.jsonl` dataset for a personalized assistant.

## Key Features

- Semantic search over email history using sentence embeddings and FAISS
- Efficient indexing of thousands of emails with a lightweight transformer model
- Incremental index updates from new Gmail `.mbox` exports with duplicate detection
- Robust MBOX parsing with decoding and basic body cleaning
- Thread reconstruction from `Message-ID`, `In-Reply-To`, and `References` headers
- Automated generation of conversation-style training data for an email-writing assistant

## Technical Details

### Email ingestion and normalization

In `main.py`, I define the MBOX sources:

```python
MBOX_PATHS = ["raw_mail/Important.mbox", "raw_mail/Sent.mbox"]
MAX_EMAILS = 5000
```

I then use `mailbox.mbox` to iterate through messages and normalize fields:

- `Subject`: defaulting to `"(No Subject)"` when missing
- `Sender`: defaulting to `"Unknown Sender"` when missing
- `Body`: `msg.get_payload(decode=True)` followed by UTF‑8 decoding with `errors="ignore"` to handle malformed content
- `FullText`: a concatenation of subject, sender, and body, which becomes the embedding input

Emails are collected into a list and converted into a pandas DataFrame:

```python
df = pd.DataFrame(emails, columns=["Subject", "Sender", "Body", "FullText"])
```

Sampling logic ensures that if any `.mbox` file has more messages than the configured limit, I randomly sample to respect `MAX_EMAILS` across all sources. This keeps experimentation fast and limits resource usage.

### Embeddings and FAISS index

I use the `sentence-transformers` library:

```python
model = SentenceTransformer("all-MiniLM-L6-v2")
email_vectors = model.encode(df["FullText"].tolist(), convert_to_numpy=True)
```

This produces a NumPy array of shape `(n_emails, d)` where `d` is the embedding dimension. I construct a FAISS index as:

```python
d = email_vectors.shape[1]
index = faiss.IndexFlatL2(d)
index.add(email_vectors)
```

Then I persist both artifacts:

```python
faiss.write_index(index, "email_index.faiss")
df.to_csv("emails.csv", index=False)
```

This separation of vector index and CSV lets me decouple fast similarity search (FAISS) from rich metadata access (pandas).

### Semantic search interface

`search.py` is a simple but effective CLI interface:

- Load the persisted FAISS index and the DataFrame (`emails.csv`).
- Embed the user’s text query:

  ```python
  query_vector = model.encode([query], convert_to_numpy=True)
  ```

- Run nearest-neighbor search:

  ```python
  distances, indices = index.search(query_vector, top_n)
  results = df.iloc[indices[0]]
  ```

- Print out the subject, sender, and an initial 200-character snippet of the body for each result.

This lets me do queries like “internship acceptance logistics” or “scholarship thank-you note” and immediately see the most relevant past conversations.

### Incremental updates and deduplication

`append.py` handles new emails without rebuilding the index from scratch:

1. Parse a new `.mbox` file via `parse_mbox`, limiting the number of processed emails for performance.
2. Load existing state if present:

   ```python
   df_existing = pd.read_csv(CSV_PATH).fillna("")
   existing_emails = df_existing["FullText"].tolist()
   index = faiss.read_index(INDEX_PATH)
   ```

3. Filter out duplicates by checking whether each new email’s `FullText` is already in `existing_emails`.
4. Embed only the truly new emails and either:
   - Create a new FAISS index if none exists, or
   - Call `index.add(new_vectors)` to append to the existing index.
5. Concatenate `df_new` with `df_existing` and rewrite `emails.csv`.

This simple deduplication strategy (based on `FullText`) is good enough for my personal use and keeps the index consistent with the metadata.

### Thread reconstruction and dataset generation

`sample_emails.py` and `sample_chains.py` focus on building clean conversational datasets:

- `parse_mbox` extracts:
  - `message_id`, `in_reply_to`, `references`
  - `from`, `to`, `subject`, `date`
  - body text, cleaned via `clean_email_body`
- `clean_email_body`:
  - Selects `text/plain` parts from multipart messages.
  - Passes through `remove_quoted_text` to strip previous replies: lines starting with `>` or containing `"wrote:"` terminate the body.
- `build_threads`:
  - Combines sent and received emails into a single `email_map`.
  - Uses `in_reply_to` and `references` chains to group messages into threads.
  - Filters to threads where at least one message was sent by me (training focus).
  - Sorts threads by recency.

On top of this, I generate `openai_training.jsonl`, where each line is a chat-style conversation:

- `system`: a persona definition like  
  `"This is an email assistant mimicking Isaiah Murray that provides concise and professional responses."`
- `user`: the incoming email.
- `assistant`: my actual reply.

This format is ready for use in OpenAI fine-tuning or similar APIs.

## Results

- Indexed up to several thousand emails into a FAISS index with minimal memory overhead.
- Enabled interactive, semantic search across my personal email in real time from the command line.
- Built a reproducible pipeline from raw Gmail exports to structured CSV, FAISS index, and training-ready JSONL.
- Generated a non-trivial dataset of real email conversations to experiment with a personalized email assistant.

## Lessons Learned

- **Embeddings + FAISS work very well for personal knowledge retrieval**: even a small model like `all-MiniLM-L6-v2` surfaces surprisingly relevant emails.
- **Data cleanliness matters more than model choice at this scale**: decoding issues, multipart bodies, and quoted text removal significantly impact search quality and training data usefulness.
- **Incremental indexing is essential for practicality**: being able to append new emails rather than reindex everything speeds up iteration.
- **Email threading is tricky**: relying on `Message-ID`, `In-Reply-To`, and `References` works, but there are enough inconsistencies that defensive coding and error handling are necessary.
- **JSONL chat formatting simplifies downstream ML**: structuring emails as `[system, user, assistant]` messages keeps the door open for many different LLM workflows.

## Links

- [GitHub Repository](https://github.com/IsaiahJMurray/Gmail-Categorization)
- [Live Demo (coming soon)](#)