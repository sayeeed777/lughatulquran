# Android (Capacitor) Setup

This project now includes a Capacitor Android shell in `android/`.

## 1) Prerequisites

- Node.js 24+
- Android Studio
- Java Runtime (JDK 17+ recommended)

## 2) Install dependencies

```bash
npm install
```

## 3) Configure app URL

Capacitor uses `server.url` from `capacitor.config.ts`.

- Default is `http://10.0.2.2:3000` (Android emulator -> host machine)
- For production, set your deployed HTTPS URL:

```bash
export CAPACITOR_SERVER_URL="https://your-domain.com"
```

## 4) Development flow

Terminal 1:

```bash
npm run dev
```

Terminal 2:

```bash
npm run cap:copy
npm run cap:android
```

Then run the app from Android Studio.

## 5) After web changes

```bash
npm run cap:copy
```

If plugins/config change:

```bash
npm run cap:sync
```
