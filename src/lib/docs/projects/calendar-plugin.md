---
title: Calendar Plugin
subtitle: Chrome extension that scans your Google Calendar for upcoming meetings and
  surfaces concise summaries directly in a popup. Designed for busy professionals
  who want quick context before calls, it integrates Google identity OAuth and LinkedIn
  OAuth flows, securely storing tokens via Chrome storage. Technically, it demonstrates
  manifest v3 patterns, scoped Google API access, and a configurable OAuth setup using
  externalized secrets.
slug: calendar-plugin
date: '2024-07-15'
updated: '2024-07-18'
tags:
- html
- javascript
maturity: prototype
featured: false
visibility: public
heroImage: /generated/logos/calendar-plugin.png
---
## Overview

This project is a Chrome extension that connects Google Calendar, Gmail, and LinkedIn to act as a lightweight “meeting assistant.” It fetches upcoming meetings from the user’s primary Google Calendar, prepares contextual summaries, and enriches them with attendee profile data via LinkedIn. The goal is to reduce meeting prep time by surfacing the most relevant information in a single, simple popup.

## Role & Context

I designed and implemented this extension end to end as a personal project to deepen my understanding of:

- Chrome Extension Manifest V3
- OAuth2 flows in the browser
- Integrating multiple third‑party APIs (Google and LinkedIn)
- Handling authentication and configuration securely on the client

I iterated quickly on the UX and architecture, focusing first on a working Calendar integration and then layering in LinkedIn OAuth and basic profile storage.

## Tech Stack

- HTML (popup and callback UIs)
- JavaScript (Chrome extension logic)
- Chrome Extensions API (Manifest V3)
- Google Identity / OAuth2 (Calendar & Gmail)
- LinkedIn OAuth2
- Fetch API
- `chrome.storage` and `chrome.identity`
- `dotenv` (for local development and configuration management)

## Problem

Preparing for meetings often meant manually jumping between Google Calendar, Gmail, and LinkedIn to:

- See upcoming meetings and timings
- Understand the agenda and context from email threads
- Look up attendee profiles on LinkedIn

This context switching was time‑consuming and error‑prone. I wanted a small, always‑available tool inside the browser that could:

- Show upcoming meetings in one click
- Authenticate once with Google and LinkedIn
- Store and reuse tokens securely
- Provide a foundation for richer summaries and attendee insights

## Approach / Architecture

I implemented the extension using the standard Chrome extension architecture:

- **Manifest V3** to declare permissions, OAuth2 client configuration, and popup UI.
- **Background script (`background.js`)** to:
  - Load configuration from a bundled `config.json`.
  - Handle installation events and trigger Google OAuth token retrieval.
  - Act as a central place for identity‑related logic that should not depend on UI.
- **Popup UI (`popup.html` + `popup.js`)** to:
  - Render a simple interface with a “Fetch Meetings” button.
  - Orchestrate the flow of getting an auth token and calling Google Calendar APIs.
  - Handle basic error reporting and logging.
- **LinkedIn OAuth callback (`callback.html` + `callback.js`)** to:
  - Receive LinkedIn’s authorization code via redirect.
  - Exchange the code for an access token.
  - Store that token in `chrome.storage.sync` for later use.

Configuration (client IDs, secrets, redirect URIs) is read from `config.json` at runtime using `chrome.runtime.getURL`. During development, I used `dotenv` and `.env` locally and made sure secrets and keys are ignored via `.gitignore`.

## Key Features

- One‑click button in the browser toolbar to open the Meeting Assistant popup.
- Google OAuth2 integration via `chrome.identity.getAuthToken`.
- Fetching upcoming events from the user’s primary Google Calendar.
- Filtering and sorting events to focus only on future meetings.
- LinkedIn OAuth2 authorization code flow handled in a dedicated callback page.
- Secure storage of LinkedIn access tokens in `chrome.storage.sync`.
- Basic error handling and user‑visible error messages in the popup.

## Technical Details

### Manifest & Permissions

The `manifest.json` uses Manifest V3 and declares:

- Permissions: `"identity"`, `"identity.email"`, `"storage"`, `"activeTab"`.
- Host permissions: `https://www.googleapis.com/` for Google APIs.
- OAuth2 configuration with:
  - `client_id` for Google
  - Scopes:
    - `https://www.googleapis.com/auth/calendar.readonly`
    - `https://www.googleapis.com/auth/gmail.readonly`

It also configures the extension action:

- `default_popup: "popup.html"`
- Icon set for different resolutions.

### Background Script

