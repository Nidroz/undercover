# 🕵️ Undercover

A real-time multiplayer word deduction game built with React and Firebase. Find the impostors before they blend in — or be the impostor and survive.

[![React](https://img.shields.io/badge/React-18-61dafb?style=flat-square&logo=react)](https://react.dev)
[![Firebase](https://img.shields.io/badge/Firebase-Firestore-orange?style=flat-square&logo=firebase)](https://firebase.google.com)
[![Vite](https://img.shields.io/badge/Vite-5-646cff?style=flat-square&logo=vite)](https://vitejs.dev)
[![Deployed on Vercel](https://img.shields.io/badge/Deployed-Vercel-black?style=flat-square&logo=vercel)](https://vercel.com)

---

## How to play

Each player receives a secret word. Most players get the **same word** (civilians), but one or more get a **different, similar word** (impostors). One player may receive **no word at all** (Mr. White).

Taking turns, each player gives a one-word clue related to their word without revealing it. After everyone has spoken, players vote on who they think the impostor is. The most-voted player is eliminated and their role is revealed.

**Civilians win** by eliminating all impostors.  
**Impostors win** if they survive the vote or if a civilian is eliminated.  
**Mr. White wins** if eliminated but correctly guesses the civilian word.

---

## Features

- 🔴 **Real-time multiplayer** — Firestore listeners keep all players in sync instantly
- 🏠 **Room system** — Create or join a game via a 6-letter code or shareable link
- 🎭 **Avatar picker** — Choose your emoji avatar before joining
- ⚙️ **Configurable rounds** — Host sets number of rounds, impostors, and Mr. White
- 🎲 **Word themes** — Random, Animals, Food, Movies, Sport, Tech — or set custom words
- 🔄 **Turn order** — Structured clue-giving with a clear turn indicator
- 🗳️ **Voting system** — All-alive players vote; most-voted is eliminated
- 📊 **Results screen** — Full role reveal, eliminated player, word pair shown

---

## Tech stack

| Layer | Tech |
|---|---|
| Frontend | React 18 + Vite |
| Realtime DB | Firebase Firestore |
| Auth | Firebase Anonymous Auth |
| Hosting | Vercel |
| Styling | Pure CSS (custom design system) |

---

## Getting started

### Prerequisites

- Node.js 18+
- A Firebase project with Firestore and Anonymous Auth enabled

### Installation

```bash
git clone https://github.com/your-username/undercover.git
cd undercover
npm install
```

### Firebase setup

1. Go to [Firebase Console](https://console.firebase.google.com) and create a project
2. Enable **Firestore Database** (Standard edition, `eur3` region recommended)
3. Enable **Authentication → Anonymous**
4. Set Firestore rules to open for development:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true;
    }
  }
}
```

> ⚠️ Tighten these rules before going to production.

### Environment variables

Create a `.env.local` file at the root:

```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

### Run locally

```bash
npm run dev
```

### Deploy to Vercel

```bash
npm run build
vercel deploy
```

Add your `.env.local` variables in the Vercel project settings under **Environment Variables**.

---

## Project structure

```
src/
├── pages/
│   ├── Home.jsx        # Landing page — create or join
│   ├── Lobby.jsx       # Waiting room with live player list
│   ├── Wait.jsx        # Non-host waiting screen during setup
│   ├── Settings.jsx    # Host configures the round
│   ├── WordReveal.jsx  # Each player sees their secret word
│   ├── Game.jsx        # Clue phase with turn order and chat
│   ├── Vote.jsx        # Voting phase
│   └── Result.jsx      # Round results and role reveal
├── lib/
│   ├── firebase.js     # Firebase init (Firestore + Auth)
│   ├── room.js         # Create/join room logic
│   ├── gameLogic.js    # Role assignment, round start
│   └── words.js        # Word bank by theme
├── App.jsx             # Routes
├── main.jsx            # Entry point
└── index.css           # Global design system
```

---

## Firestore data model

```
rooms/{roomCode}
├── code, hostId, status, currentRound
├── settings: { impostorCount, mrWhiteEnabled, theme, customWords, roundCount }
├── wordPair: { civilian, impostor }
├── playerOrder: [uid, ...]
├── currentTurnIndex: number
└── players/{playerId}
    ├── name, avatar, isHost
    ├── role: "civilian" | "impostor" | "mrWhite"
    ├── word, isAlive, hasVoted, votedFor, ready
```

---

## Known limitations

- No rejoin after accidentally closing the tab (uid is stored in `sessionStorage`)
- No tie-breaking logic on votes — first alphabetically wins
- Mr. White word-guessing screen not yet implemented
- Room cleanup (old rooms are not deleted automatically)

---

## Report a bug

Found something broken? [**Open an issue →**](https://github.com/your-username/undercover/issues/new?assignees=&labels=bug&template=bug_report.md&title=%5BBUG%5D+)

Or copy this template:

```
**What happened:**

**Steps to reproduce:**
1.
2.
3.

**Expected behavior:**

**Browser / device:**
```

---

## License

MIT