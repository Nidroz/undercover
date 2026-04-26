import {getRandomPair, getRandomPairAnyTheme} from "./words.js";
import { collection, getDocs, doc, updateDoc, writeBatch } from "firebase/firestore";
import {db} from "./firebase.js";

const shuffle = (arr) => [...arr].sort(() => Math.random() - 0.5);

export const startRound = async (roomCode, settings) => {
    const { impostorCount, mrWhiteEnabled, theme, customWords } = settings;
    const pair = customWords ?? getRandomPairAnyTheme(theme);

    const playersRef = collection(db, "rooms", roomCode, "players");
    const snap = await getDocs(playersRef);
    const players = shuffle(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));

    const batch = writeBatch(db);
    let impostorsLeft = impostorCount;
    let mrWhiteAssigned = false;

    players.forEach((player) => {
        let role, word;
        if (impostorsLeft > 0) {
            role = "impostor";
            word = pair.impostor;
            impostorsLeft--;
        } else if (mrWhiteEnabled && !mrWhiteAssigned) {
            role = "mrWhite";
            word = "";
            mrWhiteAssigned = true;
        } else {
            role = "civilian";
            word = pair.civilian;
        }

        const playerRef = doc(db, "rooms", roomCode, "players", player.id);
        batch.update(playerRef, { role, word, isAlive: true, hasVoted: false, votedFor: null, ready: false });
    });

    const roomRef = doc(db, "rooms", roomCode);
    batch.update(roomRef, {
        status: "reveal",
        wordPair: pair,
        currentRound: (settings.currentRound ?? 0) + 1,
    });

    await batch.commit();
};