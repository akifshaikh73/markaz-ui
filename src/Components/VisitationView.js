import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { formatDate } from '../utils';

function VisitationView() {
    const navigate = useNavigate();
    const location = useLocation();
    const API_URL = process.env.REACT_APP_API_URL || '';
    
    // Get masjidID from location state or localStorage
    const getMasjidID = () => {
        if (location.state?.masjidID) return location.state.masjidID;
        try {
            const ctx = JSON.parse(localStorage.getItem('landingContext') || '{}');
            return ctx.masjidID || null;
        } catch {
            return null;
        }
    };
    
    const masjidID = getMasjidID();

    const [total, setTotal] = useState(5);
    const [filterUnit, setFilterUnit] = useState('');
    const [filterArea, setFilterArea] = useState('');
    const [applied, setApplied] = useState(null);
    const [allListings, setAllListings] = useState([]);
    const [loading, setLoading] = useState(false);
    const [fetchError, setFetchError] = useState('');
    const [sortMode, setSortMode] = useState('leastRecent'); // 'leastRecent' or 'mostRecent'
    const [timePeriod, setTimePeriod] = useState('last7days'); // 'last7days' or 'last1month'
    const [selectedIds, setSelectedIds] = useState([]);

    // On mount — fetch all listings for the masjid (no unit filter)
    useEffect(() => {
        if (!masjidID) {
            setFetchError('No masjid selected. Please go back to the address list.');
            return;
        }
        setLoading(true);
        setFetchError('');
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

    // Helper function to check if a date falls within the time period
    const isWithinTimePeriod = (dateStr) => {
        const d = new Date((dateStr?.$date) ?? dateStr ?? 0);
        if (isNaN(d.getTime())) return false;
        const now = Date.now();
        const diffMs = now - d.getTime();
        const diffDays = diffMs / (1000 * 60 * 60 * 24);
        
        if (timePeriod === 'last7days') return diffDays <= 7;
        if (timePeriod === 'last1month') return diffDays <= 30;
        return true;
    };

    const compute = () => {
        const active = allListings.filter(a => {
            if (a.inactive) return false;
            if (filterUnit && String(a.unitId ?? '—') !== filterUnit) return false;
            if (filterArea) {
                const area = (a.area && a.area.trim()) ? a.area.trim() : '(No Area)';
                if (area !== filterArea) return false;
            }
            // Only apply time period filter for 'mostRecent' mode
            if (sortMode === 'mostRecent' && !isWithinTimePeriod(a.lastModifiedDate)) return false;
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
                byUnit[unit][area].sort((x, y) => 
                    sortMode === 'leastRecent' 
                        ? getDate(x) - getDate(y)  // oldest first
                        : getDate(y) - getDate(x)  // newest first
                );

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

    const handleToggleId = (id) => {
        setSelectedIds(prev => 
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    const handleToggleArea = (listings) => {
        const areaIds = listings.map(a => a._id);
        const allSelected = areaIds.every(id => selectedIds.includes(id));
        if (allSelected) {
            setSelectedIds(prev => prev.filter(id => !areaIds.includes(id)));
        } else {
            setSelectedIds(prev => Array.from(new Set([...prev, ...areaIds])));
        }
    };

    return (
        <div style={{ padding: '1rem 1.5rem', maxWidth: '1100px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
                <button onClick={() => navigate(-1)}>← Back</button>
                <h2 style={{ margin: 0 }}>Visitation View</h2>
            </div>

            {/* All selectors in one row at top */}
            <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem', alignItems: 'center', flexWrap: 'wrap', padding: '0.75rem 1rem', background: '#f5f5f5', borderRadius: '6px' }}>
                {/* Sort mode selector */}
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <span style={{ fontWeight: 600, fontSize: '0.88rem', color: '#555' }}>Visited:</span>
                    {[
                        { label: 'Least Recently', value: 'leastRecent' },
                        { label: 'Most Recently', value: 'mostRecent' }
                    ].map(({ label, value }) => (
                        <button key={value} onClick={() => { setSortMode(value); if (value === 'leastRecent') setTimePeriod('last7days'); }}
                            style={{ padding: '0.35rem 0.9rem', borderRadius: '5px', border: '1px solid #f57c00', cursor: 'pointer', fontWeight: 600, fontSize: '0.88rem', background: sortMode === value ? '#f57c00' : '#fff', color: sortMode === value ? '#fff' : '#f57c00' }}>
                            {label}
                        </button>
                    ))}
                </div>

                {/* Time period selector */}
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', opacity: sortMode === 'leastRecent' ? 0.5 : 1 }}>
                    <span style={{ fontWeight: 600, fontSize: '0.88rem', color: '#555' }}>Time:</span>
                    {[
                        { label: '7 Days', value: 'last7days' },
                        { label: '1 Month', value: 'last1month' }
                    ].map(({ label, value }) => (
                        <button key={value} disabled={sortMode === 'leastRecent'} onClick={() => setTimePeriod(value)}
                            style={{ padding: '0.35rem 0.9rem', borderRadius: '5px', border: '1px solid #7b1fa2', cursor: sortMode === 'leastRecent' ? 'not-allowed' : 'pointer', fontWeight: 600, fontSize: '0.88rem', background: timePeriod === value ? '#7b1fa2' : '#fff', color: timePeriod === value ? '#fff' : '#7b1fa2' }}>
                            {label}
                        </button>
                    ))}
                </div>

                {/* Count selector */}
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <span style={{ fontWeight: 600, fontSize: '0.88rem', color: '#555' }}>Count:</span>
                    {[{ label: '📅 Daily', count: 5 }, { label: '🗓 Weekly', count: 10 }].map(({ label, count }) => (
                        <button key={label} onClick={() => setTotal(count)}
                            style={{ padding: '0.35rem 0.9rem', borderRadius: '5px', border: '1px solid #1976d2', cursor: 'pointer', fontWeight: 600, fontSize: '0.88rem', background: total === count ? '#1976d2' : '#fff', color: total === count ? '#fff' : '#1976d2' }}>
                            {label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Description */}
            <p style={{ color: '#555', marginTop: 0, marginBottom: '1rem' }}>
                {sortMode === 'leastRecent' 
                    ? 'Least-recently-visited' 
                    : 'Most-recently-visited'} <strong>active</strong> addresses{sortMode === 'mostRecent' ? ` ${timePeriod === 'last7days' ? 'from the last 7 days' : 'from the last 1 month'}` : ' (all time)'}, distributed evenly across units and neighborhoods.
            </p>
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

            {/* Selection summary */}
            {selectedIds.length > 0 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem', padding: '0.75rem 1rem', background: '#fff3e0', border: '1px solid #ffb74d', borderRadius: '6px', flexWrap: 'wrap' }}>
                    <span style={{ fontWeight: 600, color: '#f57c00' }}>{selectedIds.length} address{selectedIds.length !== 1 ? 'es' : ''} selected</span>
                    <button 
                        onClick={() => handleRoute(applied ? Object.values(applied.grouped).flatMap(byUnit => Object.values(byUnit).flat()).filter(a => selectedIds.includes(a._id)) : [])}
                        style={{ padding: '0.35rem 1rem', background: '#e65100', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 600, fontSize: '0.9em' }}>
                        🗺 Route Selected
                    </button>
                    <button 
                        onClick={() => setSelectedIds([])}
                        style={{ padding: '0.35rem 1rem', background: 'none', border: '1px solid #ffb74d', borderRadius: '4px', cursor: 'pointer', fontWeight: 600, fontSize: '0.9em', color: '#f57c00' }}>
                        Clear Selection
                    </button>
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
                        {Object.entries(byArea).sort(([a], [b]) => a.localeCompare(b)).map(([area, listings]) => {
                            const areaIds = listings.map(l => l._id);
                            const allSelected = areaIds.every(id => selectedIds.includes(id));
                            const someSelected = areaIds.some(id => selectedIds.includes(id));
                            return (
                                <div key={area}>
                                    <div style={{ background: '#e8eaf6', padding: '5px 14px', fontWeight: 600, fontSize: '0.9em', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                            <input 
                                                type="checkbox" 
                                                checked={allSelected}
                                                ref={el => { if (el) el.indeterminate = someSelected && !allSelected; }}
                                                onChange={() => handleToggleArea(listings)}
                                                style={{ cursor: 'pointer', accentColor: '#7b1fa2' }}
                                                title="Select all in this neighborhood"
                                            />
                                            {area} ({listings.length})
                                        </span>
                                        <button onClick={() => handleRoute(listings)}
                                            style={{ padding: '2px 8px', background: '#e65100', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8em', fontWeight: 600 }}>
                                            🗺 Route Area
                                        </button>
                                    </div>
                                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem' }}>
                                    <thead>
                                        <tr style={{ background: '#f5f5f5' }}>
                                            <th style={{ ...th, width: '30px' }}></th>
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
                                                    <td style={{ ...td, width: '30px', textAlign: 'center' }}>
                                                        <input 
                                                            type="checkbox"
                                                            checked={selectedIds.includes(a._id)}
                                                            onChange={() => handleToggleId(a._id)}
                                                            style={{ cursor: 'pointer', accentColor: '#e65100' }}
                                                        />
                                                    </td>
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
                        );
                        })}
                    </div>
                );
            })}
        </div>
    );
}

const th = { textAlign: 'left', padding: '5px 10px', borderBottom: '1px solid #ccc', fontWeight: 600 };
const td = { padding: '5px 10px' };

export default VisitationView;
