import React, { useState, useEffect } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import SearchForm from './Search';
import AddressList from './AddressList';
import FilterUI from './FilterUI';
import { exportToExcel } from '../exportExcel';
import { MASJID_UNITS, setAdmin, getAdmin } from '../config';
import StatusBadges from './StatusBadges';

function Landing() {
    const location = useLocation();
    const navigate = useNavigate();
    const { masjidID, unitID } = useParams();
    const [selectedUnit, setSelectedUnit] = useState(parseInt(unitID));
    const [addressList, setAddressList] = useState(JSON.parse(localStorage.getItem('addressList')) || []);
    const [searchParams, setSearchParams] = useState(
        JSON.parse(localStorage.getItem('searchParams')) || {}
    );
    const [areaFilter, setAreaFilter] = useState(localStorage.getItem('areaFilter') || '');

    const unitOptions = MASJID_UNITS[parseInt(masjidID)] || [parseInt(unitID)];

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
        const newUnit = parseInt(e.target.value);
        setSelectedUnit(newUnit);
        localStorage.removeItem('addressList');
        localStorage.removeItem('searchParams');
        localStorage.removeItem('areaFilter');
        navigate(`/landing/${masjidID}/${newUnit}`, { state: { isLoggedIn: true } });
    };

    const API_URL = process.env.REACT_APP_API_URL || '';

    const handleSearch = (params) => {
        setSearchParams(params);
        localStorage.setItem('searchParams', JSON.stringify(params));
        fetch(`${API_URL}/api/addressList/filter/search/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(searchParams)
        })
            .then(response => response.json())
            .then(data => {
                setAddressList(data);
            });
    };

    const handleFilter = (filterParams) => {
        setSearchParams(filterParams);
        localStorage.setItem('searchParams', JSON.stringify(filterParams));
        fetch(`${API_URL}/api/addressList/filter/students/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(filterParams)
        })
            .then(response => response.json())
            .then(data => {
                setAddressList(data);
            });
    };

    const onLogout = () => {
        setAdmin(false); // Reset admin mode on logout
        localStorage.removeItem('addressList');
        localStorage.removeItem('searchParams');
        localStorage.removeItem('areaFilter');
        navigate('/login');
    };

    useEffect(() => {
        if (!location.state || !location.state.isLoggedIn) {
            navigate('/login');
            return;
        }

        if (addressList.length === 0) {
            fetch(`${API_URL}/api/addressList/list?masjid_id=${masjidID}&unit_id=${selectedUnit}`)
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
            <FilterUI onFilter={handleFilter} />
            <h2>Address List</h2>
            <AddressList initialAddressList={filteredAddressList} />
        </>
    );
}

export default Landing;