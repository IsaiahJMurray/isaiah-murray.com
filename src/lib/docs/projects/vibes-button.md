---
title: Vibes Button
subtitle: "A Chrome extension that overlays any webpage with cheerful, AI-generated\
  \ affirmations tailored to the page\u2019s URL. Built for desktop Chrome users,\
  \ it pairs a Flask backend (with user auth, usage logging, and API key management)\
  \ with a Manifest V3 extension that streams OpenAI completions into a lightweight\
  \ in-page UI."
slug: vibes-button
date: '2023-11-24'
updated: '2023-12-08'
tags:
- css
- html
- javascript
- python
- simulation
- ml
maturity: production
featured: false
visibility: unlisted
heroImage: /generated/logos/vibes-button.png
---
## Overview

Vibes-Button is a Chrome extension and local Flask-backed web app that work together to turn any webpage into a source of “happy vibes.” When I click the extension’s floating button, it sends the current URL to a fine-tuned OpenAI model and displays a short, positive, context-aware quote as an overlay on the page. Behind the scenes, a small dashboard logs my usage, including token counts and URLs, so I can inspect and potentially manage usage like an actual product.

I originally built this as my CS50 final project, focusing on full-stack integration, browser extension architecture, and safe interaction with the OpenAI API.

## Role & Context

I designed and implemented the entire project end-to-end:

- Ideation and UX: deciding on the “happy quote overlay” interaction and button design.
- Chrome extension implementation: background service worker, content scripts, overlay UI.
- Backend: Flask app, SQLite schema, authentication, and request logging.
- OpenAI integration: fine-tuning, prompt design, and token accounting.
- Dev tooling: local environment, .env-based configuration, and test scripts for the OpenAI API.

This was built as a solo project under the constraints of a course deadline and a local-only environment (no external hosting).

## Tech Stack

- HTML
- CSS
- JavaScript (Chrome Extension, frontend logic)
- Python (Flask backend)
- SQLite (via `cs50` SQL helper)
- OpenAI API (fine-tuned model)
- Chrome Extensions Manifest V3
- Node.js (for `dotenv` in extension development)

## Problem

I wanted to explore how to make AI feel ambient and supportive rather than “chat-box based.” Specifically:

- How can I surface short, positive, context-aware messages while browsing, without interrupting the user?
- How can I let users control their own OpenAI API key but still track usage and associate it with accounts?
- How can a Chrome extension and a local web app share state (user identity, API key configuration) cleanly and securely?

The core challenge was orchestrating three moving parts:

1. A Chrome extension injected into arbitrary sites.
2. A local Flask web application with login and a dashboard.
3. The OpenAI API, including a fine-tuned model, with per-user logging and token tracking.

## Approach / Architecture

I split the project into two primary components:

1. **Chrome Extension (client-side)**
   - A background service worker (`background.js`) that:
     - Injects a content script into the Flask site when needed.
     - Injects the overlay script into any tab when the extension icon is clicked.
     - Manages `chrome.storage.sync` for the OpenAI API key and `userId`.
     - Handles requests to the OpenAI API and logs results to the Flask backend.
   - Content scripts (`content.js`, `overlay.js`) that:
     - Mediate communication between the web page and the extension.
     - Inject and control a minimal overlay UI.
     - Relay user ID and API key configuration messages.

2. **Flask Server (backend + dashboard)**
   - Handles user registration, login, and logout with session-based auth.
   - Manages an SQLite database with `users` and `apicalls` tables.
   - Exposes endpoints for:
     - Logging API usage (`/api/store`).
     - Syncing user IDs with the extension.
     - Managing API key configuration via a settings page.
   - Renders a small dashboard showing:
     - Total tokens used.
     - Total requests.
     - Detailed per-call logs (time, URL, response snippet).

**State and communication flow:**

- **User auth and ID sync:**
  - Flask maintains a `session['user_id']`.
  - After register/login/logout, a transitional page (`post_*` templates) posts the `user_id` (or `-1` for guest) to the window.
  - The content script listens for this message and forwards it to the background script, which persists it in `chrome.storage.sync`.
  - When needed, the extension sends the stored `userId` back to the Flask app.

- **API key configuration:**
  - The extension’s `options_page` is actually a redirect to the Flask `/options` route.
  - The options page verifies a user-supplied key by calling OpenAI’s `/v1/models` endpoint.
  - If valid, it posts a message to the content script; the content script passes it to the background script, which saves it in `chrome.storage.sync`.

