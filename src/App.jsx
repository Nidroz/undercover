import { useEffect } from 'react'
import './App.css'
import {BrowserRouter, Route, Routes} from "react-router-dom";
import { useNavigate, useParams } from "react-router-dom";
import Home from "./pages/Home.jsx";
import Lobby from "./pages/Lobby.jsx";
import Settings from "./pages/Settings.jsx";
import Wait from "./pages/Wait.jsx";
import WordReveal from "./pages/WordReveal.jsx";
import Game from "./pages/Game.jsx";
import Vote from "./pages/Vote.jsx";
import Result from "./pages/Result.jsx";

function JoinRedirect() {
    const { code } = useParams();
    const navigate = useNavigate();
    useEffect(() => {
        navigate(`/?join=${code}`);
    }, [code, navigate]);
    return null;
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />}/>
        <Route path="/lobby/:code" element={<Lobby />}/>
        <Route path="/join/:code" element={<JoinRedirect />}/>
        <Route path="/settings/:code" element={<Settings />}/>
        <Route path="/wait/:code" element={<Wait />}/>
        <Route path="/reveal/:code" element={<WordReveal />}/>
        <Route path="/game/:code" element={<Game />}/>
        <Route path="/vote/:code" element={<Vote />}/>
        <Route path="/result/:code" element={<Result />}/>
      </Routes>
    </BrowserRouter>
  )
}

export default App
