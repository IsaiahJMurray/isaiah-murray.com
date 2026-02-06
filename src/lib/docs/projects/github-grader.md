---
title: Github Grader
subtitle: 'An Apple Fitness–style dashboard for developers that visualizes your GitHub
  activity, daily coding stats, and repository health. Built with SvelteKit, it uses
  GitHub OAuth and Octokit APIs to aggregate commits, lines of code, and repo metadata
  into interactive SVG "activity rings" and stat cards.

  '
slug: github-grader
date: '2024-06-24'
updated: '2026-02-06'
tags:
- html
- javascript
- svelte
- sveltekit
maturity: production
featured: false
visibility: public
heroImage: /generated/logos/github-grader.png
---

## Overview

I built **github-grader** as a SvelteKit web app that turns GitHub activity into something that feels more like Apple Fitness rings than a traditional developer dashboard. Instead of raw lists of repositories and commits, the app visualizes daily programming milestones—commits, lines of code, and file changes—as progress rings and simple achievement-style components.

The goal was to explore how to make engineering progress feel more tangible and motivating, while giving me hands-on experience with GitHub OAuth, the Octokit SDK, and SvelteKit's server-side API routes.

---

## Role & Context

I designed and implemented this project end-to-end as a personal learning vehicle and foundation for a more fully featured "programming fitness" app. My responsibilities included:

- Defining the concept and UX direction (Apple Fitness–inspired "rings" for coding activity)
- Implementing GitHub OAuth in a SvelteKit environment with secure cookies
- Building server-side endpoints to aggregate GitHub activity data
- Creating the dashboard UI with reusable Svelte components for repos, medals, and activity rings
- Setting up testing, linting, and formatting for a healthy development workflow

---

## Tech Stack

- Svelte
- SvelteKit
- JavaScript (ES modules)
- HTML / CSS
- Vite
- Octokit (GitHub REST API)
- Playwright (basic E2E tests)
- Prettier + prettier-plugin-svelte
- dotenv
- Node.js

---

## Problem

Developer dashboards often present GitHub data in a way that's useful but not especially motivating: lists of repos, raw commit counts, and activity feeds. I wanted something that:

- Felt **visually rewarding** and quick to interpret at a glance
- Focused on **daily progress**, not long-term vanity metrics
- Used **authentic GitHub data** (repos, commits, code changes) but surfaced it in a way that feels like closing rings in Apple Fitness

Concretely, I needed to solve:

- How to authenticate with GitHub and keep the user session secure
- How to aggregate **today's activity** from GitHub (commits, lines, file changes)
- How to transform repo/activity data into a compact dashboard that encourages regular programming "streaks"

---

## Approach / Architecture

I used SvelteKit's file-based routing to separate concerns cleanly between:

- **Auth routes** (`/api/auth/*`) for GitHub OAuth and user session management
- **GitHub data routes** (`/api/github/*`) for repository and daily activity queries
- **UI routes** for the public landing page (`/`) and the authenticated dashboard (`/dashboard`)

High-level architecture:

**Frontend (Svelte/SvelteKit)**
- `+layout.svelte` handles global navigation and checks the current user via `/api/auth/user`
- `+page.svelte` (root) is a simple welcome page prompting sign-in
- `dashboard/+page.svelte` fetches repos and renders the "fitness-inspired" view with an activity ring and repo cards

**Auth flow**
- `/api/auth/github` redirects to GitHub's OAuth authorize endpoint
- `/api/auth/callback` exchanges the `code` for an access token, fetches the authenticated user via Octokit, and stores both user and token in HTTP-only cookies
- `/api/auth/user` returns the user from a secure cookie for client-side checks
- `/api/auth/signout` clears the cookies

**Data aggregation**
- `/api/github/repositories` uses Octokit to fetch recent repositories and enrich them with pseudo-commit counts, language-based size, and other metadata
- `/api/github/daily-activity` computes "rings metrics" (commits, total lines changed, and file size changes) for **today** using GitHub's search and commit APIs

On the client, components like `DailyActivityWheel.svelte`, `Ring.svelte`, and `Repo.svelte` transform this data into the visual "fitness" metaphor.

---

## Key Features

