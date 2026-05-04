import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { setAdmin } from '../config';

const Login = ({ lockedMasjidID, unitOptions }) => {
    const [masjidID, setMasjidID] = useState(lockedMasjidID || 156);
    const [unitID, setUnitID] = useState(unitOptions ? unitOptions[0] : 1);

    const navigate = useNavigate();

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
                        onChange={e => setMasjidID(e.target.value)}
                        readOnly={!!lockedMasjidID}
                        style={lockedMasjidID ? { background: '#f0f0f0', cursor: 'not-allowed', width: '100%', marginTop: '0.5rem', padding: '0.5rem' } : { width: '100%', marginTop: '0.5rem', padding: '0.5rem' }}
                    />
                </label>
            </div>
            <div>
                <label>
                    Unit ID:
                    {unitOptions ? (
                        <select value={unitID} onChange={e => setUnitID(e.target.value)} style={{ width: '100%', marginTop: '0.5rem', padding: '0.5rem' }}>
                            {unitOptions.map(u => (
                                <option key={u} value={u}>{u}</option>
                            ))}
                        </select>
                    ) : (
                        <input type="number" value={unitID} onChange={e => setUnitID(e.target.value)} style={{ width: '100%', marginTop: '0.5rem', padding: '0.5rem' }} />
                    )}
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