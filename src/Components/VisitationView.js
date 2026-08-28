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
    
    // Get masjid slug for back navigation (used in back button onClick)
    const masjidSlug = localStorage.getItem('userMasjidSlug') || localStorage.getItem('preferredMasjid'); // eslint-disable-line no-unused-vars

    const [total, setTotal] = useState(10);
    const [countMode, setCountMode] = useState('10'); // '5', '10', '25', 'custom'
    const [customCount, setCustomCount] = useState(10);
    const visitationStorageKey = `visitationFilters_${masjidID}`;
    const [filterUnit, setFilterUnit] = useState(() => {
        // First priority: unitID from location state (passed from MasjidLanding)
        // Note: unit "0" is a valid unit id and must not be treated as falsy
        const passedUnitID = location.state?.unitID;
        if (passedUnitID !== undefined && passedUnitID !== null && passedUnitID !== '') return String(passedUnitID);
        // Second priority: saved filters from sessionStorage
        const saved = sessionStorage.getItem(visitationStorageKey);
        return saved ? JSON.parse(saved).unit : '';
    });
    const [filterArea, setFilterArea] = useState(() => {
        const saved = sessionStorage.getItem(visitationStorageKey);
        return saved ? JSON.parse(saved).area : '';
    });
    const [applied, setApplied] = useState(null);
    const [allListings, setAllListings] = useState([]);
    const [loading, setLoading] = useState(false);
    const [fetchError, setFetchError] = useState('');
    const [sortMode, setSortMode] = useState('leastRecent'); // 'leastRecent' or 'mostRecent'
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

    // Save filterUnit and filterArea to sessionStorage whenever they change
    useEffect(() => {
        if (masjidID) {
            sessionStorage.setItem(visitationStorageKey, JSON.stringify({ unit: filterUnit, area: filterArea }));
        }
    }, [filterUnit, filterArea, masjidID, visitationStorageKey]);

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
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', flexWrap: 'nowrap' }}>
                <button 
                    onClick={() => {
                        if (masjidSlug) {
                            navigate(`/${masjidSlug}`, { replace: true, state: { fromChildPage: true } });
                        } else {
                            navigate(-1);
                        }
                    }} 
                    style={{ padding: '0.35rem 0.8rem', background: '#f57c00', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 600, fontSize: '0.9rem', whiteSpace: 'nowrap' }}
                >
                    🏠 Home
                </button>
                <StatusBadges />
                <h2 style={{ margin: 0, fontSize: '1rem', fontWeight: 600, whiteSpace: 'nowrap' }}>Visitations</h2>
                <button
                    onClick={() => navigate(`/quick-links/${masjidID}`, { state: { isLoggedIn: true, masjidID } })}
                    style={{ marginLeft: 'auto', background: '#1976d2', color: '#fff', border: 'none', padding: '0.3rem 0.7rem', borderRadius: '4px', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem', whiteSpace: 'nowrap' }}
                >
                    ⚡ Links
                </button>
            </div>

            {/* All selectors in one row at top */}
            <div style={{ display: 'flex', gap: '0.4rem', marginBottom: '0.75rem', alignItems: 'center', flexWrap: 'nowrap', padding: '0.4rem 0.6rem', background: '#f5f5f5', borderRadius: '6px', overflow: 'auto', fontSize: '0.8rem' }}>
                {/* Sort mode selector */}
                <div style={{ display: 'flex', gap: '0.3rem', alignItems: 'center', whiteSpace: 'nowrap' }}>
                    <span style={{ fontWeight: 600, color: '#555' }}>Visited:</span>
                    {[
                        { label: 'Earliest', value: 'leastRecent' },
                        { label: 'Latest', value: 'mostRecent' }
                    ].map(({ label, value }) => (
                        <button key={value} onClick={() => setSortMode(value)}
                            style={{ padding: '0.2rem 0.5rem', borderRadius: '3px', border: '1px solid #f57c00', cursor: 'pointer', fontWeight: 600, fontSize: '0.75rem', background: sortMode === value ? '#f57c00' : '#fff', color: sortMode === value ? '#fff' : '#f57c00' }}>
                            {label}
                        </button>
                    ))}
                </div>

                {/* Count selector dropdown */}
                <div style={{ display: 'flex', gap: '0.3rem', alignItems: 'center', whiteSpace: 'nowrap' }}>
                    <span style={{ fontWeight: 600, color: '#555' }}>Show:</span>
                    <select value={countMode} onChange={e => setCountMode(e.target.value)}
                        style={{ padding: '0.2rem 0.3rem', borderRadius: '3px', border: '1px solid #1976d2', cursor: 'pointer', fontWeight: 600, fontSize: '0.75rem', width: '58px' }}>
                        <option value="5">5</option>
                        <option value="10">10</option>
                        <option value="25">25</option>
                        <option value="custom">Oth</option>
                    </select>
                    {countMode === 'custom' && (
                        <input 
                            type="number" 
                            min="1" 
                            max="500" 
                            value={customCount}
                            onChange={e => setCustomCount(Math.max(1, parseInt(e.target.value) || 1))}
                            style={{ width: '40px', padding: '0.2rem 0.3rem', textAlign: 'center', fontSize: '0.75rem', border: '1px solid #1976d2', borderRadius: '3px' }} 
                        />
                    )}
                </div>
            </div>

            {/* Description */}
            <p style={{ color: '#555', marginTop: 0, marginBottom: '1rem' }}>
                {sortMode === 'leastRecent' 
                    ? 'Earliest-visited' 
                    : 'Latest-visited'} <strong>active</strong> addresses. Applied per unit.
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', padding: '0.5rem 0.75rem', background: '#e3f2fd', borderRadius: '6px', flexWrap: 'nowrap', overflow: 'auto' }}>
                <label style={{ fontWeight: 500, display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.9rem', whiteSpace: 'nowrap' }}>
                    Unit:
                    <select value={filterUnit} onChange={e => { setFilterUnit(e.target.value); setFilterArea(''); }}
                        style={{ padding: '0.25rem 0.4rem', fontSize: '0.85rem' }}>
                        <option value="">All</option>
                        {unitOptions.map(u => <option key={u} value={u}>{u}</option>)}
                    </select>
                </label>
                <label style={{ fontWeight: 500, display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.9rem', whiteSpace: 'nowrap' }}>
                    Area:
                    <select value={filterArea} onChange={e => setFilterArea(e.target.value)}
                        style={{ padding: '0.25rem 0.4rem', fontSize: '0.85rem' }}>
                        <option value="">All</option>
                        {filteredAreaOptions.map(a => <option key={a} value={a}>{a}</option>)}
                    </select>
                </label>
                {applied && (
                    <>
                        <span style={{ color: '#555', fontSize: '0.85em', whiteSpace: 'nowrap', marginLeft: 'auto' }}>{applied.total} loaded</span>
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
                        <div style={{ overflowX: 'auto', overflowY: 'hidden', WebkitOverflowScrolling: 'touch' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem', minWidth: '600px' }}>
                                <thead>
                                    <tr style={{ background: '#f5f5f5' }}>
                                        <th style={th}>ID</th>
                                        <th style={{ ...th, maxWidth: '100px' }}>Name</th>
                                        <th style={{ ...th, maxWidth: '120px' }}>Address</th>
                                        <th style={th}>Visited</th>
                                        <th style={{ ...th, maxWidth: '90px' }}>Area</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {listings.map(a => {
                                        const lastVisit = (a.visitHistory || []).slice(-1)[0];
                                        const area = (a.area && a.area.trim()) ? a.area.trim() : '(No Area)';
                                        const visitedText = a.lastModifiedDate ? formatDate(a.lastModifiedDate) : 'Never';
                                        const responseText = lastVisit?.response || '—';
                                        return (
                                            <tr key={a._id} style={{ borderBottom: '1px solid #eee' }}>
                                                <td style={{ ...td, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                    <input 
                                                        type="checkbox"
                                                        checked={selectedIds.includes(a._id)}
                                                        onChange={() => handleToggleId(a._id)}
                                                        style={{ cursor: 'pointer', accentColor: '#e65100', flexShrink: 0 }}
                                                    />
                                                    <Link to={`/address/${a._id}`} state={{ from: `${location.pathname}${location.search}` }} replace style={{ color: '#1976d2' }}>{a._id}</Link>
                                                </td>
                                                <td style={{ ...td, maxWidth: '100px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={[a.firstName, a.lastName].filter(Boolean).join(' ') || '—'}>{[a.firstName, a.lastName].filter(Boolean).join(' ') || '—'}</td>
                                                <td style={{ ...td, maxWidth: '120px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={[a.address1, a.address2].filter(Boolean).join(', ')}>{[a.address1, a.address2].filter(Boolean).join(', ')}</td>
                                                <td style={{ ...td, color: !a.lastModifiedDate ? '#b71c1c' : '#333' }}>
                                                    {visitedText} <span style={{ fontSize: '0.8em', color: '#999' }}>({responseText})</span>
                                                </td>
                                                <td style={{ ...td, maxWidth: '90px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={area}><em style={{ color: '#555' }}>{area}</em></td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

const th = { textAlign: 'left', padding: '5px 10px', borderBottom: '1px solid #ccc', fontWeight: 600 };
const td = { padding: '5px 10px' };

export default VisitationView;
