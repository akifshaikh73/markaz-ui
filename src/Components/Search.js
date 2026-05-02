import React, { useState, useEffect } from 'react';



function SearchForm({ masjidID, unitID, onSearch, initialValues = {}, areaValue = '', onAreaChange }) {
    const [name, setName] = useState(initialValues.name || '');
    const [address, setAddress] = useState(initialValues.address || '');
    const [city, setCity] = useState(initialValues.city || '');
    const [masjidId, setMasjidId] = useState(initialValues.masjidId || masjidID || '');
    const [unitId, setUnitId] = useState(initialValues.unitId || unitID || '');
    const [_id, set_id] = useState(initialValues._id || '');


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

            <div>
                <label>
                    Area:
                    <input
                        type="text"
                        placeholder="Filter by address, city or state"
                        value={areaValue}
                        onChange={onAreaChange}
                        style={{ width: '300px' }}
                    />
                </label>
            </div>

            <button type="submit">Search</button>
        </form>
    );
}

export default SearchForm;