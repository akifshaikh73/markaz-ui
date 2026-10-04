import React, { useState, useEffect } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import SearchForm from './Search';
import AddressList from './AddressList';
import AddAddress from './AddAddress';
import { exportToExcel } from '../exportExcel';
import { getAdmin, getUserRole } from '../config';
import StatusBadges from './StatusBadges';
import { useMasjidConfig } from '../hooks/useMasjids';
import { wildcardToRegex } from '../utils';

function Landing({ showInactive: isInactiveView = false, showStudents: isStudentView = false }) {
    const location = useLocation();
    const navigate = useNavigate();
    const { masjidID, unitID } = useParams();
    const view = isInactiveView ? 'inactive' : isStudentView ? 'students' : 'all';
    const landingBase = view === 'all' ? `/landing/${masjidID}` : `/landing/${view}/${masjidID}`;
    // Extra search criteria every request on this route must carry, so the student
    // scope survives search, reset, unit switch and "Include Inactive" alike.
    const viewFilter = isStudentView ? { filterByStudents: true } : {};
    const [selectedUnit, setSelectedUnit] = useState(unitID === 'all' ? '' : (unitID !== '' && !isNaN(parseInt(unitID)) ? parseInt(unitID) : ''));
    const cachedContext = JSON.parse(localStorage.getItem('landingContext')) || {};
    // view is part of the cache key: without it, moving between the full, inactive and
    // student routes for the same masjid+unit would show the previous route's cached list.
    const cacheValid = cachedContext.masjidID === masjidID && cachedContext.unitID === unitID && (cachedContext.view || 'all') === view;

    const [addressList, setAddressList] = useState(cacheValid ? (JSON.parse(localStorage.getItem('addressList')) || []) : []);
    const [searchParams, setSearchParams] = useState(
        cacheValid ? (JSON.parse(localStorage.getItem('searchParams')) || {}) : {}
    );
    const landingFiltersKey = `landingFilters_${masjidID}_${unitID}`;
    const [areaFilter, setAreaFilter] = useState(() => {
        if (cacheValid) {
            return localStorage.getItem('areaFilter') || sessionStorage.getItem(landingFiltersKey) || '';
        }
        return sessionStorage.getItem(landingFiltersKey) || '';
    });
    const unitAreasKey = `unitAreas_${masjidID}_${unitID}`;
    const [unitAreas, setUnitAreas] = useState(() => {
        const cached = sessionStorage.getItem(unitAreasKey);
        return cached ? JSON.parse(cached) : [];
    });
    const [includeInactive, setIncludeInactive] = useState(false);
    const [showAddAddress, setShowAddAddress] = useState(false);
    // Listings added from this page during this visit; shown with a NEW badge. Not persisted.
    const [recentlyAddedIds, setRecentlyAddedIds] = useState([]);
    const [selectedIds, setSelectedIds] = useState([]);
    const [newArea, setNewArea] = useState('');
    const [newUnit, setNewUnit] = useState('');
    const [areaUpdateStatus, setAreaUpdateStatus] = useState(null);
    const [unitUpdateStatus, setUnitUpdateStatus] = useState(null);
    const [searchWarning, setSearchWarning] = useState(null); // 'no-results' | 'cross-masjid' | null

    if (!cacheValid) {
        localStorage.removeItem('addressList');
        localStorage.removeItem('searchParams');
        localStorage.removeItem('areaFilter');
        localStorage.setItem('landingContext', JSON.stringify({ masjidID, unitID, view }));
    }

    const { getMasjidById, masjidUnitsMap } = useMasjidConfig();

    const isMarkazAdmin = getUserRole() === 'MarkazAdmin';

    const [unitOptions, setUnitOptions] = useState(masjidUnitsMap[masjidID] || []);
    const masjidConfig = getMasjidById(masjidID);

    const filteredAddressList = areaFilter === '__NO_AREA__'
        ? addressList.filter(a => !a.area || !a.area.trim())
        : areaFilter.trim()
            ? addressList.filter(a => {
                const term = areaFilter.trim().toLowerCase();
                return a.area && a.area.toLowerCase().includes(term);
              })
            : addressList;

    const handleAreaChange = (e) => {
        const value = e.target.value;
        setAreaFilter(value);
        localStorage.setItem('areaFilter', value);
        sessionStorage.setItem(landingFiltersKey, value);
    };

    const handleUnitChange = (e) => {
        const val = e.target.value;
        localStorage.removeItem('addressList');
        localStorage.removeItem('searchParams');
        localStorage.removeItem('areaFilter');
        localStorage.removeItem('landingContext');
        setUnitAreas([]);
        setIncludeInactive(false);
        if (val === '') {
            setSelectedUnit('');
            setSearchParams({});
            setAreaFilter('');
            fetchBaseList('', false).then(data => {
                const filtered = isMarkazAdmin ? data : data.filter(item => String(item.masjidId) === String(masjidID));
                setAddressList(filtered);
                localStorage.setItem('addressList', JSON.stringify(filtered));
            });
        } else {
            const newUnit = parseInt(val);
            setSelectedUnit(newUnit);
            setAddressList([]);
            setAreaFilter('');
            setSearchParams({});
            navigate(`${landingBase}/${!isNaN(newUnit) ? newUnit : 'all'}`, { state: { isLoggedIn: true } });
        }
    };

    const API_URL = process.env.REACT_APP_API_URL || '';

    // The API's showInactive is an exclusive filter, not additive — showInactive:true returns
    // ONLY inactive records, omitted/false returns ONLY active ones. There's no server-side
    // "both together" option, so "Include Inactive" is implemented by firing both queries
    // and merging client-side.
    const searchRequest = (body) => fetch(`${API_URL}/api/addressList/filter/search/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
    }).then(r => r.json());

    // Centralizes the "full list for this masjid/unit" fetch so every re-fetch path
    // (initial load, unit switch, reset) stays scoped consistently — the original bug here
    // was that only the first load checked isInactiveView, so switching units silently
    // dropped back to the unfiltered list.
    const fetchBaseList = (unit, wantInactive = includeInactive) => {
        const base = { masjidId: masjidID, ...viewFilter };
        if (unit !== '') base.unitId = unit;
        if (isInactiveView) {
            return searchRequest({ ...base, showInactive: true });
        }
        if (wantInactive) {
            return Promise.all([searchRequest(base), searchRequest({ ...base, showInactive: true })])
                .then(([active, inactive]) => [...active, ...inactive]);
        }
        if (isStudentView) {
            return searchRequest(base);
        }
        const unitParam = unit !== '' ? `&unit_id=${unit}` : '';
        return fetch(`${API_URL}/api/addressList/list?masjid_id=${masjidID}${unitParam}`).then(r => r.json());
    };

    const doSearch = (params, wantInactive = includeInactive) => {
        setSearchWarning(null);
        const body = { ...params, ...viewFilter };
        if (body.unitId === undefined || body.unitId === null || body.unitId === '') delete body.unitId;
        // The box keeps what the user typed ("1301*Finley"); the API gets the regex ("1301.*Finley").
        if (body.address) body.address = wildcardToRegex(body.address);

        const bodies = isInactiveView
            ? [{ ...body, showInactive: true }]
            : wantInactive
                ? [{ ...body }, { ...body, showInactive: true }]
                : [{ ...body }];

        Promise.all(bodies.map(searchRequest))
            .then(results => {
                const data = results.flat();
                const filtered = isMarkazAdmin ? data : data.filter(item => String(item.masjidId) === String(masjidID));
                if (data.length === 0) {
                    setSearchWarning('no-results');
                } else if (!isMarkazAdmin && filtered.length === 0) {
                    setSearchWarning('cross-masjid');
                } else {
                    setSearchWarning(null);
                }
                setAddressList(filtered);
                localStorage.setItem('addressList', JSON.stringify(filtered));
                localStorage.setItem('landingContext', JSON.stringify({ masjidID, unitID, view }));
            });
    };

    // POST /api/addressList returns only { _id }, so fetch the full record and put it at the
    // top of the current list (and its localStorage cache) instead of re-running the search.
    // Inactive/student views never contain a brand-new listing, so they are left alone.
    const handleAddressCreated = (id) => {
        if (!id || isInactiveView || isStudentView) return;
        fetch(`${API_URL}/api/addressList/search/${id}`)
            .then(r => (r.ok ? r.json() : null))
            .then(created => {
                if (!created || !created._id) return;
                // The form lets the user pick another unit; don't show it in this unit's list.
                if (selectedUnit !== '' && String(created.unitId) !== String(selectedUnit)) return;
                setRecentlyAddedIds(prev => (prev.includes(created._id) ? prev : [...prev, created._id]));
                setAddressList(prev => {
                    const next = [created, ...prev.filter(a => a._id !== created._id)];
                    localStorage.setItem('addressList', JSON.stringify(next));
                    return next;
                });
                // New listings have no area, so a Neighborhood filter would hide the row.
                if (areaFilter) {
                    setAreaFilter('');
                    localStorage.setItem('areaFilter', '');
                    sessionStorage.setItem(landingFiltersKey, '');
                }
            })
            .catch(() => {});
    };

    const handleIncludeInactiveChange = (e) => {
        const checked = e.target.checked;
        setIncludeInactive(checked);
        if (Object.keys(searchParams).length > 0) {
            doSearch(searchParams, checked);
            return;
        }
        fetchBaseList(selectedUnit, checked).then(data => {
            const filtered = isMarkazAdmin ? data : data.filter(item => String(item.masjidId) === String(masjidID));
            setAddressList(filtered);
            localStorage.setItem('addressList', JSON.stringify(filtered));
        });
    };

    const handleSearch = (params) => {
        setSearchParams(params);
        localStorage.setItem('searchParams', JSON.stringify(params));
        doSearch(params);
    };

    const handleUpdateArea = (ids, area) => {
        fetch(`${API_URL}/api/addressList/bulk/area`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ids, area }),
        })
        .then(res => res.json())
        .then((data) => {
            setAddressList(prev => prev.map(a => ids.includes(a._id) ? { ...a, area } : a));
            setUnitAreas(prev => {
                if (prev.includes(area)) return prev;
                const updated = [...prev, area].sort();
                sessionStorage.setItem(unitAreasKey, JSON.stringify(updated));
                return updated;
            });
            setSelectedIds([]);
            setNewArea('');
            setAreaUpdateStatus(data);
            setTimeout(() => setAreaUpdateStatus(null), 4000);
        })
        .catch(err => console.error('Error updating area:', err));
    };



    const handleBulkUpdateUnit = (ids, unit) => {
        const unitVal = parseInt(unit);
        if (isNaN(unitVal)) return;
        Promise.all(ids.map(id =>
            fetch(`${API_URL}/api/addressList/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ unitId: unitVal }),
            }).then(r => r.json())
        ))
        .then(() => {
            setAddressList(prev => prev.map(a => ids.includes(a._id) ? { ...a, unitId: unitVal } : a));
            setSelectedIds([]);
            setNewUnit('');
            setUnitUpdateStatus({ count: ids.length });
            setTimeout(() => setUnitUpdateStatus(null), 4000);
        })
        .catch(err => console.error('Error updating unit:', err));
    };

    const handleReset = () => {
        const baseParams = { masjidId: masjidID };
        setSearchParams(baseParams);
        setAreaFilter('');
        setIncludeInactive(false);
        setSearchWarning(null);
        localStorage.setItem('searchParams', JSON.stringify(baseParams));
        localStorage.removeItem('areaFilter');
        fetchBaseList(selectedUnit, false).then(data => {
            const filtered = isMarkazAdmin ? data : data.filter(item => String(item.masjidId) === String(masjidID));
            setAddressList(filtered);
            localStorage.setItem('addressList', JSON.stringify(filtered));
        });
    };

    useEffect(() => {
        if (!location.state || !location.state.isLoggedIn) {
            navigate('/user-login');
            return;
        }

        if (addressList.length === 0) {
            fetchBaseList(selectedUnit).then(data => {
                const filtered = isMarkazAdmin ? data : data.filter(item => String(item.masjidId) === String(masjidID));
                setAddressList(filtered);
                localStorage.setItem('addressList', JSON.stringify(filtered));
                // Always extract and update areas from the fetched data
                const areas = [...new Set(filtered.map(a => a.area).filter(a => a && a.trim()))].sort();
                setUnitAreas(areas);
                sessionStorage.setItem(unitAreasKey, JSON.stringify(areas));
            });
        }
    }, [masjidID, selectedUnit]); // eslint-disable-line react-hooks/exhaustive-deps

    useEffect(() => {
        if (unitOptions.length > 0) return;
        fetch(`${API_URL}/api/masjids/${encodeURIComponent(masjidID)}`)
            .then(r => r.ok ? r.json() : null)
            .then(data => {
                if (data && Array.isArray(data.units) && data.units.length > 0) {
                    setUnitOptions(data.units);
                }
            })
            .catch(() => {});
    }, [masjidID]); // eslint-disable-line react-hooks/exhaustive-deps

    // Sync areaFilter to sessionStorage whenever it changes
    useEffect(() => {
        sessionStorage.setItem(landingFiltersKey, areaFilter);
    }, [areaFilter, landingFiltersKey]);

    return (
        <>
            <div style={{ position: 'fixed', top: '10px', left: '10px', display: 'flex', gap: '0.5rem', alignItems: 'center', zIndex: 1000 }}>
                <StatusBadges />
                {(() => {
                    const masjidSlug = localStorage.getItem('userMasjidSlug') || localStorage.getItem('preferredMasjid');
                    return masjidSlug ? (
                        <button
                            onClick={() => navigate(`/${masjidSlug}`, { replace: true, state: { fromChildPage: true } })}
                            style={{ background: '#f57c00', color: '#fff', border: 'none', padding: '0.3rem 0.6rem', borderRadius: '4px', cursor: 'pointer', fontWeight: 600, fontSize: '0.8rem', boxShadow: '0 1px 3px rgba(0,0,0,0.15)', letterSpacing: '0em' }}
                        >
                            🏠 Home
                        </button>
                    ) : null;
                })()}
                {isMarkazAdmin && (
                    <button onClick={() => navigate('/admin-home')} style={{ fontSize: '0.75rem', color: '#1976d2', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600, padding: 0 }}>⌂ Home</button>
                )}
            </div>
            <div style={{ position: 'fixed', top: '10px', right: '10px', display: 'flex', gap: '0.6rem', alignItems: 'center', zIndex: 1000, flexWrap: 'wrap', justifyContent: 'flex-end', maxWidth: '500px' }}>
                {getAdmin() && <button onClick={() => navigate(`/map/${masjidID}/${selectedUnit}`, { state: { isLoggedIn: true } })} style={{ background: '#1976d2', color: '#fff', border: 'none', padding: '0.4rem 0.9rem', borderRadius: '4px', cursor: 'pointer', fontWeight: 600, fontSize: '0.9rem' }}>🗺 Map View</button>}
                {selectedIds.length > 0 && (
                    <button
                        onClick={() => navigate('/route', { state: { listings: addressList.filter(a => selectedIds.includes(a._id)), masjidID, unitID } })}
                        style={{ background: '#e65100', color: '#fff', border: 'none', padding: '0.4rem 0.9rem', borderRadius: '4px', cursor: 'pointer', fontWeight: 600, fontSize: '0.9rem' }}
                    >
                        🗺 Route ({selectedIds.length})
                    </button>
                )}
                {getAdmin() && <button onClick={() => exportToExcel(addressList, masjidID, selectedUnit)} style={{ background: '#43a047', color: '#fff', border: 'none', padding: '0.4rem 0.9rem', borderRadius: '4px', cursor: 'pointer', fontWeight: 600, fontSize: '0.9rem' }}>⬇ Export Excel</button>}
                <button onClick={() => setShowAddAddress(v => !v)} style={{ background: '#1976d2', color: '#fff', border: 'none', padding: '0.4rem 0.9rem', borderRadius: '4px', cursor: 'pointer', fontWeight: 600, fontSize: '0.9rem' }}>+ Add Address</button>
            </div>
            <SearchForm masjidID={masjidID} unitID={selectedUnit} unitOptions={unitOptions} onUnitChange={handleUnitChange} onSearch={handleSearch} onReset={handleReset} initialValues={searchParams} areaValue={areaFilter} onAreaChange={handleAreaChange} areaOptions={unitAreas} lockMasjidId={!isMarkazAdmin} includeInactiveValue={includeInactive} onIncludeInactiveChange={handleIncludeInactiveChange} />
            {selectedIds.length > 0 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: '1rem 1.5rem 0.75rem', padding: '0.75rem 1rem', background: '#e3f2fd', borderRadius: '6px', border: '1px solid #90caf9' }}>
                    <span style={{ fontWeight: 600, color: '#1565c0' }}>{selectedIds.length} selected</span>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', margin: 0 }}>
                        Set Neighborhood:
                        <input
                            type="text"
                            list="area-options-datalist"
                            value={newArea}
                            onChange={e => setNewArea(e.target.value)}
                            placeholder="Enter or pick neighborhood"
                            style={{ padding: '0.3rem 0.5rem', minWidth: '200px' }}
                        />
                        <datalist id="area-options-datalist">
                            {unitAreas.map(a => <option key={a} value={a} />)}
                        </datalist>
                    </label>
                    <button
                        onClick={() => handleUpdateArea(selectedIds, newArea)}
                        disabled={!newArea.trim()}
                        style={{ padding: '0.3rem 0.8rem', opacity: !newArea.trim() ? 0.5 : 1, cursor: !newArea.trim() ? 'not-allowed' : 'pointer' }}
                    >
                        Update
                    </button>
                    <button onClick={() => setSelectedIds([])} style={{ padding: '0.3rem 0.6rem', background: 'none', border: '1px solid #aaa', cursor: 'pointer' }}>Clear</button>
                </div>
            )}
            {selectedIds.length > 0 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: '1rem 1.5rem 0.75rem', padding: '0.75rem 1rem', background: '#fce4ec', borderRadius: '6px', border: '1px solid #f48fb1' }}>
                    <span style={{ fontWeight: 600, color: '#c2185b' }}>{selectedIds.length} selected</span>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', margin: 0 }}>
                        Set Unit:
                        <select
                            value={newUnit}
                            onChange={e => setNewUnit(e.target.value)}
                            style={{ padding: '0.3rem 0.5rem' }}
                        >
                            <option value="">— pick —</option>
                            {unitOptions.map(u => <option key={u} value={u}>{u}</option>)}
                        </select>
                    </label>
                    <button
                        onClick={() => handleBulkUpdateUnit(selectedIds, newUnit)}
                        disabled={newUnit === ''}
                        style={{ padding: '0.3rem 0.8rem', opacity: newUnit === '' ? 0.5 : 1, cursor: newUnit === '' ? 'not-allowed' : 'pointer' }}
                    >
                        Update
                    </button>
                    <button onClick={() => setSelectedIds([])} style={{ padding: '0.3rem 0.6rem', background: 'none', border: '1px solid #aaa', cursor: 'pointer' }}>Clear</button>
                </div>
            )}
            {unitUpdateStatus && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: '0.25rem 0', padding: '0.4rem 1rem', background: '#e8f5e9', border: '1px solid #a5d6a7', borderRadius: '6px', color: '#2e7d32', fontWeight: 500 }}>
                    ✓ Updated {unitUpdateStatus.count} address{unitUpdateStatus.count !== 1 ? 'es' : ''} to new unit
                </div>
            )}
            {areaUpdateStatus && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: '0.25rem 0', padding: '0.4rem 1rem', background: '#e8f5e9', border: '1px solid #a5d6a7', borderRadius: '6px', color: '#2e7d32', fontWeight: 500 }}>
                    ✓ Updated {areaUpdateStatus.modifiedCount} of {areaUpdateStatus.matchedCount} address{areaUpdateStatus.matchedCount !== 1 ? 'es' : ''}
                </div>
            )}
            {searchWarning === 'no-results' && (
                <div style={{ margin: '0.5rem 0', padding: '0.75rem 1rem', border: '1px solid #ffe082', borderRadius: '6px', background: '#fffde7', color: '#795548', fontWeight: 500 }}>
                    No listing found matching your search.
                </div>
            )}
            {searchWarning === 'cross-masjid' && (
                <div style={{ margin: '0.5rem 0', padding: '0.75rem 1rem', border: '1px solid #f5c6cb', borderRadius: '6px', background: '#fff3f3', color: '#b71c1c', fontWeight: 500 }}>
                    This listing does not belong to this masjid.
                </div>
            )}
            <h2>{`${masjidConfig ? `${masjidConfig.name} - ` : ''}${isStudentView ? 'Student Listings' : isInactiveView ? 'Inactive Listings' : 'Address List'}`}</h2>
            {showAddAddress && (
                <AddAddress
                    masjidID={masjidID}
                    unitOptions={unitOptions}
                    defaultUnitId={selectedUnit}
                    onClose={() => setShowAddAddress(false)}
                    onCreated={handleAddressCreated}
                />
            )}
            <AddressList initialAddressList={filteredAddressList} selectedIds={selectedIds} onSelectionChange={setSelectedIds} showStudentInfo={isStudentView} newIds={recentlyAddedIds} />
        </>
    );
}

export default Landing;