---
title: Curator
subtitle: "Curator is a portfolio documentation orchestrator that crawls your GitHub\
  \ repos, asks targeted follow-up questions, and generates rich project writeups\
  \ via the OpenAI Responses API. It\u2019s built for developers and technical creatives\
  \ who want production-grade, auto-updating documentation, with a Flask backend tied\
  \ into GitHub, Cloud SQL, and GCS plus a SvelteKit frontend scaffold for a future\
  \ UI."
slug: curator
date: '2025-10-29'
updated: '2025-11-02'
tags:
- html
- javascript
- python
- svelte
- typescript
- sveltekit
maturity: polished
featured: true
visibility: public
heroImage: /generated/logos/curator.png
accent: '#5ed0ff'
---
## Overview

Curator is a small platform I built to automatically generate high‑quality portfolio documentation for my software projects. It connects to my GitHub account, inspects repositories, uses LLM tools to synthesize structured write‑ups, and persists both the generated documentation and associated project metadata.

The goal is to turn raw repositories into polished, consistent case studies with minimal manual effort.

## Role & Context

I designed and implemented Curator end‑to‑end:

- Defined the workflow for “ingest → analyze → document → store”.
- Implemented the backend service, GitHub integration, and OpenAI orchestration.
- Set up persistence in Google Cloud Storage and Cloud SQL.
- Bootstrapped a SvelteKit frontend as the eventual UI for browsing and triggering documentation runs.

This project started as an internal tool to keep my own portfolio up to date and is evolving toward a more general “documentation curator” for any set of GitHub repos.

## Tech Stack

- Python (Flask backend)
- GitHub API (PyGithub)
- OpenAI API (Responses + tools)
- Google Cloud Storage
- Google Cloud SQL (MySQL via SQLAlchemy + Cloud SQL Connector)
- JavaScript / TypeScript
- Svelte / SvelteKit
- HTML
- Vite

## Problem

Maintaining high‑quality, narrative documentation for multiple projects is time‑consuming and inconsistent. I wanted a system that could:

- Discover my repositories automatically.
- Generate deep, portfolio‑ready write‑ups rather than shallow READMEs.
- Store project metadata, ratings, and tags centrally.
- Keep documentation files synced and retrievable in a reproducible way.

Manual updates across scattered markdown files did not scale and were easy to neglect.

## Approach / Architecture

I split Curator into three main layers:

1. **Backend Orchestrator (Python/Flask)**  
   - Exposes HTTP endpoints for creating projects, listing available repos, and generating documentation.
   - Coordinates between the OpenAI client, the GitHub client, and storage.

2. **Integration & Storage Layer**
   - **GitHubHandler** wraps PyGithub to list repos and fetch file structures and contents (with truncation safeguards).
   - **StorageHandler** manages:
     - Uploading documentation files to a GCS bucket.
     - Persisting project metadata into a Cloud SQL (MySQL) table via SQLAlchemy.
   - **Project / ProjectFlavor** classes define a normalized representation of a documented project.

3. **LLM Documentation Engine**
   - **OpenAIHandler** encapsulates the OpenAI client and a set of tools (functions) that the model can call:
     - `github_file_structure` and `github_file_contents` to inspect repositories.
     - `user_input` for interactive clarification when automation is insufficient.
     - `complete_documentation` to finalize structured metadata and narrative content.
   - **Curator** drives a recursive “investigate and document” loop using OpenAI’s thread API until a full documentation file is produced.

A SvelteKit frontend is scaffolding for a future UI atop this API; at the moment, most interaction is via HTTP requests or Python orchestration.

## Key Features

- Automated project creation and tracking with unique IDs and normalized names.
- GitHub integration for listing repositories and reading files with safety limits.
- OpenAI‑driven documentation pipeline using tool calls for repo inspection.
- Persistent storage of documentation (GCS) and structured metadata (Cloud SQL).
- Support for project “flavor” data: description, quality rating, project code, and tags.
- REST API endpoints to create, retrieve, document, and list projects.
- Extensible tooling interface around OpenAI Responses for future capabilities.

