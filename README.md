# 🕵️ Undercover

A real-time multiplayer word deduction game. Find the impostors before they blend in — or be the impostor and survive.

[![React](https://img.shields.io/badge/React-18-61dafb?style=flat-square&logo=react)](https://react.dev)
[![Firebase](https://img.shields.io/badge/Firebase-Firestore-orange?style=flat-square&logo=firebase)](https://firebase.google.com)
[![Vite](https://img.shields.io/badge/Vite-5-646cff?style=flat-square&logo=vite)](https://vitejs.dev)
[![Vercel](https://img.shields.io/badge/Deployed-Vercel-black?style=flat-square&logo=vercel)](https://vercel.com)

---

## How to play

Each player receives a secret word. Most players share the **same word** (civilians), but one or more receive a **different, similar word** (impostors). One player may get **no word at all** (Mr. White).

Players take turns giving a one-word clue related to their word. After everyone has spoken, the group votes to eliminate whoever seems most suspicious. The most-voted player is eliminated and their role is revealed.

- **Civilians win** by eliminating all impostors
- **Impostors win** by surviving until civilians are outnumbered, or if a civilian is eliminated
- **Mr. White wins** if eliminated but correctly guesses the civilian word

---

## Features

- **Real-time multiplayer** — Firestore listeners keep all players in sync instantly
- **Room system** — Create or join via a 6-letter code or shareable link
- **Avatar picker** — Choose an emoji avatar before joining
- **3 game views** — Chat, Round Table, and Stage — switchable mid-game on desktop
- **Configurable rounds** — Host sets number of rounds, impostors, Mr. White, and role visibility
- **Bilingual word bank** — 100 word pairs in French and English, auto-detected from browser language with manual override
- **Custom words** — Host can set their own civilian/impostor word pair
- **Turn order** — Structured clue-giving with a clear turn indicator and optional timeline
- **Mr. White guess phase** — When the impostor is eliminated, Mr. White gets one shot to guess the civilian word
- **Voting system** — All alive players vote; most-voted is eliminated
- **Results screen** — Full role reveal, word pair, and Mr. White guess outcome

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
2. Enable **Firestore Database** — Standard edition, `eur3` region recommended
3. Enable **Authentication → Sign-in method → Anonymous**
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

Make sure `vercel.json` is at the root to handle client-side routing:

```json
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

---

## Project structure

```
src/
├── components/
│   └── ViewSwitcher.jsx    # Chat / Table / Stage view toggle
├── hooks/
│   └── useViewPreference.js  # Persists chosen game view to localStorage
├── pages/
│   ├── BugReport.jsx       # Bug report button (inline + floating modes)
│   ├── Home.jsx            # Landing — create or join a room
│   ├── Lobby.jsx           # Waiting room with live player list
│   ├── Wait.jsx            # Non-host holding screen during setup
│   ├── Settings.jsx        # Host configures the round
│   ├── WordReveal.jsx      # Each player sees their secret word privately
│   ├── Game.jsx            # Clue phase — orchestrates the 3 views
│   ├── GameViewTable.jsx   # Round table desktop view
│   ├── GameViewStage.jsx   # Amphitheatre desktop view
│   ├── Vote.jsx            # Voting phase
│   ├── MrWhiteGuess.jsx    # Mr. White's word guess after impostor is eliminated
│   └── Result.jsx          # Round results and full role reveal
├── lib/
│   ├── firebase.js         # Firebase init (Firestore + Auth)
│   ├── room.js             # Create/join room logic
│   ├── gameLogic.js        # Role assignment and round start
│   └── words.js            # FR/EN word banks + language detection
├── App.jsx                 # Routes
├── main.jsx                # Entry point
└── index.css               # Global design system (dark theme)
```

---

## Firestore data model

```
rooms/{roomCode}
├── code, hostId, status, currentRound
├── showRoles, lang, mrWhiteUid, mrWhiteWon, mrWhiteGuess
├── playerOrder: [uid, ...], currentTurnIndex: number
├── wordPair: { civilian, impostor }
├── settings: { impostorCount, mrWhiteEnabled, showRoles, roundCount }
└── players/{playerId}
    ├── name, avatar, isHost, isAlive
    ├── role: "civilian" | "impostor" | "mrWhite"
    ├── word, ready, hasVoted, votedFor
```

---

## Game views (desktop only)

On desktop (≥ 1024px), players can switch between three views at any time using the switcher in the topbar. The preference is saved to `localStorage`.

| View | Description |
|---|---|
| 💬 Chat | Default view — classic message feed with player avatars |
| ⬡ Table | Round table — players split into two columns, all clues visible per player |
| 🎭 Stage | Amphitheatre — active players in the foreground, others in the back row |

On mobile, only the chat view is available.

---

## Known limitations

- No rejoin after closing the tab — uid is stored in `sessionStorage` and lost on close
- No tie-breaking on votes — first player alphabetically wins on a tie
- Old rooms are never deleted from Firestore automatically

---

## Report a bug

Found something broken? [**Open an issue →**](https://github.com/your-username/undercover/issues/new?assignees=&labels=bug&title=%5BBUG%5D+)

---

## License

MIT