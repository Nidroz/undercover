import { useState, useEffect } from 'react';

const STORAGE_KEY = 'undercover_view';
const VIEWS = ['chat', 'table', 'stage'];

// detect if we're on a real desktop (window width >= 1024px)
export const isDesktop = () => window.innerWidth >= 1024;

export const useViewPreference = () => {
    const [view, setViewState] = useState(() => {
        if (!isDesktop()) return 'chat'; // default to chat on mobile
        return localStorage.getItem(STORAGE_KEY) ?? "table"; // default to table on desktop
    });

    useEffect(() => {
        const onResize = () => {
            if (!isDesktop()) setViewState('chat'); // force chat view on mobile        
        };
        window.addEventListener('resize', onResize);
        return () => window.removeEventListener('resize', onResize);
    }, []);

    const setView = (newView) => {
        if (!VIEWS.includes(newView)) return;
        localStorage.setItem(STORAGE_KEY, newView);
        setViewState(newView);
    };

    return { view, setView, isDesktop: isDesktop() };
};

export { VIEWS };