- **Happy quote generation:**
  - When I click the Vibes button on any page:
    - The overlay script sends a `queryChatGPT` message to the background.
    - The background script fetches the OpenAI API key and `userId` from `chrome.storage.sync`.
    - It calls the fine-tuned model with a prompt that includes the current URL.
    - It approximates token usage, logs the call to the Flask server, and returns the best “vibes” snippet to the overlay for display.

## Key Features

- Chrome extension with an always-available, floating “:)" Vibes button.
- Fine-tuned OpenAI integration producing short, positive, URL-aware quotes.
- Local Flask web app with registration, login, logout, and API key configuration.
- Activity dashboard: per-user history of requests, tokens used, timestamps, and URLs.
- Extension–backend handshake for keeping `userId` in sync, including a guest mode with `user_id = -1`.
- Client-side validation of OpenAI API keys before saving them.
- Overlay UI that reveals quotes character-by-character for a more delightful feel.

## Technical Details

### Chrome Extension

- **Manifest (v3)**
  - Permissions: `activeTab`, `scripting`, `storage`, `tabs`.
  - `host_permissions`: `<all_urls>` for overlay injection.
  - `background.service_worker`: `background.js`.
  - `content_scripts` bound to `http://localhost:5000/*` to integrate with the Flask app.
  - `web_accessible_resources`: `overlay.html`, `overlay.css` so the injected script can load them.

- **Background script (`background.js`)**
  - On extension icon click, injects `overlay.js` into the current tab.
  - Listens to `chrome.tabs.onUpdated` and injects `content.js` whenever the user visits the local Flask app (`port 5000`).
  - Maintains:
    - `openaiApiKey`
    - `userId`
    in `chrome.storage.sync`, with helper logging to debug current values.
  - Handles API key and user ID messages:
    - `setUserId`, `getUserId`
    - `setApiKey`, `getApiKey`
  - Implements `handleChatGPTQuery`:
    - Reads `openaiApiKey` and `userId`.
    - If no key is stored, returns an error message advising configuration.
    - Calls the OpenAI completions endpoint for a fine-tuned `babbage-002` model.
    - Approximates tokens using a simple heuristic:
      ```js
      function approximateTokenCount(text) {
        const wordCount = text.split(' ').length;
        const extraTokensForSubwords = Math.floor(text.length / 8);
        return wordCount + extraTokensForSubwords;
      }
      ```
    - Sends the token count, URL, and response text to `http://127.0.0.1:5000/api/store`.

- **Content script (`content.js`)**
  - Bridges messages between the page JavaScript and the extension:
    - Listens for `window.postMessage` events:
      - `SET_USER_ID`: forwards to background (`setUserId`).
      - `GET_USER_ID`: requests from background, then posts `USER_ID_RESPONSE` back.
      - `FROM_PAGE`: forwards arbitrary messages to the background (used for API key save).
  - On `DOMContentLoaded` at the Flask home page:
    - Requests `userId` from background.
    - Sends it to `/receive-user-id` so Flask can reconcile extension state and session state.

- **Overlay (`overlay.js` and `overlay.html`, `overlay.css`)**
  - Dynamically injects CSS using `chrome.runtime.getURL`.
  - Loads `overlay.html`, appends it to `document.body`.
  - Implements a “typewriter” reveal function for the text:
    ```js
    function revealText(text, object) {
      let index = 0;
      const interval = 10;
      function revealCharacter() {
        if (index < text.length) {
          object.textContent += text[index++];
          setTimeout(revealCharacter, interval);
        }
      }
      revealCharacter();
    }
    ```
  - Sends `contentScriptQuery: "queryChatGPT"` to the background when the activation button is clicked.
  - Extracts the most meaningful quote from the API completion by:
    - Splitting response text on `[[...]]` markers (used in fine-tune completions).
    - Sorting chunks by length and picking the longest as the “main” quote.
    - Stripping special characters for a cleaner display.

### Flask Backend

