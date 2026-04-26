import { useNavigate, useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "../lib/firebase.js";
import { startRound } from "../lib/gameLogic.js";
import { THEMES } from "../lib/words.js";

const THEME_LABELS = {
    random:  "🎲 Random",
    animaux: "🐾 Animals",
    food:    "🍕 Food",
    films:   "🎬 Movies",
    sport:   "⚽ Sport",
    tech:    "💻 Tech",
};

export default function Settings() {
    const { code } = useParams();
    const navigate = useNavigate();
    const uid = sessionStorage.getItem("uid");

    const [room, setRoom] = useState(null);
    const [settings, setSettings] = useState({
        impostorCount: 1,
        mrWhiteEnabled: false,
        theme: "random",
        customWords: null,
        roundCount: 3,
    });
    const [customCivilian, setCustomCivilian] = useState("");
    const [customImpostor, setCustomImpostor] = useState("");
    const [useCustom, setUseCustom] = useState(false);
    const [loading, setLoading] = useState(false);
    const [playerCount, setPlayerCount] = useState(0);

    useEffect(() => {
        const unsub = onSnapshot(doc(db, "rooms", code), snap => {
            if (!snap.exists()) return;
            const data = snap.data();
            setRoom(data);
            if (data.hostId !== uid) navigate(`/wait/${code}`);
            if (data.status === "reveal") navigate(`/reveal/${code}`);
        });
        return () => unsub();
    }, [code, uid, navigate]);

    useEffect(() => {
        const fetch = async () => {
            const { getDocs, collection } = await import("firebase/firestore");
            const snap = await getDocs(collection(db, "rooms", code, "players"));
            setPlayerCount(snap.size);
        };
        fetch();
    }, [code]);

    const maxImpostors = Math.max(1, Math.floor(playerCount / 3));

    const handleLaunch = async () => {
        setLoading(true);
        try {
            const finalSettings = {
                ...settings,
                customWords: useCustom && customCivilian && customImpostor
                    ? { civilian: customCivilian, impostor: customImpostor }
                    : null,
                currentRound: room?.currentRound ?? 0,
            };
            await startRound(code, finalSettings);
        } catch (e) {
            console.error("Failed to launch game:", e);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="page">
            <div className="fu" style={{ textAlign: "center", width: "100%" }}>
                <p className="eyebrow">Game configuration</p>
                <h2 style={{ marginTop: 4 }}>Settings</h2>
            </div>

            {/* main settings card */}
            <div className="card fu1">
                {/* impostors */}
                <div className="setting-row">
                    <div>
                        <div className="setting-label">Impostors</div>
                        <div className="setting-sub">Max {maxImpostors} for {playerCount} players</div>
                    </div>
                    <div className="counter">
                        <button className="counter-btn" onClick={() => setSettings(s => ({ ...s, impostorCount: Math.max(1, s.impostorCount - 1) }))}>−</button>
                        <span className="counter-val">{settings.impostorCount}</span>
                        <button className="counter-btn" onClick={() => setSettings(s => ({ ...s, impostorCount: Math.min(maxImpostors, s.impostorCount + 1) }))}>+</button>
                    </div>
                </div>

                {/* rounds */}
                <div className="setting-row">
                    <div className="setting-label">Rounds</div>
                    <div className="counter">
                        <button className="counter-btn" onClick={() => setSettings(s => ({ ...s, roundCount: Math.max(1, s.roundCount - 1) }))}>−</button>
                        <span className="counter-val">{settings.roundCount}</span>
                        <button className="counter-btn" onClick={() => setSettings(s => ({ ...s, roundCount: Math.min(10, s.roundCount + 1) }))}>+</button>
                    </div>
                </div>

                {/* mr white */}
                <div className="setting-row">
                    <div>
                        <div className="setting-label">Mr. White</div>
                        <div className="setting-sub">One player with no word</div>
                    </div>
                    <div
                        className={`toggle ${settings.mrWhiteEnabled ? "on" : ""}`}
                        onClick={() => setSettings(s => ({ ...s, mrWhiteEnabled: !s.mrWhiteEnabled }))}
                    />
                </div>
            </div>

            {/* theme */}
            <div className="fu2" style={{ width: "100%" }}>
                <p className="eyebrow" style={{ marginBottom: 10 }}>Word theme</p>
                <div className="theme-grid">
                    {["random", ...THEMES].map(t => (
                        <button
                            key={t}
                            className={`theme-btn ${settings.theme === t && !useCustom ? "active" : ""}`}
                            onClick={() => { setSettings(s => ({ ...s, theme: t })); setUseCustom(false); }}
                        >
                            {THEME_LABELS[t]}
                        </button>
                    ))}
                </div>
            </div>

            {/* custom words */}
            <div className="card fu3">
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <div>
                        <div className="setting-label">Custom words</div>
                        <div className="setting-sub">Set your own word pair</div>
                    </div>
                    <div
                        className={`toggle ${useCustom ? "on" : ""}`}
                        onClick={() => setUseCustom(v => !v)}
                    />
                </div>
                {useCustom && (
                    <div className="stack" style={{ marginTop: 14 }}>
                        <input placeholder="Civilian word" value={customCivilian} onChange={e => setCustomCivilian(e.target.value)} />
                        <input placeholder="Impostor word" value={customImpostor} onChange={e => setCustomImpostor(e.target.value)} />
                    </div>
                )}
            </div>

            <div className="fu4" style={{ width: "100%" }}>
                <button className="btn-gold" onClick={handleLaunch} disabled={loading}>
                    {loading ? "Launching..." : "🚀 Launch round"}
                </button>
            </div>
        </div>
    );
}