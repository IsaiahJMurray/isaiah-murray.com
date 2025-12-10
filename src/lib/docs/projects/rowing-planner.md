---
title: Rowing Planner
subtitle: Interactive web tool for rowers and coaches to plan multi-segment pieces
  with customizable distance, split, and stroke rate. Built with SvelteKit and shared
  stores to drive a live segment timeline, aggregate metrics, and a Spotify-powered
  playlist generator tuned to workout intensity.
slug: rowing-planner
date: '2024-06-22'
updated: '2024-06-22'
tags:
- html
- javascript
- svelte
- sveltekit
maturity: production
featured: false
visibility: public
heroImage: /generated/logos/rowing-planner.png
---
## Overview

I built **rowing-planner** as a web app for rowers and coaches to design rowing pieces, visualize them as segments, and automatically generate music playlists that match the workout’s pacing. The app turns stroke rate, distance, and split inputs into a structured session plan and uses Spotify recommendations to suggest tracks aligned with the workout intensity.

## Role & Context

I designed and implemented this project end-to-end as a personal tool to support rowing training. I wanted something lightweight and interactive that:

- Lets me quickly iterate on workout structure (intervals, varied rates, etc.).
- Gives an at-a-glance visual representation of the entire piece.
- Suggests music that roughly matches the planned effort profile.

The project also served as a way for me to explore SvelteKit, Svelte stores, and integrating with a third-party API (Spotify).

## Tech Stack

- Svelte
- SvelteKit
- HTML
- JavaScript
- Vite
- node-fetch
- dotenv
- svelte-dnd-action (planned/partial; not yet heavily used)
- uuid

## Problem

Designing rowing workouts often happens in spreadsheets or on paper. That makes it hard to:

- Adjust segments on the fly and see how the total distance and time change.
- Visualize the structure of a piece (e.g., varying distances and intensities).
- Pair workouts with music that roughly matches the intensity over time.

I wanted a simple, browser-based tool where I could:

1. Define segments by distance, split, and stroke rate.
2. Automatically calculate timing and workout summaries.
3. Generate a playlist whose tempo and energy are aligned with the workout profile.

## Approach / Architecture

I used SvelteKit to structure the application as a single-page experience with a small backend API endpoint.

- **Client-side UI**  
  - A main `App.svelte` component composes three feature components: `SegmentManager`, `ProgressBar`, and `PlaylistGenerator`.
  - Shared workout state is maintained in a Svelte `writable` store (`segments.js`) so each component can react to changes without manual prop drilling.

- **State & Derived Metrics**  
  - Each segment contains `id`, `distance`, `split`, `strokeRate`, computed `time`, and a random `color`.
  - Derived metrics (total time, total distance, average split, average stroke rate) are computed reactively in Svelte, updating whenever segments change.

- **Backend API for Spotify**  
  - A SvelteKit route (`src/routes/api/spotify/+server.js`) acts as a thin proxy to the Spotify Recommendations API.
  - It handles authentication via the Client Credentials flow using `node-fetch`, `dotenv`, and environment variables (`SPOTIFY_CLIENT_ID`, `SPOTIFY_CLIENT_SECRET`).
  - The frontend calls this internal endpoint with aggregated workout stats, and the server returns recommendation data as JSON.

This lightweight architecture keeps the UI responsive and pushes secrets and external API calls to the backend where they belong.

## Key Features

- **Segment builder and editor** with add, update, reorder, and remove capabilities.
- **Automatic time calculations** per segment based on distance and split.
- **Workout summary metrics**: total distance, total time, average split, and average stroke rate.
- **Visual progress bar** that shows each segment’s distance proportionally with distinct colors.
- **Playlist generation** that calls Spotify’s Recommendations API using workout-derived tempo/intensity parameters.
- **Environment-based configuration** for Spotify credentials via `.env` and `dotenv`.
- **Svelte store–driven reactivity** so all views stay in sync as the workout is edited.

## Technical Details

### Segment Management & Calculations

In `SegmentManager.svelte`, I maintain a simple form bound to local component state:

- Inputs: `distance`, `split`, and `strokeRate` (numeric fields).
- On submit (`addSegment`):
  - I compute `time` as:

    ```js
    const time = (distance / 500) * split;
    ```

    This extrapolates total time from a per-500m split.

  - If `editingIndex` is set, I update the existing segment in the `segments` store.
  - Otherwise, I push a new segment with:
    - `id` generated via `uuidv4()`.
    - A random hex `color` from `getRandomColor()` for use in the progress bar.

- Reordering logic:
  - `moveSegmentUp` and `moveSegmentDown` swap items in the `segments` array by index, with bounds checks.
  - Removal uses `filter` to exclude the specified index.

Derived metrics leverage Svelte’s `$:` reactive declarations:

```js
$: totalTime = get(segments).reduce((acc, segment) => acc + Number(segment.time), 0);
$: totalDistance = get(segments).reduce((acc, segment) => acc + Number(segment.distance), 0);
$: averageSplit = totalDistance > 0 ? totalTime / (totalDistance / 500) : 0;
$: averageStrokeRate =
  get(segments).length > 0
    ? get(segments).reduce((acc, segment) => acc + Number(segment.strokeRate), 0) / get(segments).length
    : 0;
```

