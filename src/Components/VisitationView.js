import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { formatDate } from '../utils';

function VisitationView() {
    const navigate = useNavigate();
    const location = useLocation();
    const API_URL = process.env.REACT_APP_API_URL || '';
    const masjidID = location.state?.masjidID;

    const [total, setTotal] = useState(5);
    const [filterUnit, setFilterUnit] = useState('');
    const [filterArea, setFilterArea] = useState('');
    const [applied, setApplied] = useState(null);
    const [allListings, setAllListings] = useState([]);
    const [loading, setLoading] = useState(false);
    const [fetchError, setFetchError] = useState('');

    // On mount — fetch all listings for the masjid (no unit filter)
    useEffect(() => {
        if (!masjidID) {
            // Fall back to localStorage if no masjidID passed
            try { setAllListings(JSON.parse(localStorage.getItem('addressList')) || []); }
            catch { setAllListings([]); }
            return;
        }
        setLoading(true);
        fetch(`${API_URL}/api/addressList/list?masjid_id=${masjidID}`)
            .then(r => r.json())
            .then(data => setAllListings(Array.isArray(data) ? data : []))
            .catch(() => setFetchError('Failed to load listings'))
            .finally(() => setLoading(false));
    }, [masjidID, API_URL]);

    // Derive unique unit and area options from active listings
    const { unitOptions, areaOptions } = useMemo(() => {
        const active = allListings.filter(a => !a.inactive);
        const units = [...new Set(active.map(a => String(a.unitId ?? '—')))].sort();
        const areas = [...new Set(active.map(a => (a.area && a.area.trim()) ? a.area.trim() : '(No Area)'))].sort();
        return { unitOptions: units, areaOptions: areas };
    }, [allListings]);

    // Filtered area options based on selected unit
    const filteredAreaOptions = useMemo(() => {
        if (!filterUnit) return areaOptions;
        const active = allListings.filter(a => !a.inactive && String(a.unitId ?? '—') === filterUnit);
        return [...new Set(active.map(a => (a.area && a.area.trim()) ? a.area.trim() : '(No Area)'))].sort();
    }, [filterUnit, allListings, areaOptions]);

    const compute = () => {
        const active = allListings.filter(a => {
            if (a.inactive) return false;
            if (filterUnit && String(a.unitId ?? '—') !== filterUnit) return false;
            if (filterArea) {
                const area = (a.area && a.area.trim()) ? a.area.trim() : '(No Area)';
                if (area !== filterArea) return false;
            }
            return true;
        });

        // Build map: unitId → area → [listings sorted by date asc]
        const byUnit = {};
        for (const a of active) {
            const unit = String(a.unitId ?? '—');
            const area = (a.area && a.area.trim()) ? a.area.trim() : '(No Area)';
            if (!byUnit[unit]) byUnit[unit] = {};
            if (!byUnit[unit][area]) byUnit[unit][area] = [];
            byUnit[unit][area].push(a);
        }

        const getDate = (a) => {
            const d = new Date((a.lastModifiedDate?.$date) ?? a.lastModifiedDate ?? 0);
            return isNaN(d.getTime()) ? 0 : d.getTime();
        };
        for (const unit of Object.keys(byUnit))
            for (const area of Object.keys(byUnit[unit]))
                byUnit[unit][area].sort((x, y) => getDate(x) - getDate(y));

        const buckets = [];
        for (const unit of Object.keys(byUnit).sort())
            for (const area of Object.keys(byUnit[unit]).sort())
                buckets.push({ unit, area, items: byUnit[unit][area], idx: 0 });

        const picked = [];
        let added = true;
        while (picked.length < total && added) {
            added = false;
            for (const b of buckets) {
                if (picked.length >= total) break;
                if (b.idx < b.items.length) { picked.push(b.items[b.idx++]); added = true; }
            }
        }

        const grouped = {};
        for (const a of picked) {
            const unit = String(a.unitId ?? '—');
            const area = (a.area && a.area.trim()) ? a.area.trim() : '(No Area)';
            if (!grouped[unit]) grouped[unit] = {};
            if (!grouped[unit][area]) grouped[unit][area] = [];
            grouped[unit][area].push(a);
        }

        setApplied({ grouped, total: picked.length });
    };

    const handleRoute = (listings) => navigate('/route', { state: { listings } });

    return (
        <div style={{ padding: '1rem 1.5rem', maxWidth: '1100px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
                <button onClick={() => navigate(-1)}>← Back</button>
                <h2 style={{ margin: 0 }}>Visitation View</h2>
            </div>
            <p style={{ color: '#555', marginTop: 0 }}>
                Least-recently-visited <strong>active</strong> addresses, distributed evenly across units and neighborhoods.
            </p>

            {/* Mode selector */}
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem', alignItems: 'center' }}>
                {[{ label: '📅 Daily', count: 5 }, { label: '🗓 Weekly', count: 10 }].map(({ label, count }) => (
                    <button key={label} onClick={() => setTotal(count)}
                        style={{ padding: '0.35rem 0.9rem', borderRadius: '5px', border: '1px solid #1976d2', cursor: 'pointer', fontWeight: 600, fontSize: '0.88rem', background: total === count ? '#1976d2' : '#fff', color: total === count ? '#fff' : '#1976d2' }}>
                        {label}
                    </button>
                ))}
            </div>

            {/* Controls */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem', padding: '0.75rem 1rem', background: '#e3f2fd', borderRadius: '6px', flexWrap: 'wrap' }}>
                <label style={{ fontWeight: 500, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    Unit:
                    <select value={filterUnit} onChange={e => { setFilterUnit(e.target.value); setFilterArea(''); }}
                        style={{ padding: '0.3rem 0.5rem' }}>
                        <option value="">All Units</option>
                        {unitOptions.map(u => <option key={u} value={u}>{u}</option>)}
                    </select>
                </label>
                <label style={{ fontWeight: 500, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    Neighborhood:
                    <select value={filterArea} onChange={e => setFilterArea(e.target.value)}
                        style={{ padding: '0.3rem 0.5rem' }}>
                        <option value="">All Neighborhoods</option>
                        {filteredAreaOptions.map(a => <option key={a} value={a}>{a}</option>)}
                    </select>
                </label>
                <label style={{ fontWeight: 500, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    Count:
                    <input type="number" min="1" max="500" value={total}
                        onChange={e => setTotal(Math.max(1, parseInt(e.target.value) || 1))}
                        style={{ width: '72px', padding: '0.3rem 0.5rem', textAlign: 'center' }} />
                </label>
                <button onClick={compute}
                    style={{ padding: '0.35rem 1.1rem', background: '#1976d2', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 600 }}>
                    Load
                </button>
                {applied && (
                    <>
                        <span style={{ color: '#555', fontSize: '0.9em' }}>{applied.total} addresses loaded</span>
                        <button
                            onClick={() => handleRoute(Object.values(applied.grouped).flatMap(byArea => Object.values(byArea).flat()))}
                            style={{ padding: '0.35rem 1rem', background: '#e65100', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 600 }}>
                            🗺 Route All
                        </button>
                    </>
                )}
            </div>

            {loading && <div style={{ padding: '1rem', color: '#555' }}>⏳ Loading all listings for this masjid…</div>}
            {fetchError && <div style={{ padding: '1rem', color: '#b71c1c' }}>{fetchError}</div>}
            {!loading && allListings.length === 0 && (
                <div style={{ padding: '1rem', background: '#fff3e0', border: '1px solid #ffb74d', borderRadius: '6px', color: '#795548' }}>
                    No address data loaded. Go to the <button style={{ background: 'none', border: 'none', color: '#1976d2', cursor: 'pointer', padding: 0, fontWeight: 600 }} onClick={() => navigate(-1)}>address list</button> first.
                </div>
            )}

            {applied && Object.entries(applied.grouped).sort(([a], [b]) => a.localeCompare(b)).map(([unit, byArea]) => {
                const unitListings = Object.values(byArea).flat();
                return (
                    <div key={unit} style={{ marginBottom: '1.5rem', border: '1px solid #c5cae9', borderRadius: '8px', overflow: 'hidden' }}>
                        <div style={{ background: '#3f51b5', color: '#fff', padding: '8px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <strong>Unit {unit} — {unitListings.length} address{unitListings.length !== 1 ? 'es' : ''}</strong>
                            <button onClick={() => handleRoute(unitListings)}
                                style={{ padding: '3px 10px', background: '#e65100', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '0.82em', fontWeight: 600 }}>
                                🗺 Route Unit
                            </button>
                        </div>
                        {Object.entries(byArea).sort(([a], [b]) => a.localeCompare(b)).map(([area, listings]) => (
                            <div key={area}>
                                <div style={{ background: '#e8eaf6', padding: '5px 14px', fontWeight: 600, fontSize: '0.9em', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                    <span>{area} ({listings.length})</span>
                                    <button onClick={() => handleRoute(listings)}
                                        style={{ padding: '2px 8px', background: '#e65100', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8em', fontWeight: 600 }}>
                                        🗺 Route Area
                                    </button>
                                </div>
                                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem' }}>
                                    <thead>
                                        <tr style={{ background: '#f5f5f5' }}>
                                            <th style={th}>ID</th>
                                            <th style={th}>Name</th>
                                            <th style={th}>Address</th>
                                            <th style={th}>Last Visited</th>
                                            <th style={th}>Last Response</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {listings.map(a => {
                                            const lastVisit = (a.visitHistory || []).slice(-1)[0];
                                            return (
                                                <tr key={a._id} style={{ borderBottom: '1px solid #eee' }}>
                                                    <td style={td}><Link to={`/address/${a._id}`} style={{ color: '#1976d2' }}>{a._id}</Link></td>
                                                    <td style={td}>{[a.firstName, a.lastName].filter(Boolean).join(' ') || '—'}</td>
                                                    <td style={td}>{[a.address1, a.address2].filter(Boolean).join(', ')}</td>
                                                    <td style={{ ...td, color: !a.lastModifiedDate ? '#b71c1c' : '#333' }}>
                                                        {a.lastModifiedDate ? formatDate(a.lastModifiedDate) : 'Never'}
                                                    </td>
                                                    <td style={td}>{lastVisit?.response || '—'}</td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        ))}
                    </div>
                );
            })}
        </div>
    );
}

const th = { textAlign: 'left', padding: '5px 10px', borderBottom: '1px solid #ccc', fontWeight: 600 };
const td = { padding: '5px 10px' };

export default VisitationView;
