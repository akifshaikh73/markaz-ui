import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { setAdmin, getAdmin, setUserRole, ADMIN_PASSWORD } from '../config';
import StatusBadges from './StatusBadges';
import { useApiReady, ApiSplash } from '../hooks/useApiReady';
import versionInfo from '../version.json';
const { version } = versionInfo;

const Login = ({ lockedMasjidID }) => {
    const location = useLocation();
    const [masjidID, setMasjidID] = useState(lockedMasjidID || location.state?.masjidID || '');
    const [showAdminLogin, setShowAdminLogin] = useState(false);
    const [adminPassword, setAdminPassword] = useState('');
    const [adminError, setAdminError] = useState('');
    const apiReady = useApiReady();

    const navigate = useNavigate();

    if (!apiReady) return <ApiSplash />;

    const handleMasjidChange = (e) => {
        setMasjidID(e.target.value);
    };

    const handleAdminLogin = () => {
        if (!masjidID) {
            setAdminError('Please enter a Masjid ID first');
            return;
        }
        if (adminPassword === ADMIN_PASSWORD) {
            setUserRole('MasjidAdmin');
            setAdminError('');
            setAdminPassword('');
            navigate(`/landing/${masjidID}/all`, { state: { isLoggedIn: true } });
        } else {
            setAdminError('Incorrect admin password');
        }
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxWidth: '300px', margin: '2rem auto', padding: '2rem', border: '1px solid #ccc', borderRadius: '8px' }}>
            <button onClick={() => navigate('/', { state: { intentionalHome: true } })} style={{ alignSelf: 'flex-start', background: 'none', border: 'none', color: '#1976d2', cursor: 'pointer', padding: 0, fontSize: '0.9rem' }}>← Home</button>
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

            <button onClick={() => { setShowAdminLogin(!showAdminLogin); setAdminError(''); setAdminPassword(''); }} disabled={!masjidID} style={{ padding: '0.5rem', background: '#f0f0f0', border: '1px solid #ccc', cursor: masjidID ? 'pointer' : 'not-allowed', opacity: masjidID ? 1 : 0.5 }}>
                {showAdminLogin ? 'Cancel Markaz Admin Login' : 'Markaz Admin Login'}
            </button>
            {getAdmin() && masjidID && (
                <button
                    onClick={() => { navigate(`/landing/${masjidID}/all`, { state: { isLoggedIn: true } }); }}
                    style={{ padding: '0.5rem', background: '#1976d2', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                >
                    Continue as Admin
                </button>
            )}
            {showAdminLogin && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', padding: '1rem', border: '1px solid #ff9800', borderRadius: '4px', background: '#fff8f0' }}>
                    <label>
                        Admin Password:
                        <input
                            type="password"
                            value={adminPassword}
                            name="markaz-admin-password"
                            autoComplete="current-password"
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
            <p style={{ margin: 0, textAlign: 'center', fontSize: '0.75rem', color: '#aaa' }}>v{version}</p>
        </div>
    );
};

export default Login;