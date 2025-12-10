---
title: Vibes Button
subtitle: A Chrome extension that overlays any webpage with custom ChatGPT-powered,
  happy-go-lucky affirmations based on the current URL. Built for everyday web users
  who want a mood boost, it combines a Flask backend with Chrome extension APIs, OpenAI
  fine-tuning, per-user auth, and token usage logging for potential billing and analytics.
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
visibility: public
heroImage: /generated/logos/vibes-button.png
---
## Overview

Vibes-Button is a Chrome extension and companion Flask backend that turns any webpage into a source of “happy vibes.” When I click the extension’s button, it sends the current URL to an OpenAI-powered model that generates a short, upbeat, context-aware quote. The server also tracks usage per user so I can view logs of past “vibes” and token consumption.

I originally built this as my CS50 final project, with the goal of combining browser extensions, modern web APIs, and a bit of ML customization into one cohesive system.

## Role & Context

I designed and implemented the entire project end to end:

- Built the Chrome extension (Manifest V3, background/service worker, content and overlay scripts).
- Implemented the Flask backend with user authentication, API logging, and simple analytics.
- Integrated with the OpenAI API, including experimentation with a fine-tuned model and the Assistants beta.
- Designed the extension’s UI and the web dashboard for viewing history and configuring the API key.

The project was done independently under the constraints and expectations of the CS50 final project.

## Tech Stack

- HTML
- CSS
- JavaScript (Chrome extension, frontend logic)
- Python (Flask backend, OpenAI integration tooling)
- SQLite (via `cs50` SQL helper)
- Chrome Extensions API (Manifest V3)
- OpenAI API
- Node.js + npm (for `dotenv` and tooling)

## Problem

Most webpages are neutral or stressful—news, deadlines, documentation. I wanted a lightweight way to inject some positivity into that experience, without asking users to leave the page or open a separate app.

The challenges were:

- Providing page-aware positive quotes with minimal friction (one button, anywhere on the web).
- Letting users bring their own OpenAI API key securely, so I didn’t have to host secrets.
- Tracking usage (URLs, tokens, timestamps) per user for transparency and potential future billing.
- Coordinating state between a browser extension and a Flask web app (login status, user IDs, API keys) under Chrome extension security constraints.

## Approach / Architecture

I split the system into two main components:

1. **Chrome Extension**
   - **Background service worker (`background.js`)**  
     - Injects the overlay script when the user clicks the extension action.
     - Manages `chrome.storage.sync` for `userId` and `openaiApiKey`.
     - Handles messages from content/overlay scripts to call the OpenAI API and log results to the server.
   - **Content script (`content.js`)**  
     - Runs on the Flask site (localhost:5000).
     - Bridges communication between the web pages (login / options screens) and the background script using `window.postMessage` + `chrome.runtime.sendMessage`.
   - **Overlay (`overlay.js` + `overlay.html` + `overlay.css`)**  
     - Injects a small popup at the bottom-right of any page with a “:)” activation button.
     - On click, sends the current URL to the background script to generate and display a positive quote.

2. **Flask Backend (`server-side/app.py`)**
   - **Authentication & session management**
     - Users can register and log in, with passwords hashed via `werkzeug.security`.
     - Sessions store `user_id`; I mirror this into Chrome storage via the extension bridge.
   - **API logging & dashboard**
     - Stores each OpenAI call in SQLite: user ID, URL, response text, tokens, timestamp.
     - Shows a dashboard (`index.html`) with total tokens and request count, plus detailed activity logs.
   - **API key configuration**
     - Options page (`/options`) lets logged-in users configure their OpenAI API key.
     - The frontend JS verifies the key against `https://api.openai.com/v1/models` and, if valid, sends it to the extension to be stored securely in `chrome.storage.sync`.

For development and experimentation, I added separate Python scripts (in `development/`) to test the fine-tuned model and the Assistants beta, and a `training3.jsonl` file with prompt/completion pairs for a “supportive assistant” specialized on URLs.

## Key Features

