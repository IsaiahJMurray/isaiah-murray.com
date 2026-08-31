---
title: Gmail Categorization
subtitle: 'Semantic search engine over your Gmail archive that finds relevant emails
  by meaning, not just keywords. Built for power users who live in their inbox and
  want fast retrieval and training data for AI email assistants.

  '
slug: gmail-categorization
date: '2025-03-05'
updated: '2026-02-06'
tags:
- python
- machine-learning
- nlp
- faiss
- email
maturity: prototype
featured: false
visibility: unlisted
heroImage: /generated/logos/gmail-categorization.png
---

## Overview

I built Gmail-Categorization as an experiment in local, privacy-preserving semantic search for my personal email archive. Instead of relying on keyword matching, I use sentence embeddings and FAISS vector indexing to find relevant emails based on meaning. The system parses MBOX files, threads conversations, cleans email bodies, and generates training data for personalized email assistants.

The project emerged from my frustration with Gmail's search limitations. I often remember the gist of an email—"something about a project timeline" or "that introduction for an internship"—but not the exact keywords. Traditional search fails in these scenarios, so I wanted a system that understands semantic similarity rather than just lexical matches.

Beyond search, I also wanted to extract structured conversation data from my email history to train AI models that could eventually draft replies in my voice and style.

---

## Role & Context

I developed this project solo as both a productivity tool and machine learning infrastructure experiment. My primary goals were to index a large personal email corpus efficiently on my local machine, explore semantic search with transformer embeddings, and prototype dataset creation for personalized email assistance.

The project represents my approach to building privacy-first ML tools—keeping sensitive data local while leveraging modern NLP techniques for practical applications.

---

## Tech Stack

- **Python** — Core language for all components
- **FAISS** — Facebook AI Similarity Search for vector indexing
- **sentence-transformers** — Specifically `all-MiniLM-L6-v2` for embeddings
- **pandas** — Data manipulation and CSV handling
- **NumPy** — Numerical operations for embeddings
- **mailbox & email** — Python standard libraries for MBOX parsing
- **tqdm** — Progress bars for long-running operations

---

## Problem

Traditional email search relies heavily on keyword matching, which fails in several common scenarios:

- **Vague recollection**: I remember an email "about a project timeline" but not the specific phrasing, sender, or subject line
- **Semantic queries**: Finding "all emails where I promised to follow up" or "introductions I received for internships" requires understanding meaning, not just text matching
- **ML training data**: Building models on email history requires structured, de-duplicated, thread-aware datasets

I needed a local toolchain that could ingest Gmail archives, clean and normalize content, index emails using semantic embeddings, support incremental updates, and generate conversation-level data suitable for fine-tuning language models.

---

## Approach / Architecture

I designed the system as a collection of focused scripts rather than a monolithic application, allowing each component to evolve independently:

**Ingestion & Indexing (`main.py`)**
- Reads multiple MBOX files using Python's `mailbox` module
- Normalizes messages into structured tuples: `(Subject, Sender, Body, FullText)`
- Encodes full text using sentence-transformers
- Builds FAISS L2 index and saves alongside CSV metadata

**Incremental Updates (`append.py`)**
- Parses new MBOX data and de-duplicates against existing entries
- Encodes only new messages and appends vectors to existing index
- Merges metadata and persists updated CSV and index files

**Semantic Search (`search.py`)**
- Loads saved FAISS index and email metadata
- Encodes free-text queries into the same embedding space
- Retrieves top-k nearest emails with subject, sender, and snippets

**Threading & Dataset Creation (`sample_emails.py`, `sample_chains.py`)**
- Parses MBOX files into structured message objects with threading fields
- Cleans bodies by stripping quoted previous messages
- Reconstructs conversation threads and filters for those containing my replies
- Exports conversation snippets as JSONL training data

---

## Key Features

- Semantic email search using transformer embeddings and FAISS indexing
- Local, file-based persistence with `email_index.faiss` and CSV metadata
- Incremental index updates with automatic de-duplication
- Robust MBOX parsing with defensive handling of missing fields and encoding issues
- Thread reconstruction using `In-Reply-To` and `References` headers
- Email body cleaning to remove quoted reply chains
- JSONL training sample generation for personalized email assistants

---

## Technical Details

### Email Extraction and Normalization

The ingestion pipeline starts by defining MBOX paths and loading the sentence transformer model:

```python
MBOX_PATHS = ["raw_mail/Important.mbox", "raw_mail/Sent.mbox"]
MAX_EMAILS = 5000
model = SentenceTransformer("all-MiniLM-L6-v2")
```

