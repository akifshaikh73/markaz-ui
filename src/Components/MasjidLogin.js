import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { setUserRole } from '../config';
import StatusBadges from './StatusBadges';
import { useApiReady, ApiSplash } from '../hooks/useApiReady';
import versionInfo from '../version.json';
const { version } = versionInfo;

const Login = ({ lockedMasjidID }) => {
    const location = useLocation();
    const [masjidID, setMasjidID] = useState(lockedMasjidID || location.state?.masjidID || '');
    const [pin, setPin] = useState('');
    const [pinError, setPinError] = useState('');
    const [pinLoading, setPinLoading] = useState(false);
    const apiReady = useApiReady();

    const navigate = useNavigate();

    if (!apiReady) return <ApiSplash />;

    const handleMasjidChange = (e) => {
        setMasjidID(e.target.value);
    };

    const handlePinLogin = () => {
        if (!masjidID) {
            setPinError('Please enter a Masjid ID first');
            return;
        }
        if (!pin.trim()) {
            setPinError('PIN is required');
            return;
        }
        setPinLoading(true);
        setUserRole('MasjidUser');
        localStorage.setItem('userPin', pin.trim());
        localStorage.setItem('loginSource', 'pin');
        setPin('');
        setPinError('');
        navigate(`/landing/${masjidID}/all`, { state: { isLoggedIn: true } });
    };



    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxWidth: '300px', margin: '2rem auto', padding: '2rem', border: '1px solid #ccc', borderRadius: '8px' }}>
            <button onClick={() => navigate('/user-login')} style={{ alignSelf: 'flex-start', background: 'none', border: 'none', color: '#1976d2', cursor: 'pointer', padding: 0, fontSize: '0.9rem' }}>← Back to User Login</button>
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
                    PIN (Masjid Access):
                    <input
                        type="password"
                        value={pin}
                        onChange={(e) => { setPin(e.target.value); setPinError(''); }}
                        onKeyPress={(e) => e.key === 'Enter' && handlePinLogin()}
                        placeholder="Enter PIN"
                        disabled={pinLoading || !masjidID}
                        style={{ width: '100%', marginTop: '0.5rem', padding: '0.5rem', boxSizing: 'border-box' }}
                    />
                </label>
            </div>
            {pinError && <p style={{ color: '#d32f2f', margin: 0, fontSize: '0.9rem' }}>{pinError}</p>}
            <button 
                onClick={handlePinLogin}
                disabled={pinLoading || !masjidID || !pin}
                style={{ padding: '0.5rem', background: '#1976d2', color: '#fff', border: 'none', borderRadius: '4px', cursor: pinLoading || !masjidID || !pin ? 'not-allowed' : 'pointer', opacity: pinLoading || !masjidID || !pin ? 0.5 : 1 }}
            >
                {pinLoading ? 'Logging in...' : 'Login with PIN'}
            </button>
            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                <StatusBadges showOnMobile={true} />
            </div>
            <p style={{ margin: 0, textAlign: 'center', fontSize: '0.75rem', color: '#aaa' }}>v{version}</p>
        </div>
    );
};

export default Login;