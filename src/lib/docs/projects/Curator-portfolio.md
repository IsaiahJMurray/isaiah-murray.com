# Curator

## Overview

Curator is my first end‑to‑end system for automating portfolio‑quality documentation from raw GitHub repositories.

Instead of writing every project case study by hand, I wanted a pipeline that could:

- Inspect a repo’s structure and source files
- Ask clarifying questions
- Generate a polished, hiring‑friendly technical narrative
- Persist that documentation so it can be served via a frontend or personal site

Curator does this by combining:

- A Flask backend that orchestrates GitHub access, storage, and LLM calls  
- An OpenAI‑driven documentation workflow that iteratively explores codebases via tools  
- Cloud persistence with Google Cloud Storage and Cloud SQL (MySQL)  
- A SvelteKit frontend scaffold to eventually browse curated projects

I’ve already used Curator to generate substantial documentation for several of my own projects (e.g., Ontology, Egg‑Lathe, Binaric). Those artifacts live in this repo as concrete, dog‑fooded examples of what the system can produce.

---

## My Role

I designed and built Curator entirely myself:

- Identified the problem and shaped the product concept  
- Designed the overall architecture and data model  
- Implemented the Flask backend and handler abstractions  
- Integrated GitHub (via PyGithub), OpenAI, Google Cloud Storage, and Cloud SQL  
- Defined the LLM tool‑calling workflow for repo introspection and documentation generation  
- Scaffolded the SvelteKit frontend that will become the UI for managing curated projects  
- Used Curator to generate documentation for real projects and iterated based on those results

Because it’s a solo project, I leaned heavily on clear subsystem boundaries and modularization so I can evolve or replace components (e.g., OpenAI versions, storage backends, or UI frameworks) without rewriting the entire system.

---

## Tech Stack

**Backend**

- Python  
- Flask (HTTP API)  
- PyGithub (GitHub integration)  
- OpenAI Python SDK (LLM + tools)  
- Google Cloud Storage (documentation artifacts)  
- Cloud SQL (MySQL) + Cloud SQL Python Connector (project metadata)

**Frontend**

- Svelte 5  
- SvelteKit 2  
- Vite  
- TypeScript

**Other**

- JSON‑based project descriptors (e.g., `projects/ontology.json`)  
- Markdown + JSON outputs as portfolio‑ready documentation artifacts  

---

## Architecture & Key Features

### High‑Level Architecture

Curator’s backend is organized around a single orchestration class, `Curator`, which coordinates three major subsystems:

1. **GitHub Integration – `GithubHandler`**
   - Authenticates using a GitHub personal access token via PyGithub
   - Lists repositories and retrieves repository metadata
   - Recursively walks a repo’s file tree
   - Reads file contents (with optional truncation for large files)
   - Generates both structured (JSON‑like) and compact textual views of a repository

2. **Persistence Layer – `StorageHandler`**
   - Persists documentation artifacts to a Google Cloud Storage bucket
   - Stores project metadata (name, repo, description, flavor, docs path, etc.) in a MySQL `projects` table (Cloud SQL)
   - Maps between rows in the database and the in‑memory `Project` model
   - Handles create, update, and lookup operations for curated projects

3. **AI Orchestration – `openai_handler`**
   - Wraps the OpenAI Python SDK’s thread‑based, tool‑using model
   - Defines tools that allow the model to:
     - Inspect repository structures and files via `GithubHandler`
     - Ask clarification questions via a “user prompt” tool
     - Emit final documentation via a “produce docs” tool
   - Manages conversation threads for each project, so generation can be iterative or revisited

On top of these, the **Flask API (`backend/app.py`)** exposes endpoints that:

- List GitHub repos for the authenticated user
- Create new Curator projects
- Trigger documentation generation for a project
- Retrieve saved project metadata and documentation

A **SvelteKit frontend scaffold** (`frontend/curator-app`) exists to evolve into a web interface where I can:

- Browse my repos
- Kick off curation runs
- View and manage generated project pages

Right now it’s deliberately minimal—just the framework, configuration, and a placeholder landing page—because most of the complexity is in the backend orchestration.

---

### Key Features

#### 1. Orchestrated, Tool‑Driven Documentation Generation

Most “AI documentation” solutions are a single prompt pasted into a chatbox. Curator treats documentation generation as a **multi‑step pipeline**:

