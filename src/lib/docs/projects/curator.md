---
title: Curator
subtitle: "An AI-powered portfolio documentation engine that crawls your GitHub repos,\
  \ synthesizes deep project writeups, and stores them as reusable metadata. Built\
  \ with a Python/Flask backend orchestrating OpenAI tools, GitHub\u2019s API, and\
  \ Cloud SQL/Storage, plus a SvelteKit frontend scaffold ready for an interactive\
  \ project catalog UI."
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

Curator is an automation tool that turns raw GitHub repositories into polished portfolio documentation. It connects to my GitHub account, lets me register “projects” composed of one or more repos, recursively inspects their structure and contents using the OpenAI API, and then generates rich Markdown case studies that I can store, retrieve, and serve through a web frontend.

The goal is to remove as much manual boilerplate as possible from documenting complex, multi-repo projects while still giving me full control over how those projects are presented.

## Role & Context

I designed and built Curator end-to-end:

- Defined the data model for projects and “flavor” metadata (description, quality score, tags, project code).
- Implemented the backend service that orchestrates GitHub, OpenAI, and storage.
- Wired up persistence using Google Cloud Storage and Cloud SQL.
- Bootstrapped a SvelteKit frontend as the basis for an eventual interactive UI for browsing and triggering documentation runs.

This project grew out of a need to keep my own projects documented and presentable without rewriting the same narrative structures for every repo.

## Tech Stack

- Python (Flask backend)
- GitHub REST API via `PyGithub`
- OpenAI Responses API
- Google Cloud Storage (documentation files)
- Google Cloud SQL (MySQL) via SQLAlchemy + Cloud SQL Connector
- SvelteKit (Svelte + TypeScript, Vite)
- HTML / JavaScript (frontend runtime environment)
- dotenv-based configuration

## Problem

Documenting software projects for a portfolio is repetitive and time-consuming:

- Each project often spans multiple repositories and languages.
- The same questions need to be answered every time (overview, architecture, key features, lessons).
- Manually reading the codebase to reconstruct a high-level narrative is error-prone and doesn’t scale as projects evolve.
- I wanted the ability to centralize project metadata (quality rating, tags, documentation path) and regenerate narratives as repos change.

I needed a system that could:

- Discover and summarize repository contents programmatically.
- Use an LLM to infer a coherent story and technical breakdown.
- Persist the resulting documentation and metadata in a way that’s easy to surface on a portfolio site.

## Approach / Architecture

At a high level, Curator is a backend service with three main concerns:

1. **Project lifecycle and metadata**
   - A `Project` represents a portfolio item: it has a name, a UUID, associated GitHub repos, an OpenAI thread id, and a `ProjectFlavor` (description, project code, quality, tags).
   - Metadata is stored in Cloud SQL and mirrored into JSON files when needed.
   - A duplicate check prevents conflicting project names.

2. **Automated documentation generation**
   - A `Curator` class orchestrates:
     - GitHub exploration via `GithubHandler` (file structure and file contents).
     - Iterative prompt/response cycles with the OpenAI Responses API (`OpenAIHandler`), including tool calls.
     - User questions via a `user_input` tool when the model can’t infer something from code alone.
   - When the model has enough context, it calls a `complete_documentation` tool to emit a fully formatted Markdown document plus flavor metadata.

3. **Storage and serving layer**
   - `StorageHandler` abstracts:
     - Writing documentation Markdown to Google Cloud Storage under a `documentation/` prefix.
     - Saving and loading project metadata from Cloud SQL using a connection pool backed by the Cloud SQL Connector.
     - Listing stored projects and their documentation paths for use in a frontend.
   - A small Flask app exposes REST endpoints to create projects, trigger documentation, and fetch project data.

On top of this, I scaffolded a SvelteKit app as the future UI layer, currently still in template state but wired with a modern TypeScript build.

## Key Features

- Automated creation of portfolio “projects” from GitHub repositories.
- Deep GitHub integration for listing repos and reading file structures/contents.
- LLM-driven documentation pipeline with tool calls and optional interactive user input.
- Persistent storage of generated Markdown in Google Cloud Storage.
- SQL-backed metadata layer for querying and listing documented projects.
- REST API for creating, retrieving, listing, and documenting projects.
- SvelteKit frontend scaffold for a future interactive dashboard.

## Technical Details

### Backend service (Flask)

The Flask app in `backend/app.py` exposes endpoints such as:

- `POST /create_project`
  - Body: `{ "name": "Ontology", "repos": ["Ontology"] }`
  - Uses `Curator.create_project` to allocate a new `Project`, including a fresh OpenAI thread.
