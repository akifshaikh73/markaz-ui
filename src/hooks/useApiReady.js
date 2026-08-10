import { useState, useEffect } from 'react';
import React from 'react';

const API_URL = process.env.REACT_APP_API_URL || '';

export const isRemoteApi = Boolean(
    API_URL &&
    !API_URL.toLowerCase().includes('localhost') &&
    !API_URL.toLowerCase().includes('127.0.0.1')
);

export function useApiReady() {
    const [apiReady, setApiReady] = useState(!isRemoteApi);

    useEffect(() => {
        if (apiReady) return;
        let cancelled = false;
        const check = () => {
            fetch(`${API_URL}/api/dbStatus`)
                .then(res => { if (!res.ok) throw new Error(); return res.json(); })
                .then(() => { if (!cancelled) setApiReady(true); })
                .catch(() => { if (!cancelled) setTimeout(check, 3000); });
        };
        check();
        return () => { cancelled = true; };
    }, [apiReady]);

    return apiReady;
}

export function ApiSplash() {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', gap: '1rem', color: '#555' }}>
            <div style={{ fontSize: '2rem' }}>🕌</div>
            <p style={{ margin: 0, fontSize: '1.1rem' }}>Connecting to server…</p>
            <p style={{ margin: 0, fontSize: '0.8rem', color: '#aaa' }}>This may take a moment on first load.</p>
        </div>
    );
}
