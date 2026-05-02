import React, { useState, useEffect } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import SearchForm from './Search';
import AddressList from './AddressList';
import FilterUI from './FilterUI';

function Landing() {
    const location = useLocation();
    const navigate = useNavigate();
    const { masjidID, unitID } = useParams();
    const [addressList, setAddressList] = useState(JSON.parse(localStorage.getItem('addressList')) || []);
    const [searchParams, setSearchParams] = useState(
        JSON.parse(localStorage.getItem('searchParams')) || {}
    );
    const [areaFilter, setAreaFilter] = useState(localStorage.getItem('areaFilter') || '');

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

    const handleSearch = (params) => {
        setSearchParams(params);
        localStorage.setItem('searchParams', JSON.stringify(params));
        fetch('http://localhost:3000/api/addressList/filter/search/', {
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
        fetch('http://localhost:3000/api/addressList/filter/students/', {
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
            fetch(`http://localhost:3000/api/addressList/list?masjid_id=${masjidID}&unit_id=${unitID}`)
                .then(response => response.json())
                .then(data => {
                    setAddressList(data);
                    localStorage.setItem('addressList', JSON.stringify(data));
                });
        }
    }, [masjidID, unitID]); // eslint-disable-line react-hooks/exhaustive-deps

    return (
        <>
            <div style={{ position: 'absolute', top: '10px', right: '10px', display: 'flex', gap: '0.5rem' }}>
                <button onClick={() => navigate(`/map/${masjidID}/${unitID}`, { state: { isLoggedIn: true } })}>🗺 Map View</button>
                <button onClick={onLogout}>Logout</button>
            </div>
            <SearchForm masjidID={masjidID} unitID={unitID} onSearch={handleSearch} initialValues={searchParams} areaValue={areaFilter} onAreaChange={handleAreaChange} />
            <FilterUI onFilter={handleFilter} />
            <h2>Address List</h2>
            <AddressList initialAddressList={filteredAddressList} />
        </>
    );
}

export default Landing;