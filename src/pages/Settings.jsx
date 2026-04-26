import {useNavigate, useParams} from "react-router-dom";
import {useEffect, useState} from "react";
import {doc, onSnapshot} from "firebase/firestore";
import {db} from "../lib/firebase.js";
import {startRound} from "../lib/gameLogic.js";
import {THEMES} from "../lib/words.js";

const THEME_LABELS = {
    random: "🎲 Aléatoire",  // add this
    animaux: "🐾 Animaux",
    food: "🍕 Food",
    films: "🎬 Films",
    sport: "⚽ Sport",
    tech: "💻 Tech",
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

    useEffect(() => {
        const unsub = onSnapshot(doc(db, "rooms", code), (snap) => {
            if (!snap.exists()) return;
            const data = snap.data();
            setRoom(data);
            // redirect non-hosts to waiting screen
            if (data.hostId !== uid) navigate(`/wait/${code}`);
            // redirect everyone when round starts
            if (data.status === "reveal") navigate(`/reveal/${code}`);
        });
        return () => unsub();
    }, [code, uid, navigate]);

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

    const [playerCount, setPlayerCount] = useState(0);
    useEffect(() => {
        const fetchPlayerCount = async () => {
            const { getDocs, collection } = await import("firebase/firestore");
            const snap = await getDocs(collection(db, "rooms", code, "players"));
            setPlayerCount(snap.size);
        };
        fetchPlayerCount();
    }, [code]);
    const maxImpostors = Math.max(1, Math.floor(playerCount / 3));

    return (
        <div className="page">
            <h2>⚙️ Settings</h2>

            <div className="settings-group">
                <label>Impostors</label>
                <div className="counter">
                    <button onClick={() => setSettings(s => ({ ...s, impostorCount: Math.max(1, s.impostorCount - 1) }))}>−</button>
                    <span>{settings.impostorCount}</span>
                    <button onClick={() => setSettings(s => ({ ...s, impostorCount: Math.min(maxImpostors, s.impostorCount + 1) }))}>+</button>
                </div>
            </div>

            <div className="settings-group">
                <label>Rounds</label>
                <div className="counter">
                    <button onClick={() => setSettings(s => ({ ...s, roundCount: Math.max(1, s.roundCount - 1) }))}>−</button>
                    <span>{settings.roundCount}</span>
                    <button onClick={() => setSettings(s => ({ ...s, roundCount: Math.min(10, s.roundCount + 1) }))}>+</button>
                </div>
            </div>

            <div className="settings-group">
                <label>
                    <input
                        type="checkbox"
                        checked={settings.mrWhiteEnabled}
                        onChange={e => setSettings(s => ({ ...s, mrWhiteEnabled: e.target.checked }))}
                    />
                    {" "}Mr. White
                </label>
            </div>

            <div className="settings-group">
                <label>Theme</label>
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

            <div className="settings-group">
                <label>
                    <input
                        type="checkbox"
                        checked={useCustom}
                        onChange={e => setUseCustom(e.target.checked)}
                    />
                    {" "}Personalised Words
                </label>
                {useCustom && (
                    <div className="custom-words">
                        <input
                            placeholder="Civilian Word"
                            value={customCivilian}
                            onChange={e => setCustomCivilian(e.target.value)}
                        />
                        <input
                            placeholder="Impostor Word"
                            value={customImpostor}
                            onChange={e => setCustomImpostor(e.target.value)}
                        />
                    </div>
                )}
            </div>

            <button onClick={handleLaunch} disabled={loading}>
                {loading ? "Launching..." : "Launch round"}
            </button>
        </div>
    );
}