# Rowing Live Dashboard

This app is a **rowing dashboard** that talks to a **Concept2 PM5** ergometer over **Web Bluetooth**. It shows live performance data on your computer or phone while you row, lets you plan and run workouts (time or distance), and keeps a **logbook** of sessions with charts and summaries.

**What it does:**

- **Live view** — Connects to your PM5 and displays stroke rate, distance, pace, watts, drag factor, drive length, heart rate, and predicted finish time in real time.
- **Power chart** — Plots power output (and pace) over the session so you can see splits and consistency.
- **Workouts** — Choose a standard workout (e.g. 2k, 5k, 10k, 30 min) or define custom time/distance targets and track progress during the row.
- **Logbook** — Save each session with notes and settings; review past rows with summary cards and charts. Data is stored in your browser (localStorage).
- **Demo mode** — Try the UI without a rower by running simulated data.

## Features

- **Bluetooth** — Fitness Machine Service (0x1826) / Indoor Rowing Data (0x2AD1); PM5 in BLE pairing mode
- **Metrics** — Stroke rate, distance rowed, distance to go, drag factor, drive length, watts, average/instant pace, predicted finish time, heart rate, METs
- **Charts** — Live power and pace over the session
- **Workouts** — Preset and custom time/distance targets
- **Logbook** — Session summaries and charts stored in the browser
- **Demo mode** — Simulated data when no rower is connected

## Getting Started

```bash
npm install
npm run dev
```

Open the app at http://localhost:5173. Web Bluetooth requires a secure context,
so use Chrome or Edge and run the site locally or over HTTPS.

## Notes on Bluetooth

This app listens to the Bluetooth Fitness Machine Service (UUID 0x1826) and the
Indoor Rowing Data characteristic (UUID 0x2AD1). The Concept2 PM5 should be in
BLE pairing mode before connecting.

## `push` script

A small script at `~/scripts/push` runs `git add . && git commit -m "..." && git push`. To have it on your PATH:

```bash
# One-time setup: add ~/scripts to PATH
echo 'export PATH="$HOME/scripts:$PATH"' >> ~/.zshrc
source ~/.zshrc
chmod +x ~/scripts/push
```

Then from any repo:

```bash
push "your commit message"
```
