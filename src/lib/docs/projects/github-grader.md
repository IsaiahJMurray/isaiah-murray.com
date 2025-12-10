---
title: Github Grader
subtitle: "An Apple Fitness\u2013style dashboard for developers that visualizes your\
  \ daily GitHub activity and repository stats as motivational rings and medals. Built\
  \ with SvelteKit, it uses GitHub OAuth and the Octokit API to aggregate commits,\
  \ lines of code, and repo metadata into an interactive, progress-focused coding\
  \ overview."
slug: github-grader
date: '2024-06-24'
updated: '2024-07-11'
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

I built **github-grader** as a SvelteKit web app that turns GitHub activity into an Apple Fitness–style experience. Instead of closing activity rings with steps or workouts, users “close” their rings with commits, lines of code, and file changes. The app authenticates with GitHub, fetches live development activity, and visualizes it through animated rings, medals, and repository cards so that progress on coding goals feels more tangible and rewarding.

## Role & Context

I designed and implemented this project end-to-end as a personal experiment in:

- Using SvelteKit for a full-stack SPA with server routes
- Integrating with the GitHub API and OAuth
- Translating raw developer metrics into a simple, visual feedback loop inspired by Apple’s fitness UI

The project started as a scratchpad SvelteKit app and evolved into a minimal but complete GitHub dashboard focused on motivation, not just analytics.

## Tech Stack

- Svelte 4
- SvelteKit 2
- JavaScript (ES Modules)
- HTML/CSS
- Vite
- Playwright (E2E tests)
- Octokit (GitHub REST API client)
- dotenv / SvelteKit `$env` for configuration
- Prettier + prettier-plugin-svelte for formatting

## Problem

Typical GitHub dashboards are data-heavy and motivation-light. They show contribution graphs, stars, and commit histories, but they do not answer a simple question: **“Did I make meaningful progress on my coding practice today?”**

I wanted:

- A **daily** view of progress that feels like closing Apple Fitness rings
- A simple, encouraging dashboard instead of dense analytics
- A way to surface **recent repo activity** with enough context to feel rewarding, not overwhelming

## Approach / Architecture

I used SvelteKit’s file-based routing and server endpoints to keep the architecture lightweight:

- **Frontend UI (Svelte components)**  
  - A `DailyActivityWheel` made of layered `Ring` components for Apple-style rings  
  - `Repo` cards for recently updated repositories  
  - A simple layout with navigation and authentication-aware header

- **Backend-in-the-frontend (SvelteKit server routes)**  
  - `/api/auth/*` routes handle GitHub OAuth and cookie-based session management
  - `/api/github/repositories` and `/api/github/daily-activity` call GitHub via Octokit from the server
  - All GitHub calls run server-side to keep tokens out of the client

- **Auth & Session**  
  - GitHub OAuth 2.0 with `GITHUB_CLIENT_ID` and `GITHUB_CLIENT_SECRET` in private env vars  
  - Tokens and user info stored in **HTTP-only cookies**, checked on each API call

The result is a single SvelteKit app that owns both UI and data access, with minimal external dependencies beyond GitHub.

## Key Features

- GitHub OAuth login with secure, HTTP-only cookie sessions
- Apple Fitness–style **daily activity rings** for:
  - Commits
  - Lines of code changed
  - File change volume
- Personalized dashboard with an encouraging, progress-based message
- Repository grid showing recent repos with:
  - Commit-based “activity” score
  - Approximate repo size (from language usage)
- Reusable `Ring` component with layered gradients and animated stroke offsets
- Simple sign-out flow that clears session cookies and returns users to Home

## Technical Details

### Authentication & Session Handling

- **OAuth flow**:
  - `GET /api/auth/github` constructs and redirects to the GitHub authorization URL using `GITHUB_CLIENT_ID` and a fixed `REDIRECT_URI`.
  - `GET /api/auth/callback` receives the `code`, exchanges it for an access token via `https://github.com/login/oauth/access_token`, and validates that an `access_token` exists.
- **User fetch & cookies**:
  - Once the token is obtained, I initialize an `Octokit` instance and call `octokit.rest.users.getAuthenticated()` to fetch the logged-in user.
  - Two cookies are set:
    - `github_user`: serialized user object
    - `github_token`: raw access token
  - Both cookies:
    - `httpOnly: true`
    - `secure: process.env.NODE_ENV === 'production'`
    - `maxAge` set to one week
