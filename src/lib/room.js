import { db, auth } from "./firebase";
import { signInAnonymously } from "firebase/auth";
import {
    doc, setDoc, getDoc, updateDoc,
    collection, serverTimestamp,
    increment
} from "firebase/firestore";

const generateCode = () => Math.random().toString(36).toUpperCase().slice(2, 8);

const AVATARS = ["🦊","🐼","🐸","🦁","🐯","🐺","🦝","🐻","🐨","🦄","🐙","🦋"];
export const randomAvatar = () => AVATARS[Math.floor(Math.random() * AVATARS.length)];

export const createRoom = async (playerName, avatar) => {
    const { user } = await signInAnonymously(auth);
    const code= generateCode();

    const roomRef = doc(db, "rooms", code);
    await setDoc(roomRef, {
        code,
        hostId: user.uid,
        status: "lobby",
        currentRound: 0,
        settings: {
            impostorCount: 1,
            mrWhiteEnabled: false,
            theme: "random",
            customWords: null,
            roundCount: 3,
        },
        createdAt: serverTimestamp(),
    });

    const playerRef = doc(collection(roomRef, "players"), user.uid);
    await setDoc(playerRef, {   // add host as first player
        name: playerName,
        avatar: avatar,
        isHost: true,
        isAlive: true,
        hasVoted: false,
        votedFor: null,
        role: null,
        word: null,
    });

    return { code, uid: user.uid};
}

export const joinRoom = async (code, playerName, avatar) => {
    const { user } = await signInAnonymously(auth);
    const roomRef = doc(db, "rooms", code.toUpperCase());
    const roomSnap = await getDoc(roomRef);

    if (!roomSnap.exists()) throw new Error("Room not found");
    if (roomSnap.data().status !== "lobby") throw new Error("Game already started");

    const playerRef = doc(collection(roomRef, "players"), user.uid);
    await setDoc(playerRef, {
        name: playerName,
        avatar: avatar,
        isHost: false,
        isAlive: true,
        hasVoted: false,
        votedFor: null,
        role: null,
        word: null,
    });
    await updateDoc(roomRef, { playerCount: increment(1) });

    return { code: code.toUpperCase(), uid: user.uid };
}