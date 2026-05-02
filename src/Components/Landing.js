import React, { useState, useEffect } from 'react';
import { useParams , useLocation ,useNavigate} from 'react-router-dom';
import SearchForm from './Search';
import AddressList from './AddressList';
import FilterUI from './FilterUI';

function Landing() {
    const location = useLocation();
    const navigate = useNavigate();
    console.log(location); // "/landing"
    console.log(location.state); // { isLoggedIn: true }
    if (location.state === undefined) {
        navigate('/login');
    }
    const [addressList, setAddressList] = useState(JSON.parse(localStorage.getItem('addressList')) || []);
    console.log(`addressList from store: ${addressList}`);
    const { masjidID, unitID } = useParams();
    const [searchParams, setSearchParams] = useState({ });
    console.log(`masjidID: ${masjidID}, unitID: ${unitID}`);
    
    const handleSearch = (searchParams) => {
        setSearchParams(searchParams);
        fetch('http://localhost:3000/api/addressList/filter/search/', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(searchParams)
        })
            .then(response => response.json())
            .then(data => {
                setAddressList(data);
            }   );
    }
    const handleFilter = (filterParams) => {
        setSearchParams(filterParams);
        fetch('http://localhost:3000/api/addressList/filter/students/', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(filterParams)
        })
            .then(response => response.json())
            .then(data => {
                setAddressList(data);
            });
    }
    const onLogout = () => {
        localStorage.removeItem('addressList');
        // Handle logout logic here
        navigate('/login');
        console.log('Logging out');
    }

    useEffect(() => {
        if (location.state && location.state.isLoggedIn) {
            console.log('User is logged in');
        } else {
            console.log('User is not logged in');
            navigate('/login');
        }
        // Fetch data or perform some other side effect
        console.log(`Fetching addressList ${addressList.length}`);
        if (  addressList === undefined ||  addressList.length === 0 ) {
            fetch(`http://localhost:3000/api/addressList/list?masjid_id=${masjidID}&unit_id=${unitID}`)
            .then(response => response.json())
            .then(data => {
                setAddressList(data);
                localStorage.setItem('addressList', JSON.stringify(data));

        });
        }
    }, [masjidID, unitID,addressList.length]);


    return (
        <>
<div style={{ position: 'absolute', top: '10px', right: '10px' }}>
            <button onClick={onLogout}>Logout</button>
        </div>        
            <SearchForm masjidID={masjidID} unitID={unitID} onSearch={handleSearch} />
            <FilterUI onFilter={handleFilter} />
            <h2>Address List</h2>
            <AddressList initialAddressList={addressList} />
        </>
    );
}

export default Landing;