---
title: Rowing Planner
subtitle: Interactive SvelteKit web app for rowers and coaches to design complex pieces
  by segmenting distance, split, and stroke rate, with live summaries and a visual
  progress bar. Uses Svelte stores and drag-style reordering plus a Spotify-backed
  API endpoint to generate tempo-matched workout playlists from planned piece metrics.
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

I built **rowing-planner** as a small training tool for rowers and coaches: a web app to design rowing pieces, visualize their structure, and generate a matching workout playlist. Users can break a workout into segments (distance, split, and stroke rate), see an immediate visual breakdown, and request Spotify track recommendations tuned to the workout profile.

The project is a focused example of using SvelteKit’s reactivity model with a lightweight API route that talks to an external service (Spotify) and feeds the result back into the UI.

## Role & Context

I implemented this project end to end:

- Defined the core user flow for planning rowing pieces.
- Designed the data model for workout segments.
- Built the Svelte UI for editing, ordering, and summarizing segments.
- Implemented a SvelteKit server route that integrates with the Spotify API to generate playlists based on workout metrics.
- Wired everything together with Svelte stores so the UI and playlist generator stay in sync.

This was a personal project to explore SvelteKit for a sports/fitness use case and to practice integrating a third-party API in a small but realistic app.

## Tech Stack

- Svelte 4
- SvelteKit 2
- Vite 5
- JavaScript (ES modules)
- HTML / CSS
- `svelte-dnd-action` (planned for more advanced drag-and-drop)
- `uuid` for unique segment IDs
- `node-fetch` for server-side HTTP calls
- Spotify Web API (Recommendations endpoint)
- `dotenv` for environment variable management

## Problem

As a rower, I often need to plan interval pieces where each segment has a different distance, split, and stroke rate. Typical tools (spreadsheets, static workout notes) don’t:

- Give a clear visual breakdown of how the whole piece is structured.
- Make it easy to reorder or tweak segments while still seeing the totals and averages.
- Help pair the workout with music that matches the overall intensity and rhythm.

I wanted a small, dedicated tool where I could:

1. Define a sequence of rowing segments with key parameters.
2. Immediately see total distance, total time, and averages.
3. Generate a suggested Spotify playlist that roughly matches the workout tempo and intensity.

## Approach / Architecture

I used SvelteKit to keep everything in a single, cohesive project:

- **Client-side UI**:
  - A central `segments` Svelte store holds the list of workout segments.
  - Components (`SegmentManager`, `ProgressBar`, `PlaylistGenerator`) subscribe to the same store and derive their own computed values.
- **Server-side API**:
  - A SvelteKit route at `/api/spotify` uses `node-fetch` and a server-side `getSpotifyAccessToken` helper to:
    - Fetch a client credentials access token from Spotify using `SPOTIFY_CLIENT_ID` and `SPOTIFY_CLIENT_SECRET`.
    - Call Spotify’s Recommendations endpoint with parameters derived from the workout (tempo, energy).
- **Data flow**:
  - User edits segments in `SegmentManager` → `segments` store updates.
  - Derived metrics (totals and averages) are computed reactively.
  - `PlaylistGenerator` reads those derived values, calls `/api/spotify`, and renders the suggested playlist.
- **Configuration**:
  - Vite is configured with `dotenv.config()` so environment variables are available to the SvelteKit server code.

This keeps the client logic simple and pushes all Spotify interaction into a single, testable API endpoint.

## Key Features

- **Segment-based workout planning**: Add, edit, remove, and reorder rowing segments with distance, split, and stroke rate.
- **Automatic time calculation**: Each segment’s time is computed from distance and split, and rolled up into workout totals.
- **Aggregated metrics**: Automatically calculated total distance, total time, average split, and average stroke rate.
- **Visual progress bar**: A color-coded bar showing the relative length of each segment across the total distance.
- **Spotify playlist generation**: One-click playlist recommendations using Spotify’s API, tuned to workout metrics.
- **In-place editing flow**: Edit an existing segment in the same form used for adding segments, with a clear “Update vs Add” toggle.

## Technical Details

### Segment model and state management

I use a Svelte writable store for global segment state:

```js
// src/stores/segments.js
import { writable } from 'svelte/store';

export const segments = writable([]);
```

Each segment is an object with:

```ts
{
  id: string;        // uuid
  distance: number;  // meters
  split: number;     // seconds per 500m
  strokeRate: number;// strokes per minute
  time: number;      // derived: total seconds for that distance
  color: string;     // hex color for visualization
}
```

In `SegmentManager.svelte`, I compute `time` when adding or updating:

```js
const time = (distance / 500) * split;
```

The store is updated immutably via `segments.update`, but the code mutates the underlying array (`push`, index assignment) and returns it. For a small app this is fine, but I’m aware that fully immutable updates are safer in more complex scenarios.

### Editing and ordering segments

Key operations in `SegmentManager.svelte`:

- **Add / update**:

