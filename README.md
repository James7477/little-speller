# Little Speller

A tablet game for ages 3–6: spelling words, simple sums and a letter hunt, with a
parent's own recorded voice for praise. No timers, no losing, big tap targets.

**Play it:** https://site-8a9fbc1648df40ef814657d9407371e0.freebuff.page

## What's in here

| Path | What it is |
| --- | --- |
| `public/index.html` | The game screen (home, name card, age card, HUD, grown-up panel) |
| `public/game.js` | All the logic: word lists per age, sums, letter hunt, speech, recordings |
| `public/styles.css` | Styling, sized for a tablet held by a small child |
| `worker.js` | Tiny Cloudflare Worker that just serves `public/` |
| `manifest.json` | Deploy manifest (static assets, SPA routing) |

There is no build step and no dependencies — it is plain HTML, CSS and JavaScript.

## Running it

Open `public/index.html` in a browser, or serve the folder:

```bash
cd public
python3 -m http.server 3000
```

Then visit http://localhost:3000. Use `localhost` or an `https://` address rather
than a bare file path, because the microphone permission needed for recording is
only granted in those cases.

## One file, no connection

`offline/LittleSpeller.html` is the entire game in a single file — styles and
script inlined, nothing fetched at runtime. Copy that one file onto the tablet and
open it in a browser; it plays with the tablet in airplane mode. Recordings are
kept in that browser's storage on that device, so it's worth recording the voice
on the tablet itself.

Rebuild it after changing anything in `public/`:

```bash
python3 tools/build-offline.py
```

## The grown-up panel

Hold the small button in the corner to open it. From there you can set the child's
name and age, and record up to five praise phrases plus the "How old are you?"
question. Recordings are stored on that device only (browser storage) and never
leave it. Anything not recorded falls back to the browser's spoken voice.

Age bands change the words (3 letters at age 3 up to 5 letters at age 6), the sums
and how many decoy letters the letter hunt shows.