I use Python's `mailbox.mbox` interface to iterate through messages, handling missing fields defensively:

- Subject defaults to `"(No Subject)"` if absent
- Sender defaults to `"Unknown Sender"`
- Body extraction uses `msg.get_payload(decode=True)` with UTF-8 decoding and `errors="ignore"`

Each email gets consolidated into a `FullText` block for embedding:

```python
full_text = f"Subject: {subject}\nSender: {sender}\nBody: {body}"
emails.append((subject, sender, body, full_text))
```

To manage memory and keep the prototype index manageable, I sample a maximum number of emails per MBOX file and use `random.sample` if any mailbox exceeds the quota.

### Embedding and Vector Indexing

I encode the `FullText` column using the sentence transformer and build a FAISS index:

```python
email_vectors = model.encode(df["FullText"].tolist(), convert_to_numpy=True)
d = email_vectors.shape[1]
index = faiss.IndexFlatL2(d)
index.add(email_vectors)
faiss.write_index(index, "email_index.faiss")
```

I chose `IndexFlatL2` for its simplicity and predictable behavior. For this dataset size, brute-force L2 search provides acceptable performance while avoiding the complexity of approximate methods.

### Incremental Updates and De-duplication

The append workflow in `append.py` handles new messages efficiently:

1. Load existing index and CSV if present, otherwise initialize empty structures
2. Parse new MBOX file into email tuples
3. De-duplicate by checking if each new email's `FullText` already exists:

```python
filtered_emails = [email for email in new_emails if email[3] not in existing_emails]
```

4. Encode only filtered emails and add vectors to the FAISS index
5. Concatenate existing and new DataFrames and persist to CSV

This append-only approach avoids rebuilding the entire index for incremental updates.

### Semantic Search Interface

The search component loads the shared model and index:

```python
model = SentenceTransformer("all-MiniLM-L6-v2")
index = faiss.read_index("email_index.faiss")
df = pd.read_csv("emails.csv").fillna("")
```

For any text query, I encode it and search the vector space:

```python
query_vector = model.encode([query], convert_to_numpy=True)
distances, indices = index.search(query_vector, top_n)
results = df.iloc[indices[0]]
```

The interface runs as a simple REPL, displaying results with subject, sender, and the first 200 characters of the body as a snippet.

### Thread Reconstruction and Training Data

The threading components extract structured conversation data:

- Parse headers including `Message-ID`, `In-Reply-To`, `References`, `From`, `To`, `Subject`, and `Date`
- Clean email bodies using `clean_email_body` to strip quoted history
- Remove lines starting with `>` or containing `"wrote:"`
- Handle multipart messages by selecting `text/plain` parts

The `build_threads` function uses `defaultdict(list)` to map messages by ID and attach replies using direct `in_reply_to` references or fallback scanning of `references` fields. I filter threads to include only those containing at least one of my sent messages.

The resulting conversation structures export to `openai_training.jsonl` with each line containing:
- A `system` message defining my email response style
- A `user` message with the incoming email
- An `assistant` message with my actual reply

---

## Results

I successfully indexed thousands of personal emails into a FAISS vector store with minimal memory overhead. The semantic search delivers intuitive behavior—I can describe emails in natural language and retrieve relevant messages even when keywords and phrasing differ significantly from my query.

The incremental update workflow maintains index and CSV synchronization as new mail exports become available. I've generated a real-world, thread-aware dataset suitable for training personalized email assistants using actual conversation patterns from my email history.

---

## Lessons Learned

**Data hygiene is critical** before any ML work can be effective. Handling missing headers, inconsistent encodings, and multipart messages requires defensive programming throughout the pipeline.

**Simple FAISS configurations are often sufficient**. For modest corpus sizes, `IndexFlatL2` with good embeddings outperforms complex approximate methods while remaining easier to debug and reason about.

**De-duplication strategy needs refinement**. Using `FullText` as a uniqueness key works initially but could be improved with message IDs or content hashes for better robustness.

**Thread reconstruction is subtle**. Email headers like `In-Reply-To` and `References` can be incomplete or inconsistent. A conservative threading approach avoids mis-grouping conversations but leaves room for more sophisticated reconstruction algorithms.

**Real conversation data is invaluable** for training personalized models. Actual email threads provide rich examples of tone, structure, and reply patterns that synthetic data cannot replicate.

---

## Links

- [GitHub Repository](https://github.com/IsaiahJMurray/Gmail-Categorization)
- Demo: _TBD_