- **Session utilities**:
  - `GET /api/auth/user` reads `github_user` from cookies and returns `401` if it’s absent.
  - `POST /api/auth/signout` deletes `github_user` and `github_token` cookies and returns a `200`.

The root layout (`src/routes/+layout.svelte`) calls `/api/auth/user` on mount to determine whether to show “Sign In with GitHub” or “Dashboard / Sign Out” links. The `signOut` handler calls `/api/auth/signout` and uses SvelteKit’s `goto` to navigate home.

### GitHub Data Fetching

I used two patterns for GitHub access:

1. **Octokit from SvelteKit server routes**  
2. **A simple `fetch`-based helper (`src/lib/github.js`) for direct REST calls (kept for flexibility/experiments)**

#### Recent Repositories: `/api/github/repositories`

- Reads `github_token` from cookies; returns `401` if missing.
- Initializes `Octokit` with `auth: token`.
- Calls `octokit.rest.repos.listForAuthenticatedUser` with:
  - `sort: 'updated'`
  - `per_page: 10`  
  to focus on the most recent work.
- For each repo:
  - Calls `octokit.rest.repos.listCommits` with `per_page: 1`.  
    - To avoid heavy counting, it uses a pseudo “commit count” derived from the first commit SHA:  
      `parseInt(commits[0].sha, 16) % 1000`
  - Calls `octokit.rest.repos.listLanguages` and sums language sizes to get a rough code size:
    ```js
    const totalSize = Object.values(languages).reduce((sum, size) => sum + size, 0);
    const sizeKb = Math.round(totalSize / 1024);
    ```
  - Returns a normalized object:
    - `name`, `description` (with a fallback)
    - `commits_count`
    - `size` (KB)
    - `url`, `language`, `stars`

These objects are consumed by `dashboard/+page.svelte` and passed into the `Repo` component.

#### Daily Activity: `/api/github/daily-activity`

This endpoint powers the Apple Fitness–style rings.

- Reads `github_token`, returns `401` (with a log) if absent.
- Uses Octokit to:
  - Fetch the authenticated user (`users.getAuthenticated`)
  - Search for today’s commits using the search API:
    ```js
    const today = new Date().toISOString().split('T')[0];
    const { data: commits } = await octokit.rest.search.commits({
      q: `author-date:${today} author:${user.login}`,
      sort: 'author-date',
      order: 'desc',
      per_page: 100
    });
    ```
- Aggregates:
  - `totalCommits = commits.total_count`
  - For each commit in `commits.items`:
    - Calls `repos.getCommit` with `owner`, `repo`, `ref: item.sha`
    - Accumulates:
      - `totalLinesAdded += commitData.stats.additions`
      - `totalLinesRemoved += commitData.stats.deletions`
      - `totalFileSize += commitData.files.reduce((sum, file) => sum + file.changes, 0)`
- Returns:
  ```js
  {
    commits: totalCommits,
    linesOfCode: totalLinesAdded + totalLinesRemoved,
    fileSize: totalFileSize
  }
  ```

Errors are logged and returned as a JSON body with status `500`.

### Frontend: Dashboard & Components

#### Dashboard Page

`src/routes/dashboard/+page.svelte`:

- On mount:
  - Fetches `/api/github/repositories` and hydrates `repositories`.
- Maintains:
  - `userName` (currently a placeholder, but tied to the authenticated user in the layout)
  - `rings` array describing default ring progress levels (also used to generate a motivational message).
- Generates an encouraging phrase based on average progress:
  ```js
  const averageProgress = rings.reduce((sum, ring) => sum + ring.progress, 0) / rings.length;
  // Returns tiered messages like "Fantastic work! You're crushing it!"
  ```
- Renders:
  - A greeting header with the dynamic phrase
  - `<DailyActivityWheel />` for the rings
  - A grid of `<Repo />` components using the fetched data

#### DailyActivityWheel & Ring Components

`DailyActivityWheel.svelte`:

- Uses `onMount` to:
  - Fetch `/api/github/daily-activity`
  - Manage `loading` and `error` states
