---
title: Calendar Plugin
subtitle: A Chrome extension that pulls upcoming events from Google Calendar and enriches
  them with attendee context from Gmail and LinkedIn. Built for busy professionals
  who want quick meeting summaries and profiles without leaving their browser, it
  uses OAuth flows across multiple providers, secure token handling with chrome.identity
  and storage APIs, and a lightweight HTML/JavaScript popup UI.
slug: calendar-plugin
date: '2024-07-15'
updated: '2024-07-18'
tags:
- html
- javascript
maturity: prototype
featured: false
visibility: unlisted
heroImage: /generated/logos/calendar-plugin.png
---
## Overview

This project is a Chrome extension called **Meeting Assistant** that connects to Google Calendar and Gmail, fetches a user’s upcoming meetings, and lays the groundwork for generating summaries and attendee profiles. I built it as a lightweight browser-side integration that uses OAuth2 with Google and LinkedIn, without relying on a backend server.

## Role & Context

I designed and implemented this extension end‑to‑end:

- Defined the extension UX and basic flow.
- Set up Chrome extension scaffolding and permissions.
- Implemented OAuth2 authentication with Google and LinkedIn.
- Integrated with the Google Calendar API to fetch and filter upcoming events.
- Added basic UI and error handling to make debugging and iteration easier.

This was a solo side project, focused on learning the Chrome Extensions Manifest V3 model and experimenting with browser-based OAuth flows.

## Tech Stack

- HTML (popup and callback pages)
- JavaScript (ES6+)
- Chrome Extensions API (Manifest V3)
- Google Identity & Calendar APIs
- LinkedIn OAuth2 API
- `dotenv` (for local environment/config management during development)

## Problem

I often jump into meetings without enough context about who is attending or what has been discussed previously. I wanted a tool that could:

- Pull my upcoming meetings directly from Google Calendar.
- Enrich those meetings with information from my inbox and professional profiles (e.g., LinkedIn).
- Eventually provide concise, at-a-glance summaries before I join a call.

The immediate problem to solve was: **how to securely authenticate in the browser, access the necessary Google APIs, and prepare an extension foundation that could be extended with richer features later.**

## Approach / Architecture

I chose a **client-side, extension-only architecture** built on Chrome’s Manifest V3:

- **Manifest (MV3):** Declares permissions (`identity`, `storage`, `activeTab`), OAuth2 client configuration, and sets up a popup-based UI entry point.
- **Background script (`background.js`):** Loads configuration, handles extension installation, and requests a Google OAuth token using `chrome.identity`.
- **Popup UI (`popup.html` + `popup.js`):** Provides a “Fetch Meetings” button that, when clicked, triggers the OAuth token flow and fetches events from the Google Calendar API.
- **LinkedIn OAuth callback (`callback.html` + `callback.js`):** Handles the redirect from LinkedIn’s OAuth2 flow, exchanges the auth code for an access token, and stores it in Chrome Sync storage.
- **Configuration management:** Sensitive values (client IDs, secrets, redirect URIs) are kept outside source control via `config.json` and `.env`, ignored in Git.

This architecture keeps everything in the browser, leveraging Chrome’s identity API and the users’ existing Google session, while making it easy to extend with additional APIs in the future.

## Key Features

- Fetches an OAuth2 token via `chrome.identity.getAuthToken` for Google APIs.
- Calls the Google Calendar API to retrieve events from the user’s primary calendar.
- Filters events to show only **future** meetings relative to the current time.
- Provides a simple popup UI with a “Fetch Meetings” button and a results container.
- Implements LinkedIn OAuth2 code exchange and token storage via `chrome.storage.sync`.
- Uses a `config.json` file for runtime configuration, loaded at extension startup.
- Includes structured logging and basic error handling for easier debugging.

## Technical Details

### Manifest & Permissions

In `manifest.json` I configured:

- `manifest_version: 3`
- Basic extension metadata (name: “Meeting Assistant”, description, version).
- Permissions:
  - `identity` and `identity.email` for Google OAuth via `chrome.identity`.
  - `storage` for persisting tokens and any future settings.
  - `activeTab` for potential future context-aware features.
- `host_permissions`:
  - `https://www.googleapis.com/` to talk to Google Calendar and Gmail APIs.
- `oauth2`:
  - `client_id` for the Chrome-registered OAuth client.
  - Scopes:
    - `https://www.googleapis.com/auth/calendar.readonly`
    - `https://www.googleapis.com/auth/gmail.readonly`

The `action` key points to `popup.html` and defines icons for different sizes.

### Background Script: Config & Google Auth

In `background.js`:

- I load `config.json` via:

  ```js
  fetch(chrome.runtime.getURL('config.json'))
    .then(response => response.json())
    .then(data => { config = data; ... })
  ```

- On `chrome.runtime.onInstalled`, I trigger an initial interactive auth flow:

  ```js
  chrome.identity.getAuthToken({ interactive: true }, (token) => {
    if (chrome.runtime.lastError) {
      console.error(chrome.runtime.lastError);
      return;
    }
    console.log("Google Auth Token:", token);
  });
  ```

- I attach a click handler to `chrome.action` to open the popup UI tab if needed.