These values are always in sync with the underlying `segments` store.

### Shared State with Svelte Stores

The `segments` store is defined as:

```js
import { writable } from 'svelte/store';

export const segments = writable([]);
```

Components (`SegmentManager`, `ProgressBar`, `PlaylistGenerator`) import and subscribe to this store. Svelte’s `$segments` syntax is used in templates to reactively render the current list, while `get(segments)` is used in some scripts to compute derived values.

### Visual Progress Bar

`ProgressBar.svelte` consumes `$segments` and computes the total distance on the fly:

```js
$: totalDistance = $segments.reduce((acc, segment) => acc + Number(segment.distance), 0);
```

Each segment is rendered as a `<div>` whose width is proportional to `segment.distance / totalDistance * 100`. The `color` field chosen at segment creation is used as the background color, providing an immediate, color-coded visual summary of the workout structure.

### Spotify Integration

The backend logic for playlist generation lives in `src/routes/api/spotify/+server.js`.

**Authentication**

I use Spotify’s Client Credentials flow:

```js
async function getSpotifyAccessToken() {
  const client_id = process.env.SPOTIFY_CLIENT_ID;
  const client_secret = process.env.SPOTIFY_CLIENT_SECRET;
  const auth_token = Buffer.from(`${client_id}:${client_secret}`, 'utf-8').toString('base64');

  const response = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${auth_token}`,
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: 'grant_type=client_credentials'
  });

  const data = await response.json();
  return data.access_token;
}
```

Secrets are loaded via `dotenv` in `vite.config.js` so they are available in the SvelteKit server environment.

**Recommendations Endpoint**

The `GET` handler extracts workout parameters from the query string:

```js
export async function GET({ url }) {
  const access_token = await getSpotifyAccessToken();

  const split = url.searchParams.get('split');
  const strokeRate = url.searchParams.get('strokeRate');
  const time = url.searchParams.get('time'); // currently unused but available
```

I then call Spotify’s Recommendations API:

```js
const recommendations_response = await fetch(
  `https://api.spotify.com/v1/recommendations?limit=10&seed_genres=workout&target_tempo=${split}&target_energy=${strokeRate / 10}`,
  {
    headers: {
      'Authorization': `Bearer ${access_token}`
    }
  }
);

const recommendations_data = await recommendations_response.json();
return json(recommendations_data);
```

Here, I map the rowing metrics to music features:

- `split` → `target_tempo`
- `strokeRate / 10` → `target_energy` (rough intensity proxy)

**Frontend Playlist Generation**

In `PlaylistGenerator.svelte`, I aggregate the workout parameters:

```js
$: averageSplit = get(segments).reduce((acc, segment) => acc + Number(segment.split), 0) / get(segments).length || 0;
$: averageStrokeRate = get(segments).reduce((acc, segment) => acc + Number(segment.strokeRate), 0) / get(segments).length || 0;
$: totalTime = get(segments).reduce((acc, segment) => acc + Number(segment.time), 0);
```

On button click, I call the internal API:

```js
async function generatePlaylist() {
  const response = await fetch(`/api/spotify?split=${averageSplit}&strokeRate=${averageStrokeRate}&time=${totalTime}`);
  const data = await response.json();
  playlist = data.tracks.map(track => track.name);
}
```

For now, I display a simple list of track names. This structure makes it easy to extend into clickable links or embedded Spotify URIs later.

### Tooling & Configuration

- **Vite + SvelteKit** provide fast development and SSR-capable routing, though this app currently behaves like a SPA.
- **`.npmrc` with `engine-strict=true`** ensures Node version compatibility.
- **`.env` handling** is configured so production deployments can inject Spotify credentials securely.

## Results

- Built a working rowing session planner that:
  - Lets me define and restructure workouts quickly.
  - Gives immediate feedback on total distance, time, and averages.
  - Suggests playlists using the Spotify Recommendations API.
- Validated a practical pattern for using Svelte stores in a small but non-trivial app.
- Implemented a clean, minimal API integration with third-party services, keeping secrets server-side.

## Lessons Learned

- Svelte’s reactive declarations (`$:`) are ideal for continuously derived metrics such as totals and averages; they keep the code readable and remove the need for manual recomputation.
- Centralizing state in a store works well even for small apps when multiple components need to stay in sync.
- Treating the SvelteKit server routes as thin API proxies is an effective way to integrate with third-party APIs while keeping credentials safe.
- Mapping domain-specific metrics (split, stroke rate) to external API parameters (tempo, energy) requires experimentation; there is room to refine these mappings for better playlist quality.
- Structuring the UI into small, focused components (`SegmentManager`, `ProgressBar`, `PlaylistGenerator`) makes it straightforward to iterate on the design and add new features later (e.g., drag-and-drop via `svelte-dnd-action`).

## Links

- [GitHub Repository](https://github.com/IsaiahJMurray/rowing-planner)
- Demo: _TBD_