`background.js`:

- Loads `config.json` using:

  ```js
  fetch(chrome.runtime.getURL('config.json'))
  ```

- On `chrome.runtime.onInstalled`, it:

  - Calls `chrome.identity.getAuthToken({ interactive: true }, cb)` to initiate Google OAuth.
  - Logs or handles any runtime errors from the identity API.

- On `chrome.action.onClicked`, it opens `popup.html` in a new tab when the action is clicked (in addition to the popup configuration).

### Popup Logic

`popup.js` orchestrates the main user flow:

1. **Configuration loading**

   ```js
   fetch(chrome.runtime.getURL('config.json'))
     .then(response => response.json())
     .then(data => {
       config = data;
       initializeApp();
     })
     .catch(error => displayError("Failed to load configuration. Please try reloading the extension."));
   ```

2. **UI initialization**

   - Locates the `#fetch-meetings` button.
   - Attaches `handleFetchMeetings` as the click handler.
   - Logs issues if UI elements are missing.

3. **Authentication helpers**

   - `getAuthToken(interactive)` wraps `chrome.identity.getAuthToken` in a `Promise`, surfacing errors as exceptions.
   - `getAuthTokenInteractive()` tries non‑interactive token retrieval first, then falls back to interactive mode.

4. **Fetching Calendar events**

   ```js
   fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
     headers: { 'Authorization': 'Bearer ' + token }
   })
   ```

   - Validates `response.ok` and throws on network/API errors.
   - Parses the response JSON and logs the total number of events.

5. **Filtering & sorting**

   - Computes `now = new Date()`.
   - Filters events where:

     - `event.start` exists.
     - `event.start.dateTime` or `event.start.date` is in the future.

   - Logs for each event:

     - `summary`
     - start time
     - whether it is considered future

   - Sorts `futureEvents` ascending by start time to derive `upcomingMeetings`.

6. **Error handling**

   - Catch blocks around the whole fetch flow log detailed errors to the console.
   - `displayError` (not shown in the snippet but referenced) is used to give the user a generic error message.

### LinkedIn OAuth Callback

`callback.js`:

- Loads `config.json` in the same way as other scripts.
- On `DOMContentLoaded`:

  - Parses `code` and `state` from `window.location.search` using `URLSearchParams`.
  - If both exist, it posts to `https://www.linkedin.com/oauth/v2/accessToken` with:

    - `grant_type=authorization_code`
    - `code`
    - `redirect_uri` from `config.LINKEDIN_REDIRECT_URI`
    - `client_id` and `client_secret` from config

  - When the access token is received:

    - Extracts `data.access_token`.
    - Saves it to `chrome.storage.sync` under `linkedinAccessToken`.
    - Closes the callback window.

This flow sets up the extension for future features that can call LinkedIn’s APIs for attendee enrichment.

### Configuration & Secrets

- `.gitignore` ensures that:

  - `.env`
  - `config.json`
  - `keys.json`
  - Build artifacts and various caches

  are not committed.

- `dotenv` is declared in `package.json` to support local environment configuration outside of the extension bundle.

## Results

- Implemented a working Chrome extension that:
  - Authenticates with Google via `chrome.identity`.
  - Fetches and filters upcoming events from Google Calendar.
  - Completes a full LinkedIn OAuth2 code exchange and securely stores the token.
- Established a clear architecture for future enhancements like:
  - Rendering human‑readable meeting summaries.
  - Integrating Gmail data (e.g., recent threads for each meeting).
  - Fetching and displaying LinkedIn profile snippets for attendees.

While the UI is intentionally minimal, the underlying auth and integration flows are in place and tested in a real browser environment.

## Lessons Learned

- **Chrome identity quirks**: Using `chrome.identity.getAuthToken` with Manifest V3 requires careful handling of interactive vs non‑interactive modes and robust error handling for `chrome.runtime.lastError`.
- **Coordinating multiple OAuth providers**: Managing two different OAuth2 flows (Google and LinkedIn) in a browser extension is non‑trivial; separating them into dedicated scripts and callback pages keeps the code more maintainable.
- **Configuration management in extensions**: Loading configuration via `chrome.runtime.getURL` and keeping real secrets out of source control is essential, especially when mixing browser‑side and local development tooling.
- **Defensive UI coding**: Even for a simple popup, adding checks for missing DOM elements and providing fallback error messages significantly improves robustness during iteration.

## Links

- [GitHub Repository](https://github.com/IsaiahJMurray/calendar-plugin)
- [Live Demo](#) *(placeholder)*