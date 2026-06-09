import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { setAdmin, MASJID_UNITS, UNIT_OPTIONS, ADMIN_PASSWORD } from '../config';
import StatusBadges from './StatusBadges';

const Login = ({ lockedMasjidID, unitOptions }) => {
    const [masjidID, setMasjidID] = useState(lockedMasjidID || 156);
    const [unitID, setUnitID] = useState(unitOptions ? unitOptions[0] : 1);
    const [showAdminLogin, setShowAdminLogin] = useState(false);
    const [adminPassword, setAdminPassword] = useState('');
    const [adminError, setAdminError] = useState('');

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
        if (adminPassword === ADMIN_PASSWORD) {
            setAdmin(true);
            setAdminError('');
            setAdminPassword('');
            navigate(`/landing/${masjidID}/${unitID}`, { state: { isLoggedIn: true } });
        } else {
            setAdminError('Incorrect admin password');
        }
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
            <button onClick={() => { setShowAdminLogin(!showAdminLogin); setAdminError(''); setAdminPassword(''); }} style={{ padding: '0.5rem', background: '#f0f0f0', border: '1px solid #ccc', cursor: 'pointer' }}>
                {showAdminLogin ? 'Cancel Admin Login' : 'Admin Login'}
            </button>
            {showAdminLogin && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', padding: '1rem', border: '1px solid #ff9800', borderRadius: '4px', background: '#fff8f0' }}>
                    <label>
                        Admin Password:
                        <input
                            type="password"
                            value={adminPassword}
                            onChange={(e) => {
                                setAdminPassword(e.target.value);
                                setAdminError('');
                            }}
                            onKeyPress={(e) => e.key === 'Enter' && handleAdminLogin()}
                            style={{ width: '100%', marginTop: '0.5rem', padding: '0.5rem', boxSizing: 'border-box' }}
                            placeholder="Enter admin password"
                        />
                    </label>
                    {adminError && <p style={{ color: '#d32f2f', margin: '0.5rem 0', fontSize: '0.9rem' }}>{adminError}</p>}
                    <button onClick={handleAdminLogin} disabled={!adminPassword} style={{ padding: '0.5rem', background: '#ff9800', color: 'white', border: 'none', borderRadius: '4px', cursor: adminPassword ? 'pointer' : 'not-allowed', opacity: adminPassword ? 1 : 0.5 }}>
                        Login as Admin
                    </button>
                </div>
            )}
            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                <StatusBadges showOnMobile={true} />
            </div>
        </div>
    );
};

export default Login;