## Technical Details

### Backend Service (Flask)

The main entrypoint is `backend/app.py`. I define routes around a shared `Curator` instance and supporting handlers:

- `POST /create_project`  
  - Accepts JSON with `name` and an optional `repos` list.  
  - Calls `Curator.create_project`, which:
    - Instantiates a `Project` with a new UUID and `formatted_name`.
    - Creates an OpenAI thread via `OpenAIHandler`.
    - Stores the project in an in‑memory list (for this process) and returns serialized metadata.

- `GET /get_project/<name>` and `GET /get_project_by_id/<id>`  
  - First search in‑memory; if not found, fall back to `StorageHandler` to hydrate from SQL.
  - Return 404 if the project does not exist.

- `GET /list_projects`  
  - Uses `GithubHandler.list_repositories()` to list owned GitHub repos.
  - Uses `StorageHandler.get_project_list_sql()` to return known projects from the DB.
  - Computes `documented_projects` as the subset having a non‑null `documentation_file_path`.

- `POST /document_project/<name>`  
  - Loads the project (from memory or SQL).
  - Optionally accepts a specific `model` name.
  - Invokes `Curator.document_project`, which drives the OpenAI‑based investigation.
  - Writes the resulting markdown to GCS as `<formatted_name>_documentation.md`.
  - Updates `project.documentation_file_path` and saves metadata back to SQL.

### Project & Flavor Model

In `backend/handlers/project.py`:

- `Project`  
  - Fields: `id`, `name`, `formatted_name`, `thread`, `repos`, `flavor`, `documentation_file_path`.
  - `formatted_name` is a filesystem‑friendly variant (`lower().replace(" ", "_")`).
  - `load_from_dict` / `load_from_sql` map persisted JSON or SQL rows back to a `Project` instance.
  - `check_for_duplicates` is prepared for enforcing unique names (currently stubbed with `existing_projects`).

- `ProjectFlavor`  
  - Holds human‑facing portfolio metadata: `description`, `project_code`, `quality`, `tags`.
  - Designed so the `complete_documentation` tool can emit both narrative content and these structured fields together.

### GitHub Integration

`backend/handlers/github_handler.py` wraps PyGithub:

- Authentication uses a GitHub token from the environment; I create an authenticated `Github` client and user handle.
- `list_repositories`  
  - Returns a simple list of repo names where I’m the owner.

- `_to_full_name`  
  - Normalizes repository identifiers to `owner/repo` if just `repo` is provided.

- `get_repository`  
  - Returns a PyGithub `Repository` object, with exception handling for missing or inaccessible repos.

- `get_file_contents`  
  - Fetches file contents via GitHub’s API, decodes bytes, and:
    - Truncates to `max_chars` (default 8000).
    - Appends a clear truncation notice when needed.
    - Returns a placeholder string if the file is binary / undecodable.

- `get_file_structure` (partial in snippet)  
  - Recursively walks the repo tree to gather file structure up to a configurable depth and item count, which is then exposed as a tool to the OpenAI side.

These functions are directly surfaced as tools inside `OpenAIHandler` so the model can “pull” what it needs rather than being pre‑fed entire repos.

### Storage Layer

`backend/handlers/storage_handler.py` connects Curator to Google Cloud:

- **Initialization**
  - Expects `GOOGLE_CLOUD_BUCKET` to be set; uses it to initialize a `storage.Client` and bucket instance.
  - Builds a Cloud SQL connection pool via the Cloud SQL Connector and SQLAlchemy:
    - Reads `DB_PROJECT`, `DB_REGION`, `DB_INSTANCE`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`, and `PRIVATE_IP`.
    - Creates a `mysql+pymysql://` engine with a custom `creator` that dials the Cloud SQL instance.

