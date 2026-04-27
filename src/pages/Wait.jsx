import { useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { db } from "../lib/firebase";
import { doc, onSnapshot } from "firebase/firestore";

export default function Wait() {
    const { code } = useParams();
    const navigate = useNavigate();

    useEffect(() => {
        const unsub = onSnapshot(doc(db, "rooms", code), snap => {
            if (!snap.exists()) return;
            const { status } = snap.data();
            if (status === "reveal") navigate(`/reveal/${code}`);
            if (status === "lobby") navigate(`/lobby/${code}`);
            if (status === "mrWhiteGuess") navigate(`/mrwhite/${code}`);
        });
        return () => unsub();
    }, [code, navigate]);

    return (
        <div className="page">
            <div className="spinner fu" />
            <div className="fu1" style={{ textAlign: "center" }}>
                <h2>Stand by</h2>
                <p className="muted-text" style={{ marginTop: 8 }}>The host is setting up the round...</p>
            </div>
        </div>
    );
}