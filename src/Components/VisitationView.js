import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { formatDate } from '../utils';
import StatusBadges from './StatusBadges';

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

    const [total, setTotal] = useState(10);
    const [countMode, setCountMode] = useState('10'); // '5', '10', '25', 'custom'
    const [customCount, setCustomCount] = useState(10);
    const [filterUnit, setFilterUnit] = useState('');
    const [filterArea, setFilterArea] = useState('');
    const [applied, setApplied] = useState(null);
    const [allListings, setAllListings] = useState([]);
    const [loading, setLoading] = useState(false);
    const [fetchError, setFetchError] = useState('');
    const [sortMode, setSortMode] = useState('leastRecent'); // 'leastRecent' or 'mostRecent'
    const [selectedIds, setSelectedIds] = useState([]);
    const [unitAutoSelected, setUnitAutoSelected] = useState(false);

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
            .then(data => {
                const listings = Array.isArray(data) ? data : [];
                setAllListings(listings);
                // Trigger compute after loading listings
                setApplied(null); // Reset applied to show loading state
            })
            .catch(() => setFetchError('Failed to load listings'))
            .finally(() => setLoading(false));
    }, [masjidID, API_URL]);

    // Sync total with countMode
    useEffect(() => {
        if (countMode === 'custom') {
            setTotal(customCount);
        } else {
            setTotal(parseInt(countMode));
        }
    }, [countMode, customCount]);

    // Auto-select a random unit on first load (excluding '0' and '—')
    useEffect(() => {
        if (!unitAutoSelected && filterUnit === '' && allListings.length > 0) {
            const active = allListings.filter(a => !a.inactive);
            const validUnits = [...new Set(active.map(a => String(a.unitId ?? '—')))].filter(u => u !== '0' && u !== '—').sort();
            if (validUnits.length > 0) {
                const randomUnit = validUnits[Math.floor(Math.random() * validUnits.length)];
                setFilterUnit(randomUnit);
                setUnitAutoSelected(true);
            }
        }
    }, [unitAutoSelected, filterUnit, allListings]);

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

    const compute = useCallback(() => {
        const active = allListings.filter(a => {
            if (a.inactive) return false;
            if (filterUnit && String(a.unitId ?? '—') !== filterUnit) return false;
            if (filterArea) {
                const area = (a.area && a.area.trim()) ? a.area.trim() : '(No Area)';
                if (area !== filterArea) return false;
            }
            return true;
        });

        const getDate = (a) => {
            const d = new Date((a.lastModifiedDate?.$date) ?? a.lastModifiedDate ?? 0);
            return isNaN(d.getTime()) ? 0 : d.getTime();
        };

        // Group by unit first
        const byUnit = {};
        for (const a of active) {
            const unit = String(a.unitId ?? '—');
            if (!byUnit[unit]) byUnit[unit] = [];
            byUnit[unit].push(a);
        }

        // Sort each unit's addresses by date
        for (const unit of Object.keys(byUnit)) {
            byUnit[unit].sort((x, y) => 
                sortMode === 'leastRecent' 
                    ? getDate(x) - getDate(y)  // oldest first
                    : getDate(y) - getDate(x)  // newest first
            );
        }

        // Pick 'total' addresses from each unit
        const result = {};
        let grandTotal = 0;
        for (const unit of Object.keys(byUnit).sort()) {
            result[unit] = byUnit[unit].slice(0, total);
            grandTotal += result[unit].length;
        }

        setApplied({ grouped: result, total: grandTotal });
    }, [allListings, filterUnit, filterArea, sortMode, total]);

    // Auto-compute when filters, sort mode, or total changes
    useEffect(() => {
        if (allListings.length > 0) {
            compute();
        }
    }, [compute, allListings, total]);

    const handleRoute = (listings) => navigate('/route', { state: { listings } });

    const handleToggleId = (id) => {
        setSelectedIds(prev => 
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    return (
        <div style={{ padding: '1rem 1.5rem', maxWidth: '1100px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
                <button onClick={() => navigate(-1)}>← Back</button>
                <StatusBadges />
                <h2 style={{ margin: 0 }}>Visitation View</h2>
                <button
                    onClick={() => navigate(`/quick-links/${masjidID}`, { state: { isLoggedIn: true, masjidID } })}
                    style={{ marginLeft: 'auto', background: '#1976d2', color: '#fff', border: 'none', padding: '0.4rem 0.9rem', borderRadius: '4px', cursor: 'pointer', fontWeight: 600, fontSize: '0.9rem' }}
                >
                    ⚡ Quick Links
                </button>
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
                        <button key={value} onClick={() => setSortMode(value)}
                            style={{ padding: '0.35rem 0.9rem', borderRadius: '5px', border: '1px solid #f57c00', cursor: 'pointer', fontWeight: 600, fontSize: '0.88rem', background: sortMode === value ? '#f57c00' : '#fff', color: sortMode === value ? '#fff' : '#f57c00' }}>
                            {label}
                        </button>
                    ))}
                </div>

                {/* Count selector dropdown */}
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <span style={{ fontWeight: 600, fontSize: '0.88rem', color: '#555' }}>Count:</span>
                    <select value={countMode} onChange={e => setCountMode(e.target.value)}
                        style={{ padding: '0.35rem 0.7rem', borderRadius: '5px', border: '1px solid #1976d2', cursor: 'pointer', fontWeight: 600, fontSize: '0.88rem' }}>
                        <option value="5">5</option>
                        <option value="10">10</option>
                        <option value="25">25</option>
                        <option value="custom">Other</option>
                    </select>
                    {countMode === 'custom' && (
                        <input 
                            type="number" 
                            min="1" 
                            max="500" 
                            value={customCount}
                            onChange={e => setCustomCount(Math.max(1, parseInt(e.target.value) || 1))}
                            style={{ width: '60px', padding: '0.35rem 0.5rem', textAlign: 'center', fontSize: '0.88rem', border: '1px solid #1976d2', borderRadius: '5px' }} 
                        />
                    )}
                </div>
            </div>

            {/* Description */}
            <p style={{ color: '#555', marginTop: 0, marginBottom: '1rem' }}>
                {sortMode === 'leastRecent' 
                    ? 'Least-recently-visited' 
                    : 'Most-recently-visited'} <strong>active</strong> addresses. Count is applied per unit.
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
                {applied && (
                    <>
                        <span style={{ color: '#555', fontSize: '0.9em' }}>{applied.total} addresses loaded</span>
                        <button
                            onClick={() => handleRoute(Object.values(applied.grouped).flatMap(listings => listings))}
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
                        onClick={() => handleRoute(applied ? Object.values(applied.grouped).flatMap(listings => listings).filter(a => selectedIds.includes(a._id)) : [])}
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

            {applied && Object.entries(applied.grouped).sort(([a], [b]) => a.localeCompare(b)).map(([unit, listings]) => {
                return (
                    <div key={unit} style={{ marginBottom: '1.5rem', border: '1px solid #c5cae9', borderRadius: '8px', overflow: 'hidden' }}>
                        <div style={{ background: '#3f51b5', color: '#fff', padding: '8px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <strong>Unit {unit} — {listings.length} address{listings.length !== 1 ? 'es' : ''}</strong>
                            <button onClick={() => handleRoute(listings)}
                                style={{ padding: '3px 10px', background: '#e65100', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '0.82em', fontWeight: 600 }}>
                                🗺 Route Unit
                            </button>
                        </div>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem' }}>
                            <thead>
                                <tr style={{ background: '#f5f5f5' }}>
                                    <th style={{ ...th, width: '30px' }}></th>
                                    <th style={th}>ID</th>
                                    <th style={th}>Name</th>
                                    <th style={th}>Address</th>
                                    <th style={th}>Area</th>
                                    <th style={th}>Last Visited</th>
                                    <th style={th}>Last Response</th>
                                </tr>
                            </thead>
                            <tbody>
                                {listings.map(a => {
                                    const lastVisit = (a.visitHistory || []).slice(-1)[0];
                                    const area = (a.area && a.area.trim()) ? a.area.trim() : '(No Area)';
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
                                            <td style={td}><em style={{ color: '#555' }}>{area}</em></td>
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
}

const th = { textAlign: 'left', padding: '5px 10px', borderBottom: '1px solid #ccc', fontWeight: 600 };
const td = { padding: '5px 10px' };

export default VisitationView;