- Derives progress percentages with soft caps:
  ```js
  $: commitProgress = Math.min((dailyActivity.commits / 10) * 100, 100);
  $: linesProgress = Math.min((dailyActivity.linesOfCode / 1000) * 100, 100);
  $: fileSizeProgress = Math.min((dailyActivity.fileSize / 10000) * 100, 100);
  ```
- Passes a `layers` array into `Ring`:
  ```svelte
  <Ring
    size={250}
    strokeWidth={20}
    backgroundColor="#f0f0f0"
    showBackground={true}
    layers={[
      { startColor: "#256EFF", endColor: "#99BBFF", progress: commitProgress },
      { startColor: "#F61067", endColor: "#FB89B5", progress: linesProgress },
      { startColor: "#3DDC97", endColor: "#4FDFA0", progress: fileSizeProgress }
    ]}
  />
  ```

`Ring.svelte`:

- Accepts:
  - `size`, `strokeWidth`, `backgroundColor`, `showBackground`
  - `layers`: array of `{ startColor, endColor, progress }`
- Derived values:
  ```js
  $: radius = size / 2;
  $: normalizedRadius = radius - strokeWidth / 2;
  $: circumference = normalizedRadius * 2 * Math.PI;
  function calculateOffset(progress) {
    return circumference - (progress / 100) * circumference;
  }
  ```
- Uses `<defs>` and `<linearGradient>` per layer for smooth color transitions.
- Renders:
  - Optional background circles per layer
  - Foreground progress circles with:
    - `stroke-dasharray` and `stroke-dashoffset` for progress visualization
    - `transform: rotate(-90deg)` to start from top (like Apple rings)
    - A `mounted` flag toggled in `onMount` to animate from full offset to the correct stroke offset
- CSS applies a subtle drop-shadow and 1s `stroke-dashoffset` transition.

#### Repo Component

`Repo.svelte`:

- Props: `title`, `description`, `commits`, `size` (KB).
- Formats size into KB/MB:
  ```js
  $: sizeFormatted = size < 1024 ? `${size} KB` : `${(size / 1024).toFixed(2)} MB`;
  ```
- Styled as cards with hover elevation, truncated description text, and pill-style stat badges.

#### Layout & Styling

- `src/app.html` sets global typography and background:
  - Background color: `#E6E8E6`
  - Text color: `#3F403F`
- `+layout.svelte`:
  - Provides a simple top nav with context-aware links
  - Uses neutral, muted palette compatible with the ring gradients and repo cards

### Testing & Tooling

- **Playwright**:
  - Basic test ensures the home page renders an expected `h1`.
  - `playwright.config.js` builds and previews the app (`npm run build && npm run preview`) for tests.
- **Linting/formatting**:
  - `npm run lint` uses Prettier with `prettier-plugin-svelte`.
  - `.prettierrc` enforces tabs, single quotes, and a 100-character line width.
- **Vite config**:
  - Integrates SvelteKit’s Vite plugin and exposes `process.env` via `define` for compatibility.

## Results

- Implemented a working **GitHub-authenticated dashboard** that visualizes:
  - Daily commits, lines of code, and file changes via rings
  - Recently active repositories with size and pseudo-commit metrics
- Verified the end-to-end flow:
  - Sign in with GitHub → OAuth callback → cookies set → dashboard renders activity
  - API routes correctly handle unauthorized access and error propagation
- Established a reusable pattern for:
  - SvelteKit + OAuth + GitHub
  - SVG-based progress visualizations with layered gradients

## Lessons Learned

- **SvelteKit server routes** make it straightforward to keep OAuth tokens on the server and still provide a SPA-like experience.
- The **GitHub search and commit APIs** are powerful but can be expensive; batching and capping (e.g., `per_page: 100`) is important for responsiveness and rate limits.
- Building a generic **ring visualization** component early paid off; it made it trivial to add or tweak activity layers without touching the SVG math again.
- Even for a small project, **cookie security flags** (`httpOnly`, `secure`) and clear `401` responses prevent a lot of subtle auth bugs.
- Translating raw metrics into **goal-based progress** (e.g., “10 commits = 100%”) requires thought: thresholds should be motivating, not discouraging.

## Links

- [GitHub Repository](https://github.com/IsaiahJMurray/github-grader)
- [Live Demo](https://your-demo-url.com) <!-- replace with actual demo URL if available -->