This centralizes config loading and sets up the foundation for later background tasks (e.g., scheduled polling or pre-fetching).

### Popup Flow: Fetching Calendar Events

In `popup.js`:

1. **Configuration loading**

   ```js
   fetch(chrome.runtime.getURL('config.json'))
     .then(response => response.json())
     .then(data => {
       config = data;
       initializeApp();
     })
     .catch(error => {
       console.error("Error loading config:", error);
       displayError("Failed to load configuration. Please try reloading the extension.");
     });
   ```

2. **UI initialization**

   - On `DOMContentLoaded`, I find the “Fetch Meetings” button (`#fetch-meetings`) and attach `handleFetchMeetings`.

3. **Auth token management**

   - A general function:

     ```js
     function getAuthToken(interactive) {
       return new Promise((resolve, reject) => {
         chrome.identity.getAuthToken({ interactive }, (token) => {
           if (chrome.runtime.lastError) {
             reject(new Error(chrome.runtime.lastError.message));
           } else {
             resolve(token);
           }
         });
       });
     }
     ```

   - A helper `getAuthTokenInteractive` first tries non-interactive, then falls back to interactive if necessary.

4. **Calling Google Calendar API**

   - Using the token:

     ```js
     fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
       headers: { 'Authorization': 'Bearer ' + token }
     })
     .then(response => {
       if (!response.ok) {
         throw new Error('Network response was not ok: ' + response.statusText);
       }
       return response.json();
     })
     .then(data => {
       const now = new Date();

       const futureEvents = data.items.filter(event => {
         if (event.start) {
           const eventStart = event.start.dateTime
             ? new Date(event.start.dateTime)
             : new Date(event.start.date);
           return eventStart > now;
         }
         return false;
       });

       const upcomingMeetings = futureEvents.sort((a, b) => {
         const aStart = new Date(a.start.dateTime || a.start.date);
         const bStart = new Date(b.start.dateTime || b.start.date);
         return aStart - bStart;
       });

       // Rendering into #meeting-summary would go here
     })
     .catch(error => {
       console.error("Error in fetch meetings flow:", error);
       displayError("Failed to fetch meetings. Please try again.");
     });
     ```

   - This logic handles both all-day events (date) and time-specific events (dateTime).

### LinkedIn OAuth Callback

In `callback.js`:

- I reuse the config loading pattern to get LinkedIn OAuth settings (redirect URI, client ID, client secret).
- On `DOMContentLoaded`, I parse `code` and `state` from the URL:

  ```js
  const urlParams = new URLSearchParams(window.location.search);
  const code = urlParams.get('code');
  const state = urlParams.get('state');
  ```

- If both exist, I exchange the code for an access token:

  ```js
  fetch('https://www.linkedin.com/oauth/v2/accessToken', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code: code,
      redirect_uri: config.LINKEDIN_REDIRECT_URI,
      client_id: config.LINKEDIN_CLIENT_ID,
      client_secret: config.LINKEDIN_CLIENT_SECRET
    })
  })
  .then(response => response.json())
  .then(data => {
    const accessToken = data.access_token;
    chrome.storage.sync.set({ linkedinAccessToken: accessToken }, () => {
      window.close();
    });
  })
  .catch(error => console.error("Error fetching LinkedIn access token:", error));
  ```

This paves the way to later call LinkedIn APIs to build attendee profiles based on email or name.

### Configuration & Secrets

- `.gitignore` excludes:
  - `.env`
  - `config.json`
  - `keys.json`
  - Build artifacts and common dev directories.
- Locally, `dotenv` helps manage environment variables while keeping secrets out of the repo.
- The runtime `config.json` is loaded inside the extension using `chrome.runtime.getURL`, avoiding hard‑coding secrets in source.

## Results

- Implemented a working Chrome extension that:
  - Authenticates against Google using OAuth2 via `chrome.identity`.
  - Fetches and filters upcoming Google Calendar events.
  - Handles LinkedIn OAuth2 token exchange and persistence.
- Established a clean structure that can be extended with:
  - Gmail integration for historical meeting context.
  - LinkedIn profile lookups for attendees.
  - UI enhancements to show summaries and profiles directly in the popup.

While the repository is still early-stage (no stars or forks yet), it already serves as a solid foundation and learning artifact for MV3, Google APIs, and browser-side OAuth.

## Lessons Learned

- **Manifest V3 constraints:** Moving background logic into service worker–style scripts changes how you think about state and long-lived processes.
- **Chrome identity nuances:** Using `chrome.identity.getAuthToken` simplifies OAuth, but you still need to handle interactive vs non-interactive flows carefully to avoid bad UX.
- **Calendar data modeling:** Calendar events have multiple representations (all-day vs timed), which affects how you filter and sort them correctly.
- **OAuth callback handling:** Implementing the LinkedIn code exchange in pure frontend JavaScript is possible but requires careful handling of secrets and config; for production, I’d likely involve a backend.
- **Debuggability matters:** Adding consistent logging throughout the extension made it much easier to troubleshoot token issues and API responses during development.

## Links

- [GitHub Repository](https://github.com/IsaiahJMurray/calendar-plugin)
- [Live Demo (placeholder)](https://example.com/demo-calendar-plugin)