- **Documentation files**
  - `save_documentation_file(filename, content)` uploads content to `documentation/<filename>` in the bucket.
  - `load_documentation_file(filename)` downloads the file as text with 404 handling (`google.cloud.exceptions.NotFound`).

- **Project metadata**
  - `save_project_metadata_sql(project)` serializes `project.to_dict()` and inserts (or upserts) into a `projects` table, including:
    - `id`, `name`, `metadata` JSON
    - `documentation_file_path`
    - `thread`, `repos`, `project_code`, `quality`, `tags`, `description`
  - Complementary helpers (not fully shown) load metadata, list projects, and map names to IDs.

This design keeps large markdown files in object storage while centralizing a small, queryable slice of metadata in SQL.

### OpenAI Orchestration

`backend/handlers/openai_handler.py` encapsulates the OpenAI client and defines the tool schema. The tools include:

- `user_input`  
  - Allows the model to surface clarifying questions to a user when automated inspection is insufficient.

- `github_file_structure` / `github_file_contents`  
  - Bridge to `GithubHandler` to explore the repo file tree and read contents selectively.

- `complete_documentation`  
  - Finalization tool: the model calls this once it has gathered enough context to emit a full documentation artifact plus `project_code`, `description`, `quality`, and `tags`.

`backend/curator.py` wires this together:

- On initialization:
  - Loads environment variables.
  - Instantiates `OpenAIHandler`, `GithubHandler`, and `StorageHandler`.
  - Maintains an in‑memory `projects` list.

- `create_project`  
  - Creates a project and starts an OpenAI thread for its documentation lifecycle.

- `get_project_by_name` / `get_project_by_id`  
  - Resolve from in‑memory or from SQL via `StorageHandler`.

- `recursively_investigate`  
  - Seeds the OpenAI thread with a system message instructing it to:
    - Document a given project, using available repos and tools.
    - Speak from my perspective.
    - Avoid meta‑AI phrasing in the final output.
  - Iterates through response objects, executing any tool calls (GitHub, user_input, etc.) and feeding results back into the thread until `complete_documentation` is invoked.
  - Returns the final documentation markdown string.

This pattern separates orchestration logic from tool implementation and allows complex multi‑step documentation flows without the API consumer managing that complexity directly.

### Frontend (SvelteKit)

In `frontend/curator-app` I scaffolded a SvelteKit application:

- Uses `@sveltejs/kit` with the `adapter-auto` and Vite.
- TypeScript is enabled with strict compiler options and `$lib` aliasing.
- The current route (`+page.svelte`) is still the default SvelteKit starter; it’s a placeholder for a future UI that will:
  - List repositories and curated projects.
  - Trigger documentation runs.
  - Render generated markdown in a portfolio‑style layout.

The frontend is intentionally minimal at this stage while I iterate on the backend capabilities.

## Results

- I can programmatically create “projects” that aggregate one or more GitHub repositories.
- For each project, Curator can:
  - Investigate repositories using the GitHub API and OpenAI tools.
  - Generate long‑form markdown documentation, including architecture and feature breakdowns.
  - Persist the documentation to GCS and associated metadata to Cloud SQL.
- This has already been used to generate detailed documentation for other projects (e.g., “Egg Lathe”, “Ontology”), demonstrating that the pipeline works across heterogeneous repositories.

## Lessons Learned

- Tool‑driven LLM workflows work best when the tools are narrowly focused and have strong guardrails (e.g., truncation, max depth, max items).
- Persisting both raw documentation and a normalized metadata layer (description, tags, quality) makes it much easier to build higher‑level experiences (search, filtering, portfolio views) later.
- Cloud SQL Connector plus SQLAlchemy provides a flexible way to treat Cloud SQL almost like any local database while still benefiting from managed infrastructure.
- Designing prompts and system messages so the model writes from my perspective, without AI meta‑commentary, requires explicit constraints and careful testing.

## Links

- [GitHub Repository](https://github.com/IsaiahJMurray/Curator)
- Demo (TBD)