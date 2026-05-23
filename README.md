# we're not really strangers — online

A real-time multiplayer web game inspired by *We're Not Really Strangers*. Three levels of cards (Perception → Connection → Reflection), wildcards mixed in, and a shareable invite link so you can play with whoever you want.

## Run it locally

```bash
npm install
npm start
```

Then open `http://localhost:3000` in your browser.

To play with someone on the same Wi-Fi, share `http://YOUR_LOCAL_IP:3000` (run `ipconfig` on Windows to find your IP). For anyone *not* on your network, you need to deploy it somewhere — see below.

## Deploy so you can send them a link

The simplest free option is **Render**:

1. Push this folder to a new GitHub repo (e.g. `wnrs-online`).
2. Go to https://render.com and click **New +** → **Web Service**.
3. Connect the repo. Render auto-detects Node — accept the defaults:
   - Build command: `npm install`
   - Start command: `npm start`
4. Wait ~2 minutes. You'll get a URL like `https://wnrs-online.onrender.com`.
5. Send that URL to whoever you want to play with. Either of you can hit **create a room** — the room code becomes part of the URL (e.g. `…?room=A7K2`), and **copy invite link** sends them straight in.

Other one-click hosts that work the same way: **Railway**, **Fly.io**, **Glitch**.

> ⚠️ Render's free tier sleeps after 15 minutes idle. The first request after a sleep takes ~30 seconds to wake. Fine for a casual game; if you want it instant, use Railway or pay $7/mo on Render.

## How it works

- **Level 1 — Perception**: light, getting-to-know questions
- **Level 2 — Connection**: past the small talk, real stuff
- **Level 3 — Reflection**: vulnerable, about each other

Each round: whoever's turn it is draws a card. Question cards are answered, then the turn passes. Wildcards happen on the same turn (read it, do it, then draw a real card). When the deck runs out, everyone has to **ready up** to advance to the next level — it's intentionally consensual. Make sure you're both actually ready before pressing it.

## File layout

```
server.js          Express + Socket.io game server
questions.js       Three decks + wildcards
public/index.html  Markup
public/style.css   Styling (cream + red WNRS palette)
public/app.js      Client logic / Socket.io wiring
```

State is in-memory, so a server restart wipes active rooms. That's fine for this scale.

## Customizing questions

All cards live in `questions.js`. Add, remove, or rewrite to your taste — the format is obvious.
