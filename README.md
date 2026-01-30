# Rowing Live Dashboard

Rowing Live Dashboard is a web app that connects to a Concept2 PM5 over Web
Bluetooth and mirrors the standard performance views. It includes live stroke
metrics, pace and power charts, workout planning, and a logbook with post-row
analysis.

## Features

- Live Concept2 Bluetooth connection (Fitness Machine Service / Indoor Rowing)
- Standard view metrics: stroke rate, distance rowed, distance to go, drag
  factor, drive length, watts, average pace, predicted finish time
- Live power output chart with pace overlay
- Standard and custom workout builder
- Logbook with summary cards and charts for each session
- Demo mode for testing without hardware

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
