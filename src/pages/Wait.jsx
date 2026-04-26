import { useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { db } from "../lib/firebase";
import { doc, onSnapshot } from "firebase/firestore";

export default function Wait() {
    const { code } = useParams();
    const navigate = useNavigate();

    useEffect(() => {
        const unsub = onSnapshot(doc(db, "rooms", code), (snap) => {
            if (!snap.exists()) return;
            const { status } = snap.data();
            if (status === "reveal") navigate(`/reveal/${code}`);
        });
        return () => unsub();
    }, [code, navigate]);

    return (
        <div className="page">
            <h2>🕐 WAITING...</h2>
            <p>Host is setting up the game</p>
        </div>
    );
}