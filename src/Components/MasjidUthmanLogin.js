import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MASJID_UTHMAN_ID, UNIT_OPTIONS } from '../config';

const MasjidUthmanLogin = () => {
    const [unitID, setUnitID] = useState(UNIT_OPTIONS[0]);
    const navigate = useNavigate();

    const handleLogin = () => {
        navigate(`/landing/${MASJID_UTHMAN_ID}/${unitID}`, { state: { isLoggedIn: true } });
    };

    return (
        <div style={{ textAlign: 'center', marginTop: '80px' }}>
            <h2>Masjid Uthman</h2>
            <div>
                <label>
                    Masjid ID:
                    <input
                        type="number"
                        value={MASJID_UTHMAN_ID}
                        readOnly
                        style={{ background: '#f0f0f0', cursor: 'not-allowed' }}
                    />
                </label>
            </div>
            <div>
                <label>
                    Unit ID:
                    <select value={unitID} onChange={e => setUnitID(e.target.value)} style={{ marginLeft: '0.5rem', width: '80px' }}>
                        {UNIT_OPTIONS.map(u => (
                            <option key={u} value={u}>{u}</option>
                        ))}
                    </select>
                </label>
            </div>
            <button onClick={handleLogin}>
                Login
            </button>
        </div>
    );
};

export default MasjidUthmanLogin;
