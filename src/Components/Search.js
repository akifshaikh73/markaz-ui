import React, { useState, useEffect } from 'react';



function SearchForm({ masjidID, unitID,onSearch}) {
    const [name, setName] = useState('');
    const [address, setAddress] = useState('');
    const [city, setCity] = useState('');
    const [masjidId, setMasjidId] = useState(masjidID || '');
    const [unitId, setUnitId] = useState(unitID || '');
    const [_id, set_id] = useState('');


    useEffect(() => {
        setMasjidId(masjidID);
        setUnitId(unitID);
    }, [masjidID, unitID]);

    const handleSubmit = (event) => {
        event.preventDefault();
        const searchParams = {_id, name, address, city, masjidId, unitId };
        if (onSearch) {
            onSearch(searchParams);
        }
    };

    return (
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div>
            <label>
                Masjid ID:
                <input type="text" placeholder="Masjid ID" value={masjidId} onChange={e => setMasjidId(e.target.value)} />
            </label>
            <label>
                Unit ID:
                <input type="text" placeholder="Unit ID" value={unitId} onChange={e => setUnitId(e.target.value)} />
            </label>
            </div>
            <div>


            <label>
                ID:
                <input type="text" placeholder="ID" value={_id} onChange={e => set_id(e.target.value)} />
            </label>

            <label>
                Name:
                <input type="text" placeholder="Name" value={name} onChange={e => setName(e.target.value)} />
            </label>
            <label>
                Address:
                <input type="text" placeholder="Address" value={address} onChange={e => setAddress(e.target.value)} />
            </label>
            <label>
                City:
                <input type="text" placeholder="City" value={city} onChange={e => setCity(e.target.value)} />
            </label>
            </div>

            <button type="submit">Search</button>
        </form>
    );
}

export default SearchForm;