```js
function addSegment() {
  const time = (distance / 500) * split;

  segments.update(s => {
    if (editingIndex !== null) {
      s[editingIndex] = { ...s[editingIndex], distance, split, strokeRate, time };
      editingIndex = null;
    } else {
      s.push({ id: uuidv4(), distance, split, strokeRate, time, color: getRandomColor() });
    }
    return s;
  });

  clearForm();
}
```

- **Edit**: loads the selected segment into the input fields and sets `editingIndex`.
- **Remove**: filters out the segment by index.
- **Move up / down**: swaps array elements by index.

I also derive aggregate metrics using Svelte’s `$:` reactivity:

```js
$: totalTime = get(segments).reduce((acc, segment) => acc + Number(segment.time), 0);
$: totalDistance = get(segments).reduce((acc, segment) => acc + Number(segment.distance), 0);
$: averageSplit = totalDistance > 0 ? totalTime / (totalDistance / 500) : 0;
$: averageStrokeRate =
  get(segments).length > 0
    ? get(segments).reduce((acc, s) => acc + Number(s.strokeRate), 0) / get(segments).length
    : 0;
```

These values are reused both in the UI and by the playlist generator.

### Visual progress bar

`ProgressBar.svelte` subscribes directly to `$segments` and renders a flexbox bar:

```svelte
<div class="progress-bar">
  {#each $segments as segment}
    <div
      class="segment"
      style="width: {segment.distance / totalDistance * 100}%; background-color: {segment.color};"
    >
      {segment.distance}m
    </div>
  {/each}
</div>
```

The total width is always 100%, and each segment’s share is proportional to its distance, giving an immediate visual feel for the workout structure.

### Playlist generation and Spotify integration

On the client, `PlaylistGenerator.svelte` derives averages from the `segments` store:

```js
import { segments } from '../stores/segments.js';
import { get } from 'svelte/store';

let playlist = [];

$: averageSplit =
  get(segments).reduce((acc, segment) => acc + Number(segment.split), 0) /
    get(segments).length || 0;

$: averageStrokeRate =
  get(segments).reduce((acc, segment) => acc + Number(segment.strokeRate), 0) /
    get(segments).length || 0;

$: totalTime = get(segments).reduce((acc, segment) => acc + Number(segment.time), 0);
```

When the user clicks **Generate Playlist**, the component calls the SvelteKit API route:

```js
async function generatePlaylist() {
  const response = await fetch(
    `/api/spotify?split=${averageSplit}&strokeRate=${averageStrokeRate}&time=${totalTime}`
  );
  const data = await response.json();
  playlist = data.tracks.map(track => track.name);
}
```

On the server side (`src/routes/api/spotify/+server.js`):

1. **Access token retrieval** using client credentials grant:

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

2. **Recommendations request**:

```js
export async function GET({ url }) {
  const access_token = await getSpotifyAccessToken();

  const split = url.searchParams.get('split');
  const strokeRate = url.searchParams.get('strokeRate');
  const time = url.searchParams.get('time'); // currently informational

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
}
```

A couple of intentional decisions:

- **Client credentials flow**: This keeps the app simple and server-only on the Spotify side. It doesn’t require user login, and the app just requests generic “workout” tracks aligned to tempo and energy.
- **Mapping rowing metrics to audio features**:
  - `target_tempo` uses the average split as a rough proxy, but in a more polished version I’d transform this into a BPM estimate.
  - `target_energy` is derived from stroke rate (`strokeRate / 10`), assuming higher stroke rate ≈ more intense music.

### Configuration and build

- `dotenv` is configured in `vite.config.js` so environment variables (Spotify credentials) are loaded at dev/build time.
- SvelteKit uses the default `adapter-auto`, so it runs locally via `npm run dev` and can be deployed to any supported environment with minimal changes.

## Results

- Implemented a working SvelteKit app where I can:
  - Compose and edit rowing workouts as sequences of segments.
  - See computed totals and averages updated in real time.
  - Visualize the workout structure via a progress bar.
  - Generate a list of suggested Spotify tracks tuned to the workout.
- Validated the full pipeline:
  - Svelte reactive state → SvelteKit API route → Spotify → UI render.
- Established a clean pattern in my own projects for “compute on the client, call a thin server route for external API access.”

## Lessons Learned

- Svelte’s `$:` reactivity makes derived metrics extremely straightforward, but it’s important to be mindful of repeated `get(segments)` calls in more complex apps.
- Even in small apps, isolating third-party API logic into a dedicated server route pays off for testing and future changes (e.g., adding error handling, retries, or caching).
- Mapping domain metrics (split, stroke rate) to audio features (tempo, energy) is non-trivial; future iterations could:
  - Use more realistic formulas for BPM and energy.
  - Group tracks into a playlist length closer to total workout time rather than a fixed limit.
- Working with `uuid` and a central store simplifies list manipulation (edit, move, remove) and would scale well if I later add persistence.

## Links

- [GitHub Repository](https://github.com/IsaiahJMurray/rowing-planner)
- [Live Demo](https://example.com) <!-- Replace with actual demo URL if deployed -->