- GitHub OAuth sign-in with secure, HTTP-only cookie-based sessions
- Apple Fitness–style circular progress visualization of daily coding activity
- Aggregated "today" metrics: commit count, lines of code changed, and file change volume
- Repository grid with per-repo stats (pseudo-commit count and language-based size)
- Personalized dashboard greeting plus dynamic encouragement messages based on progress
- Reusable Svelte components for rings, repos, and medals/achievements
- Basic end-to-end test coverage for the core landing page

---

## Technical Details

### Authentication and Session Handling

I implemented OAuth using GitHub's standard flow and SvelteKit server routes:

**Auth redirect:**
- `src/routes/api/auth/github/+server.js` constructs the GitHub OAuth URL using `GITHUB_CLIENT_ID` from `$env/static/private` and redirects the user
- A static `REDIRECT_URI` points back to `/api/auth/callback` during local development

**Callback and token exchange:**
- `src/routes/api/auth/callback/+server.js`:
  - Reads the `code` query param
  - POSTs to `https://github.com/login/oauth/access_token` with `client_id`, `client_secret`, and `code`, requesting JSON
  - Extracts the `access_token` from the response
  - Uses `Octokit` with that token to call `users.getAuthenticated()` and retrieve user info

**Cookie storage:**
- Stores the serialized user object as `github_user` and the access token as `github_token`:
  - `httpOnly: true` to mitigate XSS
  - `secure` conditioned on `NODE_ENV === 'production'`
  - `maxAge` set to one week
- After setting cookies, redirects to `/dashboard`

**Session endpoints:**
- `api/auth/user`: reads `github_user` from cookies, returns `401` if absent
- `api/auth/signout`: deletes `github_user` and `github_token` cookies, returning `200`

On the client, `+layout.svelte` calls `/api/auth/user` on mount to hydrate the navigation with the current user and to show either "Dashboard / Sign Out" or "Sign In with GitHub."

### GitHub Data Fetching and Aggregation

I used both the Octokit library and a small helper wrapper around `fetch`:

- `src/lib/github.js` exposes:
  - `fetchRepoData(username, token)`
  - `fetchRepoDetails(owner, repo, token)`
  - `fetchCommits(owner, repo, token)`

These are lower-level helpers, but for the dashboard I rely on dedicated API routes built with Octokit.

### Repositories API

`src/routes/api/github/repositories/+server.js`:

- Reads `github_token` from cookies; returns `401` if missing
- Creates an `Octokit` instance: `new Octokit({ auth: token })`
- Calls `octokit.rest.repos.listForAuthenticatedUser({ sort: 'updated', per_page: 10 })` for the 10 most recently updated repositories
- For each repo:
  - Fetches a page of commits via `repos.listCommits({ per_page: 1 })`:
    - Uses the first commit's SHA and converts it into a pseudo-count:  
      `commitCount = commits[0]?.sha ? parseInt(commits[0].sha, 16) % 1000 : 0`  
      This is intentionally approximate and mainly for prototype visualization
  - Fetches language breakdown via `repos.listLanguages()`:
    - Sums the byte counts across languages to get `totalSize`
    - Converts to kilobytes: `Math.round(totalSize / 1024)`

Returns a simplified object for each repo:

```js
{
  name: repo.name,
  description: repo.description || 'No description provided',
  commits_count: commitCount,
  size: Math.round(totalSize / 1024),
  url: repo.html_url,
  language: repo.language,
  stars: repo.stargazers_count
}
```

The client maps this directly into `<Repo />` components.

### Daily Activity API

`src/routes/api/github/daily-activity/+server.js` powers the fitness-style rings:

- Reads `github_token` from cookies; returns `401` if absent
- Creates an `Octokit` instance
- Determines today's date string (`YYYY-MM-DD`)
- Gets the authenticated user via `users.getAuthenticated()` to obtain their login
- Uses GitHub's commit search API:

```js
const { data: commits } = await octokit.rest.search.commits({
  q: `author-date:${today} author:${user.login}`,
  sort: 'author-date',
  order: 'desc',
  per_page: 100
});
```

- Initializes aggregate counters:
  - `totalCommits` from `commits.total_count`
  - `totalLinesAdded`, `totalLinesRemoved`, `totalFileSize` all start at 0
- For each commit in `commits.items`, calls `repos.getCommit` to compute:
  - Sum of `stats.additions` and `stats.deletions`
  - Sum of `file.changes` across all files in the commit
- Returns:

