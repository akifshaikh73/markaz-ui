import React, { useState, useEffect } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import SearchForm from './Search';
import AddressList from './AddressList';
import FilterUI from './FilterUI';
import AddAddress from './AddAddress';
import { exportToExcel } from '../exportExcel';
import { MASJID_UNITS, MASJID_CONFIG, setAdmin, getAdmin } from '../config';
import StatusBadges from './StatusBadges';

function Landing() {
    const location = useLocation();
    const navigate = useNavigate();
    const { masjidID, unitID } = useParams();
    const [selectedUnit, setSelectedUnit] = useState(unitID === 'all' ? '' : (parseInt(unitID) || ''));
    const cachedContext = JSON.parse(localStorage.getItem('landingContext')) || {};
    const cacheValid = cachedContext.masjidID === masjidID && cachedContext.unitID === unitID;

    const [addressList, setAddressList] = useState(cacheValid ? (JSON.parse(localStorage.getItem('addressList')) || []) : []);
    const [searchParams, setSearchParams] = useState(
        cacheValid ? (JSON.parse(localStorage.getItem('searchParams')) || {}) : {}
    );
    const [areaFilter, setAreaFilter] = useState(cacheValid ? (localStorage.getItem('areaFilter') || '') : '');
    const [showAddAddress, setShowAddAddress] = useState(false);
    const [selectedIds, setSelectedIds] = useState([]);
    const [newArea, setNewArea] = useState('');
    const [areaUpdateStatus, setAreaUpdateStatus] = useState(null);
    const [activeFilters, setActiveFilters] = useState(
        cacheValid ? (JSON.parse(localStorage.getItem('activeFilters')) || { showInactive: false, filterByStudents: false }) : { showInactive: false, filterByStudents: false }
    );

    if (!cacheValid) {
        localStorage.removeItem('addressList');
        localStorage.removeItem('searchParams');
        localStorage.removeItem('areaFilter');
        localStorage.removeItem('activeFilters');
        localStorage.setItem('landingContext', JSON.stringify({ masjidID, unitID }));
    }

    const unitOptions = MASJID_UNITS[parseInt(masjidID)] || [parseInt(unitID)];
    const masjidConfig = MASJID_CONFIG.find(m => String(m.id) === String(masjidID));

    const filteredAddressList = areaFilter.trim()
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
        localStorage.removeItem('activeFilters');
        localStorage.removeItem('landingContext');
        if (val === '') {
            setSelectedUnit('');
            setSearchParams({});
            setAreaFilter('');
            setActiveFilters({ showInactive: false, filterByStudents: false });
            fetch(`${API_URL}/api/addressList/list?masjid_id=${masjidID}`)
                .then(response => response.json())
                .then(data => {
                    setAddressList(data);
                    localStorage.setItem('addressList', JSON.stringify(data));
                });
        } else {
            const newUnit = parseInt(val);
            setSelectedUnit(newUnit);
            setAddressList([]);
            navigate(`/landing/${masjidID}/${newUnit || 'all'}`, { state: { isLoggedIn: true } });
        }
    };

    const API_URL = process.env.REACT_APP_API_URL || '';

    const doSearch = (params, filters) => {
        const body = { ...params, ...filters };
        if (!body.unitId) delete body.unitId;
        fetch(`${API_URL}/api/addressList/filter/search/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        })
            .then(response => response.json())
            .then(data => {
                setAddressList(data);
                localStorage.setItem('addressList', JSON.stringify(data));
                localStorage.setItem('landingContext', JSON.stringify({ masjidID, unitID }));
            });
    };

    const handleSearch = (params) => {
        setSearchParams(params);
        localStorage.setItem('searchParams', JSON.stringify(params));
        doSearch(params, activeFilters);
    };

    const handleFilterChange = (changed) => {
        const newFilters = { ...activeFilters, ...changed };
        setActiveFilters(newFilters);
        localStorage.setItem('activeFilters', JSON.stringify(newFilters));
        doSearch(searchParams, newFilters);
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
            setSelectedIds([]);
            setNewArea('');
            setAreaUpdateStatus(data);
            setTimeout(() => setAreaUpdateStatus(null), 4000);
        })
        .catch(err => console.error('Error updating area:', err));
    };



    const onLogout = () => {
        setAdmin(false); // Reset admin mode on logout
        localStorage.removeItem('addressList');
        localStorage.removeItem('searchParams');
        localStorage.removeItem('areaFilter');
        localStorage.removeItem('activeFilters');
        localStorage.removeItem('landingContext');
        navigate(masjidConfig ? `/${masjidConfig.landing}` : '/masjid-login');
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
                    setAddressList(data);
                    localStorage.setItem('addressList', JSON.stringify(data));
                });
        }
    }, [masjidID, selectedUnit]); // eslint-disable-line react-hooks/exhaustive-deps

    return (
        <>
            <div style={{ position: 'absolute', top: '10px', right: '10px', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <StatusBadges />
                {getAdmin() && <button onClick={() => navigate(`/map/${masjidID}/${selectedUnit}`, { state: { isLoggedIn: true } })}>🗺 Map View</button>}
                {getAdmin() && <button onClick={() => exportToExcel(addressList, masjidID, selectedUnit)}>⬇ Export Excel</button>}
                {getAdmin() && <button onClick={() => setShowAddAddress(v => !v)}>+ Add Address</button>}
                <button onClick={onLogout}>Logout</button>
            </div>
            <SearchForm masjidID={masjidID} unitID={selectedUnit} unitOptions={unitOptions} onUnitChange={handleUnitChange} onSearch={handleSearch} initialValues={searchParams} areaValue={areaFilter} onAreaChange={handleAreaChange} />
            <FilterUI filters={activeFilters} onFilterChange={handleFilterChange} />
            {selectedIds.length > 0 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: '0.5rem 0', padding: '0.5rem 1rem', background: '#e3f2fd', borderRadius: '6px' }}>
                    <span style={{ fontWeight: 500 }}>{selectedIds.length} selected</span>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', margin: 0 }}>
                        Set Neighborhood:
                        <input
                            type="text"
                            value={newArea}
                            onChange={e => setNewArea(e.target.value)}
                            placeholder="Enter neighborhood name"
                            style={{ padding: '0.3rem 0.5rem', minWidth: '200px' }}
                        />
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
            {areaUpdateStatus && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: '0.25rem 0', padding: '0.4rem 1rem', background: '#e8f5e9', border: '1px solid #a5d6a7', borderRadius: '6px', color: '#2e7d32', fontWeight: 500 }}>
                    ✓ Updated {areaUpdateStatus.modifiedCount} of {areaUpdateStatus.matchedCount} address{areaUpdateStatus.matchedCount !== 1 ? 'es' : ''}
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
            <AddressList initialAddressList={filteredAddressList} selectedIds={selectedIds} onSelectionChange={setSelectedIds} />
        </>
    );
}

export default Landing;