- `GET /get_project/<name>`
  - Loads a project either from the in-memory list or via `StorageHandler.get_id_from_project_name_sql` + `load_project_metadata_sql`.
- `GET /get_project_by_id/<id>`
  - Similar lookup by UUID.
- `GET /list_projects`
  - Uses `GithubHandler.list_repositories` to enumerate GitHub repos for the authenticated user.
  - Fetches all stored project records from SQL and returns:
    - `repositories`: raw repo names.
    - `projects`: stored project metadata.
    - `documented_projects`: list of project IDs with a non-null `documentation_file_path`.
- `POST /document_project/<name>`
  - Fetches a `Project` by name.
  - Accepts an optional `model` in the JSON body.
  - Calls `Curator.document_project` (internally `recursively_investigate`) to drive the OpenAI pipeline.
  - Saves the Markdown both as a blob in Cloud Storage and updates the project row in SQL with the documentation path.

All responses are JSON, with standard HTTP status codes (201 on creation, 404 on not found, 500 on unhandled exceptions).

### Core orchestration (`Curator`)

The `Curator` class ties together OpenAI, GitHub, and storage:

- On initialization:
  - Loads environment variables via `dotenv`.
  - Creates an `OpenAIHandler` with the `OPENAI_API_KEY`.
  - Creates a `GithubHandler` with `GITHUB_TOKEN`.
  - Instantiates `StorageHandler`, which in turn initializes a Cloud Storage client and a Cloud SQL engine.
- `create_project(name, repos=[])`:
  - Allocates a new OpenAI thread via `openai_handler.create_thread()`.
  - Creates a `Project` with that thread ID and the provided repo list.
- `get_project_by_*`:
  - Uses in-memory cache first, then falls back to SQL via `StorageHandler`.
- `recursively_investigate(project, model=None, input=None)`:
  - Seeds an OpenAI Responses API call with a system-style message instructing the model to:
    - Document the named project from the associated repos.
    - Use tools to gather repo structure and file contents.
    - Ask the user for clarification via `user_input` when needed.
    - Produce text written from my perspective for a portfolio.
  - The `OpenAIHandler` is configured with tools:
    - `user_input` – prompts me with questions if more context is required.
    - `github_file_structure` – wraps `GithubHandler.get_file_structure`.
    - `github_file_contents` – wraps `GithubHandler.get_file_contents`.
    - `complete_documentation` – once called, returns a structured payload including:
      - A full Markdown documentation string.
      - A project code, description, quality rating, and tags.
  - The method loops through the response stream, executes tool calls, feeds results back into the thread, and continues until `complete_documentation` is invoked.
  - The resulting documentation is then persisted by `StorageHandler`.

### Project and flavor modeling

`backend/handlers/project.py` defines:

- `ProjectFlavor`:
  - Fields: `description`, `project_code`, `quality`, `tags`.
  - `load_from_dict` and `to_dict` for JSON/SQL bridging.
- `Project`:
  - Fields: `name`, `formatted_name`, `id`, `thread`, `repos`, `flavor`, `documentation_file_path`.
  - Methods:
    - `load_from_dict` / `load_from_sql` – reconstruct instances from stored data, including flavor fields and tags JSON.
    - `check_for_duplicates` – guards against multiple projects with the same name (currently using a placeholder list; designed to be extended to a global registry).

### GitHub integration

`backend/handlers/github_handler.py` uses `PyGithub` to talk to the GitHub API:

- Authentication:
  - Uses a personal access token from `GITHUB_TOKEN`.
  - Initializes a `Github` client and binds `self.user` to the authenticated user object.
- `list_repositories()`:
  - Returns a list of repo names for which the authenticated user is the owner.
- `_to_full_name(repo_name)`:
  - Normalizes plain repo names to `owner/repo` by prefixing with `self.user.login` when necessary.
- `get_repository(repo_name)`:
  - Wraps `client.get_repo` with error handling, returning `None` on failure.
- `get_file_contents(repo_name, file_path, max_chars=8000)`:
  - Retrieves and decodes file contents.
  - If the decoded text exceeds `max_chars`, returns a truncated string with an explicit truncation notice appended.
  - Returns a placeholder string for binary/undecodable content.
- `get_file_structure(...)`:
  - Recursively walks the repository tree up to a configurable `max_depth` and `max_items`, returning a structured or textual representation for the LLM.

These methods are exposed to the OpenAI tooling layer as `github_file_structure` and `github_file_contents`.

### Storage and persistence

`backend/handlers/storage