- **Core app (`server-side/app.py`)**
  - Uses `Flask` + `cs50.SQL` on `sqlite:///api-logs.db`.
  - `home ("/")`:
    - If `session['user_id']` is set (not `None` or `-1`), fetches user and their `apicalls`.
    - Computes:
      - `total_tokens = sum(entry['tokens'] for entry in entries)`
      - `total_requests = len(entries)`
    - Renders `index.html` with a dashboard of recent responses and metadata.
    - Otherwise, renders `login.html`.
  - `/options`:
    - Only accessible when `session['user_id']` is a real user (not `-1`).
    - Renders `options.html` with API key configuration UI.
  - `/register`, `/login`:
    - Create and authenticate users with `werkzeug.security` password hashing.
    - After a successful register or login:
      - Store `session['user_id']` and render `post_register.html` or `post_login.html`.
      - These templates include a script that:
        - Waits 1 second (workaround for extension timing/permissions).
        - Calls `window.postMessage({ type: 'SET_USER_ID', userId: {{ user_id }} }, '*');`.
        - Redirects back to `/`.
  - `/logout`:
    - Clears the session, renders `post_logout.html` which:
      - After a 1-second delay, posts `userId = -1` to the content script.
      - Redirects back to `/`.
  - `/api/store` (inferred from `background.js`):
    - Accepts JSON with `user_id`, `tokens`, `url`, `response`.
    - Inserts into `apicalls` table for logging and analytics.

- **Database schema (from `development/sql-commands`)**
  - `users`:
    - `id` (PK, autoincrement).
    - `username` (unique).
    - `password_hash` (unique, hashed).
  - `apicalls`:
    - `id` (PK, autoincrement).
    - `time` (timestamp, default `CURRENT_TIMESTAMP`).
    - `user_id` (FK to `users.id`).
    - `tokens` (integer).
    - `url` (text).
    - `response` (text).

- **Templates and static assets**
  - Shared `layout.html` with Bootstrap and custom `styles.css`.
  - `index.html`: dashboard of API calls.
  - `login.html`, `register.html`: simple centered forms with the “Vibes Button :)” branding.
  - `navbar.html`: includes links to “Switch API Key” and “Logout”, plus a “Welcome `{{ username }}`” badge.
  - `options.html`: a styled card with:
    - API key input.
    - Save button with loading state.
    - “Invalid API Key” error messaging, toggled by JavaScript.
  - `home.js`:
    - Example of checking user login status and wiring up logout and “switch API key” routes.
  - `options.js`:
    - Verifies the entered API key by calling `https://api.openai.com/v1/models`.
    - Shows/hides an error message and manages a loading state on the save button.
    - Relays a `setApiKey` action to the extension via `window.postMessage`.

### Development & Fine-Tuning

- `development/request_general_model.py`:
  - Small script that reads `OPENAI_API_KEY2` from `.env`.
  - Calls a fine-tuned Babbage model using a custom prompt and prints the result.
- `development/training3.jsonl`:
  - Contains training pairs like:
    - Prompt: “You are a supportive assistant… Input: 'https://en.wikipedia.org/wiki/Solar_System'”
    - Completion: `[[Like the planets in the solar system, each of us has a unique path that contributes to the harmony of the whole.]]`
  - I used the `[[...]]` convention so the extension could easily extract the “main quote” from completions.

## Results

- Built a fully working Chrome extension + local web app integration that:
  - Generates positive, URL-specific quotes on any site.
  - Tracks per-user usage with tokens and URLs.
- Demonstrated:
  - End-to-end flow from extension UI → OpenAI API → Flask logging → dashboard visualization.
  - Practical use of Chrome Extension Manifest V3 features (service workers, `chrome.scripting`, `chrome.storage.sync`).
  - A workable (if imperfect) communication pattern between a browser extension and a local authenticated web app.
- Used successfully as a CS50 final project, meeting the course’s full-stack requirements.

## Lessons Learned

- **Extension–page communication is subtle.**
  - Mixing content scripts, `window.postMessage`, and background scripts introduces timing and security nuances. My 1-second delay workaround underscored how important a robust handshake design is.

- **State duplication is easy to get wrong.**
  - Keeping `session['user_id']` (Flask) and `userId` (Chrome storage) in sync required careful thinking. Introducing a special “guest” value (`-1`) simplified a lot of edge cases.

- **Manifest V3 constraints change mental models.**
  - Moving from persistent backgrounds to service workers pushed me to rely more on message passing and storage instead of in-memory state.

- **User-supplied API keys need guardrails.**
  - Validating keys against the OpenAI API before saving them made the UX much smoother and reduced confusing error states when calling the model.

- **Even small products benefit from analytics.**
  - Logging tokens, URLs, and timestamps made the project feel more like a real product and provided immediate insight into usage patterns and costs.

If I iterate on this project, I’d like to:

- Replace the timeout-based handshake with a more robust, event-driven protocol.
- Add hosting and auth flows that work beyond `localhost`, including HTTPS.
- Improve the overlay UX (movable button, mobile-friendly layout, more personalization).

## Links

- [GitHub Repository](https://github.com/IsaiahJMurray/Vibes-Button)
- Demo: _TBD (link to demo or video walkthrough)_