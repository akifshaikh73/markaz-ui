import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { setAdmin, MASJID_UNITS, UNIT_OPTIONS } from '../config';

const Login = ({ lockedMasjidID, unitOptions }) => {
    const [masjidID, setMasjidID] = useState(lockedMasjidID || 156);
    const [unitID, setUnitID] = useState(unitOptions ? unitOptions[0] : 1);

    const navigate = useNavigate();

    const derivedUnitOptions = unitOptions || MASJID_UNITS[parseInt(masjidID)] || UNIT_OPTIONS;

    const handleMasjidChange = (e) => {
        const newMasjidID = e.target.value;
        setMasjidID(newMasjidID);
        const newUnitOptions = MASJID_UNITS[parseInt(newMasjidID)] || UNIT_OPTIONS;
        setUnitID(newUnitOptions[0]);
    };

    const handleLogin = () => {
        setAdmin(false); // Ensure regular users cannot edit
        navigate(`/landing/${masjidID}/${unitID}`, { state: { isLoggedIn: true } });
    };

    const handleAdminLogin = () => {
        navigate('/admin-login');
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxWidth: '300px', margin: '2rem auto', padding: '2rem', border: '1px solid #ccc', borderRadius: '8px' }}>
            <h2>Login</h2>
            <div>
                <label>
                    Masjid ID:
                    <input
                        type="number"
                        value={masjidID}
                        onChange={lockedMasjidID ? undefined : handleMasjidChange}
                        readOnly={!!lockedMasjidID}
                        style={lockedMasjidID ? { background: '#f0f0f0', cursor: 'not-allowed', width: '100%', marginTop: '0.5rem', padding: '0.5rem' } : { width: '100%', marginTop: '0.5rem', padding: '0.5rem' }}
                    />
                </label>
            </div>
            <div>
                <label>
                    Unit ID:
                    <select value={unitID} onChange={e => setUnitID(e.target.value)} style={{ width: '100%', marginTop: '0.5rem', padding: '0.5rem' }}>
                        {derivedUnitOptions.map(u => (
                            <option key={u} value={u}>{u}</option>
                        ))}
                    </select>
                </label>
            </div>
            <button onClick={handleLogin} disabled={!masjidID || !unitID} style={{ padding: '0.5rem' }}>
                Login
            </button>
            <button onClick={handleAdminLogin} style={{ padding: '0.5rem', background: '#f0f0f0' }}>
                Admin Login
            </button>
        </div>
    );
};

export default Login;