- **One-click positivity overlay**: A floating “:)” button that works on any website and reveals a generated positive quote about the current page.
- **User authentication & guest mode**: Login/registration flows with a special guest `user_id = -1` to preserve usability without always being logged in.
- **Per-user API logging**: Every OpenAI call is logged with timestamp, URL, token count, and response for later review.
- **Bring-your-own OpenAI API key**: Users configure and validate their own key via the web UI; the key is stored only in Chrome extension storage.
- **Chrome extension–Flask handshake**: A custom message bridge between content scripts and the Flask pages to sync user IDs and trigger storage updates.
- **Lightweight analytics dashboard**: A web UI showing total tokens used, number of requests, and a scrollable history of all “vibes” generated.

## Technical Details

### Extension internals

- **Manifest V3** (`manifest.json`)
  - Permissions: `activeTab`, `scripting`, `storage`, `tabs`.
  - `host_permissions`: `<all_urls>` for overlay injection and logging.
  - `background.service_worker`: `background.js`.
  - `content_scripts`: `content.js` injected on `http://localhost:5000/*` (the Flask app).
  - `web_accessible_resources`: exposes `overlay.html` and `overlay.css` to injected pages.

- **Background script (`background.js`)**
  - On action click, injects `overlay.js` into the active tab:
    ```js
    chrome.action.onClicked.addListener((tab) => {
      chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: ['overlay.js']
      });
    });
    ```
  - Approximates token count with a simple heuristic (word count + length-based adjustment) before logging to the server.
  - Stores and retrieves `openaiApiKey` and `userId` in `chrome.storage.sync` and logs them for debugging.
  - Handles messages:
    - `setUserId` / `getUserId`
    - `setApiKey` / `getApiKey`
    - `contentScriptQuery === "queryChatGPT"` → calls `handleChatGPTQuery`, which:
      - Fetches the API key and user ID from storage.
      - Calls the OpenAI completions endpoint.
      - Uses the approximate token count to call `sendDataToServer`, which POSTs to `http://127.0.0.1:5000/api/store`.

- **Content script (`content.js`)**
  - Runs on the Flask app’s domain.
  - Listens to `window.postMessage` events from the page and maps them to Chrome runtime messages:
    - `SET_USER_ID` → `chrome.runtime.sendMessage({ action: "setUserId", userId })`
    - `GET_USER_ID` → `chrome.runtime.sendMessage({ action: "getUserId" })` → replies back with `USER_ID_RESPONSE`.
    - `FROM_PAGE` → forwards a generic message to the background, then posts `FROM_EXTENSION` back to the page with the response.
  - On DOMContentLoaded at `http://127.0.0.1:5000/`, if a `userId` exists in storage, it POSTs it to `/receive-user-id` so the Flask app can reconcile session state.

- **Overlay script (`overlay.js`)**
  - Injects `overlay.css` into the `<head>` and appends the HTML from `overlay.html` into the `<body>`.
  - Maintains a `requesting` flag to avoid concurrent requests.
  - On “:)” button click:
    - Updates the text box with the current URL and adds a loading class to the button.
    - Sends `{ contentScriptQuery: "queryChatGPT", url: currentUrl }` to the background script.
    - On response:
      - Removes the loading state.
      - Extracts the main quote from the `[[...]]`-delimited sections returned by the fine-tuned model, picks the longest chunk, removes special characters, and gradually reveals it character by character for a simple typing effect.

### Backend internals

- **Flask app (`server-side/app.py`)**
  - Uses `cs50.SQL("sqlite:///api-logs.db")` to interact with SQLite.
  - `users` table:
    - `id`, `username` (unique), `password_hash` (unique).
  - `apicalls` table:
    - `id`, `time` (default current timestamp), `user_id`, `tokens`, `url`, `response`.
  - Routes:
    - `/`: If `session['user_id']` is set and valid, loads user info and API logs, computes total tokens and total requests, and renders `index.html`. Otherwise, shows `login.html`.
    - `/register`: Handles registration, checks unique username, hashes password, inserts user, sets `session['user_id']`, and returns `post_register.html` (which kicks off the client–extension sync).
    - `/login`: Validates credentials using `check_password_hash`, sets `session['user_id']`, and returns `post_login.html`.
    - `/logout`: Clears or sets `session['user_id']` appropriately and returns `post_logout.html`.
    - `/options`: Only accessible if `session['user_id'] != -1`; renders the API key configuration page.
    - `/api/store`: (Implied from `background.js`) API endpoint to store logs from the extension.