1. Curator creates a project with metadata (name, repo, tags, “flavor”).
2. The OpenAI backend starts a conversation thread tied to that project.
3. The model uses tools to:
   - Enumerate the repository structure
   - Pull specific files or file ranges it needs
   - Optionally query the user for clarifications
4. Once it has enough context, the model calls a tool that emits the final documentation (JSON or Markdown).
5. Curator stores that artifact via `StorageHandler` and links it to the project.

This approach lets the model explore the repo **on demand** instead of being constrained by a static context window or a one‑shot prompt.

#### 2. Rich Project & “Flavor” Modeling

The `Project` and `ProjectFlavor` classes (`backend/handlers/project.py`) capture more than a repo URL:

- Basic metadata  
  - `id`, `name`, `description`, tags, GitHub repo URL, etc.  
- Documentation pointers  
  - Paths in Google Cloud Storage or in‑repo docs files  
- “Flavor” metadata  
  - Quality scores, tone, and descriptive tags that shape how the LLM writes  
  - For example, a project can be tagged as “pedagogical,” “hiring‑focused,” etc.

These models can be:

- Loaded from JSON descriptors (`projects/ontology.json`)  
- Hydrated from MySQL rows  
- Initialized from previously generated documentation

That flexibility makes it easy to integrate Curator into future UIs or pipelines without re‑architecting the core.

#### 3. Cloud‑Native Storage

I built Curator as if it were going to run as a real service:

- **Documentation artifacts** go to a configured Google Cloud Storage bucket.  
- **Metadata** (project records, doc paths, flags) live in a Cloud SQL MySQL instance.  
- Connections are handled via the Cloud SQL Python Connector, so the app is deployable onto GCP without hard‑coded IPs or ad‑hoc tunnels.

This separation of artifacts vs. metadata also makes it straightforward to:

- Mirror docs to a static site  
- Query projects via SQL or an admin UI  
- Swap storage backends in the future if needed

#### 4. Dogfooded Documentation Artifacts

The repo includes multiple, fully‑generated documentation files, produced by Curator itself:

- `documentation/ontology_documentation.md`
- `documentation/Egg Lathe_documentation.md` and `documentation/egg-lathe_documentation.md`
- `Binaric_response.json`
- `Ontology_response.json`

These act both as **test fixtures** and **portfolio pieces**. I used them to validate that the pipeline can produce:

- Architecture overviews
- Module breakdowns
- Data flow descriptions
- Setup and usage instructions
- Future‑work sections

They’re also representative of the kind of narrative I want recruiters or collaborators to see.

---

## Challenges & Solutions

### 1. OpenAI Version & API Compatibility

**Challenge:**  
While building the AI orchestration layer, I ran into compatibility issues across different OpenAI API versions and SDK changes (especially around tools/function calling and how conversations are managed).

**What I did:**

- Wrapped all OpenAI interactions in a dedicated `openai_handler` module with a narrow interface:
  - “Create or get thread”
  - “Send message and run tools”
  - “Emit final documentation”
- Kept all explicit SDK calls (model IDs, tool schemas, thread APIs) inside that handler.
- Treated the handler as a replaceable subsystem so I can upgrade SDK versions or even swap providers without touching the rest of the app.

**Result:**  
The rest of the system (Flask routes, `Curator`, `Project`) depend only on my abstraction, not the raw SDK. That isolated the churn and made it safer to iterate on the LLM workflow.

### 2. Designing for Modularity From Day One

**Challenge:**  
Because I’m the only developer and this is a v1, it’s tempting to hard‑wire everything: GitHub, storage, and OpenAI calls all in one file. That would have made the project hard to evolve.

**What I did:**

- Divided responsibilities into explicit handlers:
  - `GithubHandler` for GitHub
  - `StorageHandler` for persistence
  - `openai_handler` for AI
  - `Curator` as the orchestrator
- Gave each handler a clear, small public API (e.g., `list_repos`, `get_file_contents`, `save_documentation`, `get_project`).
- Ensured `Curator` mostly composes these APIs rather than doing heavy work itself.

**Result:**  
Subsystem modularity is now a first‑class design goal. That will matter when I:

- Move this experience into an iOS app (my long‑term idea)  
- Add alternative storage (local, S3)  
- Experiment with non‑OpenAI models

---

## Results & Impact

Curator is intentionally labeled as “not finished,” but it already delivers several