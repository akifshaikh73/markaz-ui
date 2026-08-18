import React, { createContext, useContext, useState, useEffect } from 'react';

const API_URL = process.env.REACT_APP_API_URL || '';
const CACHE_KEY = 'masjidList';

const MasjidContext = createContext({ masjids: [], loading: true });

export function MasjidProvider({ children }) {
    const [masjids, setMasjids] = useState(() => {
        try {
            const cached = sessionStorage.getItem(CACHE_KEY);
            return cached ? JSON.parse(cached) : [];
        } catch { return []; }
    });
    const [loading, setLoading] = useState(() => !sessionStorage.getItem(CACHE_KEY));

    useEffect(() => {
        fetch(`${API_URL}/api/masjids`)
            .then(r => r.ok ? r.json() : null)
            .then(data => {
                if (!data) return;
                sessionStorage.setItem(CACHE_KEY, JSON.stringify(data));
                setMasjids(data);
                setLoading(false);
            })
            .catch(() => setLoading(false));
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    return (
        <MasjidContext.Provider value={{ masjids, loading }}>
            {children}
        </MasjidContext.Provider>
    );
}

export function useMasjidConfig() {
    const { masjids, loading } = useContext(MasjidContext);

    const getMasjidByLanding = (slug) =>
        masjids.find(m => m.landing === slug) ?? null;

    const getMasjidById = (id) =>
        masjids.find(m => String(m._id ?? m.id) === String(id)) ?? null;

    // string id → units[] map
    const masjidUnitsMap = Object.fromEntries(
        masjids.map(m => [String(m._id ?? m.id), Array.isArray(m.units) ? m.units : []])
    );

    return { masjids, loading, getMasjidByLanding, getMasjidById, masjidUnitsMap };
}