```js
{
  commits: totalCommits,
  linesOfCode: totalLinesAdded + totalLinesRemoved,
  fileSize: totalFileSize
}
```

This compact structure is ideal for rendering progress rings.

### Visualizations & Components

### Activity Ring

`src/lib/components/Ring.svelte` is a generic, multi-layer circular progress component:

- Props:
  - `size`, `strokeWidth`, `backgroundColor`, `showBackground`
  - `layers`: array of `{ startColor, endColor, progress }`
- Derived values:
  - `radius`, `normalizedRadius`, and `circumference`
- Offsets:
  - `calculateOffset(progress)` computes `stroke-dashoffset` from a percentage
  - Each ring layer uses `stroke-dasharray` / `stroke-dashoffset` with a `transform: rotate(-90deg)` to start at the top
- Uses `<defs>` and multiple `<linearGradient>` elements for layered gradients
- Animates via `transition: stroke-dashoffset 1s ease-in-out`

`DailyActivityWheel.svelte` wires this to daily activity metrics:

- On mount:
  - Fetches `/api/github/daily-activity`
  - Handles loading and error states explicitly
- Derives progress from task-based "goals" (hard-coded for now):
  - `commitProgress = min((commits / 10) * 100, 100)`
  - `linesProgress = min((linesOfCode / 1000) * 100, 100)`
  - `fileSizeProgress = min((fileSize / 10000) * 100, 100)`
- Passes three layers to `Ring.svelte`, each with its own color pair

This gives me an extensible visual foundation that can represent any metric as a ring.

### Repo Cards

`src/lib/components/Repo.svelte` displays key repo stats:

- Inputs: `title`, `description`, `commits`, `size`
- Derives `sizeFormatted` as KB or MB based on the numeric size
- Uses a card-style layout with:
  - Hover transform (`translateY(-5px)`) and shadow changes
  - Truncated multi-line descriptions using `-webkit-line-clamp`

The dashboard renders a grid of these cards, each bound to a single item from `/api/github/repositories`.

### Dashboard

`src/routes/dashboard/+page.svelte`:

- Fetches repos from `/api/github/repositories` on mount
- Holds a `rings` placeholder array and uses a helper `getEncouragingPhrase(rings)` to calculate a motivational message based on average progress
- Layout:
  - Header section with:
    - Greeting: `Welcome, {userName}!` (currently a placeholder; can be wired to cookie user)
    - Encouraging phrase
    - Activity wheel component (`<DailyActivityWheel />`)
  - A "Your GitHub Repositories" section with a responsive grid of `<Repo />` cards

### Tooling & Configuration

- **Vite**: SvelteKit plugin and a simple `define` override for `process.env`
- **Playwright**: A minimal test to assert the presence of the landing page `<h1>`
- **Prettier + Svelte plugin**: Ensures code formatting, with a `.prettierrc` tuned for tabs and single quotes
- **Environment management**: `.env` files are ignored; sensitive GitHub credentials are accessed via `$env/static/private`

---

## Results

I delivered a working SvelteKit dashboard that:

- Authenticates with GitHub via OAuth
- Persists sessions with secure HTTP-only cookies
- Aggregates and visualizes daily coding activity
- Presents a readable, motivational overview of a developer's GitHub work

I also created a reusable SVG-based ring component suitable for future "fitness-like" dashboards and established a clean separation between auth, data APIs, and presentation components, making future iterations (e.g., badges, streaks, goals) straightforward.

---

## Lessons Learned

- **SvelteKit's server routes and cookies** provide a clean model for implementing OAuth without needing a separate backend
- **GitHub's search and commit APIs** are powerful but can be expensive; iterating over commits to gather detailed stats requires attention to pagination and performance when scaling beyond a prototype
- **Data shaping on the server** (e.g., pre-aggregating and normalizing fields) greatly simplifies the client, especially when building visual metaphors like progress rings
- **SVG-based components** like `Ring.svelte` benefit from thoughtful abstractions—once the math and gradients were right, reusing the component for multiple layers and metrics became trivial
- Tight **tooling integration** (Prettier, Playwright, strict `.npmrc`) improved developer experience even for a small personal project

---

## Links

- [GitHub Repository](https://github.com/IsaiahJMurray/github-grader)
- [Live Demo](https://example.com) <!-- Replace with actual demo URL if/when deployed -->