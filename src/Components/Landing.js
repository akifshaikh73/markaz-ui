import React, { useState, useEffect } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import SearchForm from './Search';
import AddressList from './AddressList';
import AddAddress from './AddAddress';
import { exportToExcel } from '../exportExcel';
import { setAdmin, getAdmin, getUserRole } from '../config';
import StatusBadges from './StatusBadges';
import { RoleBadge } from '../utils';
import { useMasjidConfig } from '../hooks/useMasjids';

function Landing() {
    const location = useLocation();
    const navigate = useNavigate();
    const { masjidID, unitID } = useParams();
    const [selectedUnit, setSelectedUnit] = useState(unitID === 'all' ? '' : (unitID !== '' && !isNaN(parseInt(unitID)) ? parseInt(unitID) : ''));
    const cachedContext = JSON.parse(localStorage.getItem('landingContext')) || {};
    const cacheValid = cachedContext.masjidID === masjidID && cachedContext.unitID === unitID;

    const [addressList, setAddressList] = useState(cacheValid ? (JSON.parse(localStorage.getItem('addressList')) || []) : []);
    const [searchParams, setSearchParams] = useState(
        cacheValid ? (JSON.parse(localStorage.getItem('searchParams')) || {}) : {}
    );
    const [areaFilter, setAreaFilter] = useState(cacheValid ? (localStorage.getItem('areaFilter') || '') : '');
    const unitAreasKey = `unitAreas_${masjidID}_${unitID}`;
    const [unitAreas, setUnitAreas] = useState(() => {
        const cached = sessionStorage.getItem(unitAreasKey);
        return cached ? JSON.parse(cached) : [];
    });
    const [showAddAddress, setShowAddAddress] = useState(false);
    const [selectedIds, setSelectedIds] = useState([]);
    const [selectedUnitIds, setSelectedUnitIds] = useState([]);
    const [newArea, setNewArea] = useState('');
    const [newUnit, setNewUnit] = useState('');
    const [areaUpdateStatus, setAreaUpdateStatus] = useState(null);
    const [unitUpdateStatus, setUnitUpdateStatus] = useState(null);
    const [searchWarning, setSearchWarning] = useState(null); // 'no-results' | 'cross-masjid' | null

    if (!cacheValid) {
        localStorage.removeItem('addressList');
        localStorage.removeItem('searchParams');
        localStorage.removeItem('areaFilter');
        localStorage.setItem('landingContext', JSON.stringify({ masjidID, unitID }));
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
        setAreaFilter(e.target.value);
        localStorage.setItem('areaFilter', e.target.value);
    };

    const handleUnitChange = (e) => {
        const val = e.target.value;
        localStorage.removeItem('addressList');
        localStorage.removeItem('searchParams');
        localStorage.removeItem('areaFilter');
        localStorage.removeItem('landingContext');
        setUnitAreas([]);
        if (val === '') {
            setSelectedUnit('');
            setSearchParams({});
            setAreaFilter('');
            fetch(`${API_URL}/api/addressList/list?masjid_id=${masjidID}`)
                .then(response => response.json())
                .then(data => {
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
            navigate(`/landing/${masjidID}/${!isNaN(newUnit) ? newUnit : 'all'}`, { state: { isLoggedIn: true } });
        }
    };

    const API_URL = process.env.REACT_APP_API_URL || '';

    const doSearch = (params) => {
        setSearchWarning(null);
        const body = { ...params };
        if (body.unitId === undefined || body.unitId === null || body.unitId === '') delete body.unitId;
        fetch(`${API_URL}/api/addressList/filter/search/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        })
            .then(response => response.json())
            .then(data => {
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
                localStorage.setItem('landingContext', JSON.stringify({ masjidID, unitID }));
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
            setSelectedUnitIds([]);
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
        setSearchWarning(null);
        localStorage.setItem('searchParams', JSON.stringify(baseParams));
        localStorage.removeItem('areaFilter');
        const unitParam = selectedUnit !== '' ? `&unit_id=${selectedUnit}` : '';
        fetch(`${API_URL}/api/addressList/list?masjid_id=${masjidID}${unitParam}`)
            .then(r => r.json())
            .then(data => {
                const filtered = isMarkazAdmin ? data : data.filter(item => String(item.masjidId) === String(masjidID));
                setAddressList(filtered);
                localStorage.setItem('addressList', JSON.stringify(filtered));
            });
    };

    const onLogout = () => {
        const wasMarkaz = getUserRole() === 'MarkazAdmin';
        setAdmin(false);
        // Clear user credentials (prevents auto-login)
        localStorage.removeItem('userEmail');
        localStorage.removeItem('userPin');
        localStorage.removeItem('userMasjids');
        localStorage.removeItem('userRole');
        localStorage.removeItem('loginSource');
        // Clear data and context
        localStorage.removeItem('addressList');
        localStorage.removeItem('searchParams');
        localStorage.removeItem('areaFilter');
        localStorage.removeItem('landingContext');
        localStorage.removeItem('preferredMasjid');
        sessionStorage.clear();
        if (wasMarkaz) {
            navigate('/admin-login');
        } else {
            navigate('/user-login');
        }
    };

    useEffect(() => {
        if (!location.state || !location.state.isLoggedIn) {
            navigate('/masjid-login');
            return;
        }

        if (addressList.length === 0) {
            const unitParam = selectedUnit !== '' ? `&unit_id=${selectedUnit}` : '';
            fetch(`${API_URL}/api/addressList/list?masjid_id=${masjidID}${unitParam}`)
                .then(response => response.json())
                .then(data => {
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

    return (
        <>
            <div style={{ position: 'fixed', top: '10px', left: '10px', display: 'flex', gap: '0.5rem', alignItems: 'center', zIndex: 1000 }}>
                <StatusBadges />
                <RoleBadge />
                <button
                    onClick={() => navigate(`/quick-links/${masjidID}`, { state: { isLoggedIn: true, masjidID } })}
                    style={{ background: '#1976d2', color: '#fff', border: 'none', padding: '0.3rem 0.6rem', borderRadius: '4px', cursor: 'pointer', fontWeight: 600, fontSize: '0.8rem', boxShadow: '0 1px 3px rgba(0,0,0,0.15)', letterSpacing: '0em' }}
                >
                    ⚡
                </button>
                {isMarkazAdmin && (
                    <button onClick={() => navigate('/admin-home')} style={{ fontSize: '0.75rem', color: '#1976d2', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600, padding: 0 }}>⌂ Home</button>
                )}
            </div>
            <div style={{ position: 'absolute', top: '10px', right: '10px', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                {getAdmin() && <button onClick={() => navigate(`/map/${masjidID}/${selectedUnit}`, { state: { isLoggedIn: true } })}>🗺 Map View</button>}
                {selectedIds.length > 0 && (
                    <button
                        onClick={() => navigate('/route', { state: { listings: addressList.filter(a => selectedIds.includes(a._id)), masjidID, unitID } })}
                        style={{ background: '#e65100', color: '#fff', border: 'none', padding: '0.35rem 0.9rem', borderRadius: '4px', cursor: 'pointer', fontWeight: 600 }}
                    >
                        🗺 Route ({selectedIds.length})
                    </button>
                )}
                {getAdmin() && <button onClick={() => exportToExcel(addressList, masjidID, selectedUnit)}>⬇ Export Excel</button>}
                <button onClick={() => setShowAddAddress(v => !v)}>+ Add Address</button>
                <button onClick={onLogout}>Logout</button>
            </div>
            <SearchForm masjidID={masjidID} unitID={selectedUnit} unitOptions={unitOptions} onUnitChange={handleUnitChange} onSearch={handleSearch} onReset={handleReset} initialValues={searchParams} areaValue={areaFilter} onAreaChange={handleAreaChange} areaOptions={unitAreas} lockMasjidId={!isMarkazAdmin} />
            {selectedIds.length > 0 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: '0.5rem 0', padding: '0.5rem 1rem', background: '#e3f2fd', borderRadius: '6px' }}>
                    <span style={{ fontWeight: 500 }}>{selectedIds.length} selected</span>
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
            {selectedUnitIds.length > 0 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: '0.5rem 0', padding: '0.5rem 1rem', background: '#fce4ec', borderRadius: '6px' }}>
                    <span style={{ fontWeight: 500 }}>{selectedUnitIds.length} selected</span>
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
                        onClick={() => handleBulkUpdateUnit(selectedUnitIds, newUnit)}
                        disabled={newUnit === ''}
                        style={{ padding: '0.3rem 0.8rem', opacity: newUnit === '' ? 0.5 : 1, cursor: newUnit === '' ? 'not-allowed' : 'pointer' }}
                    >
                        Update
                    </button>
                    <button onClick={() => setSelectedUnitIds([])} style={{ padding: '0.3rem 0.6rem', background: 'none', border: '1px solid #aaa', cursor: 'pointer' }}>Clear</button>
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
            <h2>{masjidConfig ? `${masjidConfig.name} - Address List` : 'Address List'}</h2>
            {showAddAddress && (
                <AddAddress
                    masjidID={masjidID}
                    unitOptions={unitOptions}
                    onClose={() => setShowAddAddress(false)}
                    onCreated={() => {}}
                />
            )}
            <AddressList initialAddressList={filteredAddressList} selectedIds={selectedIds} onSelectionChange={setSelectedIds} selectedUnitIds={selectedUnitIds} onUnitSelectionChange={setSelectedUnitIds} isAdmin={getAdmin()} />
        </>
    );
}

export default Landing;