- **Client–extension sync (“handshake”)**
  - After register / login / logout, the templates `post_register.html`, `post_login.html`, and `post_logout.html` run a script:
    ```js
    window.addEventListener('DOMContentLoaded', (event) => {
      setTimeout(function() {
        var userId = {{ user_id or -1 }};
        window.postMessage({ type: 'SET_USER_ID', userId: userId }, '*');
        window.location.href = '/';
      }, 1000);
    });
    ```
  - The 1-second delay is a pragmatic workaround because the content script injection timing and Chrome’s security constraints made a more robust handshake tricky in the first iteration.

- **Options page scripts (`server-side/static/options.js`)**
  - Provides a small single-page flow:
    - Reads the user’s API key input.
    - Calls `verifyApiKey` by issuing a GET to `https://api.openai.com/v1/models` with the provided key.
    - Shows a loading spinner via a `loading` class and toggles the error message’s visibility.
    - If valid, posts a message (`FROM_PAGE`) that the content script forwards to the background as `{ action: "setApiKey", apiKey }`.

### Model training & experimentation

- **Fine-tuning**
  - `development/training3.jsonl` holds prompt/completion pairs like:
    ```json
    {
      "prompt": "You are a supportive assistant interpreting inputs as positive, supportive, statistically correct, and sometimes humorous sayings! You are designed to be positive, enjoyable, and natural. Input: 'https://en.wikipedia.org/wiki/Solar_System'",
      "completion": "[[Like the planets in the solar system, each of us has a unique path that contributes to the harmony of the whole.]]"
    }
    ```
  - The completions are wrapped in `[[...]]`, which `overlay.js` expects and parses.

- **Testing scripts**
  - `request_general_model.py`:  
    - Loads `OPENAI_API_KEY2` from `.env` with `dotenv`.
    - Hits a specific fine-tuned Babbage engine and prints out the trimmed completion.
  - `request_assistant.py`:  
    - Tests the Assistants beta endpoint using `ASSISTANT_KEY`.
    - Demonstrates a simple conversation flow.

## Results

- I built a working Chrome extension and backend that:
  - Lets me log in, configure an OpenAI API key, and sync that state to the extension.
  - Generates URL-aware positive quotes on arbitrary webpages with a single click.
  - Logs all activity per user into an SQLite database, with a dashboard for reviewing usage.
- I gained practical experience with:
  - Chrome Manifest V3 patterns (service workers, `chrome.scripting`, `chrome.storage.sync`).
  - Secure credential handling (hashing passwords, keeping API keys out of the backend).
  - Bridging browser extensions with a traditional web app using `postMessage` and content scripts.
- Although the repository is relatively small and has no stars yet, it served as a solid capstone for combining frontend, backend, and ML integration.

## Lessons Learned

- **Extension–page communication is subtle**: Getting a reliable handshake between the Flask pages and content scripts was harder than expected. I resorted to a timed workaround, but I now have a better mental model for permissions, injection timing, and message channels in Chrome.
- **Storing user state across systems requires clear contracts**: Using `-1` as a “guest” `user_id` is simple but effective. It made it easier to think about login/logout while preserving usability.
- **BYO API key simplifies security but complicates UX**: Not hosting keys is nice for security and cost reasons, but it required validation flows, error states, and clear messaging to the user.
- **Token estimation can be approximate**: For logging and billing-like scenarios, a heuristic can be “good enough,” but real-world systems would likely integrate proper token counting.
- **Even small projects benefit from design docs**: Writing `DESIGN.md` and explicitly documenting trade-offs (like the delay-based handshake) helped clarify where the most important technical debt lives.

## Links

- [GitHub Repository](https://github.com/IsaiahJMurray/Vibes-Button)
- [Live Demo (placeholder)](https://example.com/vibes-button-demo)