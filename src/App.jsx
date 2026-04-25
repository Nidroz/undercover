import { useEffect } from 'react'
import './App.css'
import {BrowserRouter, Route, Routes} from "react-router-dom";
import { useNavigate, useParams } from "react-router-dom";
import Home from "./pages/Home.jsx";

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
        <Route path="/loby/:code" element={<Lobby />}/>
        <Route path="/join/:code" element={<JoinRedirect />}/>
      </Routes>
    </BrowserRouter>
  )
}

export default App
