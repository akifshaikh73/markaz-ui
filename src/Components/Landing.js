import React, { useState, useEffect } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import SearchForm from './Search';
import AddressList from './AddressList';
import FilterUI from './FilterUI';
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



    const onLogout = () => {
        setAdmin(false); // Reset admin mode on logout
        localStorage.removeItem('addressList');
        localStorage.removeItem('searchParams');
        localStorage.removeItem('areaFilter');
        localStorage.removeItem('activeFilters');
        localStorage.removeItem('landingContext');
        navigate('/masjid-login', { state: { masjidID } });
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
                <button onClick={onLogout}>Logout</button>
            </div>
            <SearchForm masjidID={masjidID} unitID={selectedUnit} unitOptions={unitOptions} onUnitChange={handleUnitChange} onSearch={handleSearch} initialValues={searchParams} areaValue={areaFilter} onAreaChange={handleAreaChange} />
            <FilterUI filters={activeFilters} onFilterChange={handleFilterChange} />
            <h2>{masjidConfig ? `${masjidConfig.name} - Address List` : 'Address List'}</h2>
            <AddressList initialAddressList={filteredAddressList} />
        </>
    );
}

export default Landing;