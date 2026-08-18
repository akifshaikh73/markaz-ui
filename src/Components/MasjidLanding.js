import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { setAdmin, setUserRole, getHijriYear } from '../config';
import StatusBadges from './StatusBadges';
import { useApiReady, ApiSplash } from '../hooks/useApiReady';
import { useMasjidConfig } from '../hooks/useMasjids';
import versionInfo from '../version.json';
const { version } = versionInfo;

const MasjidLanding = () => {
    const { masjidSlug } = useParams();
    const navigate = useNavigate();
    const { getMasjidByLanding, loading: masjidLoading } = useMasjidConfig();
    const apiReady = useApiReady();

    const masjidConfig = getMasjidByLanding(masjidSlug);
    const cachedContext = JSON.parse(localStorage.getItem('landingContext')) || {};

    const [unitID, setUnitID] = useState('');
    const [showAdminLogin, setShowAdminLogin] = useState(false);
    const [adminPassword, setAdminPassword] = useState('');
    const [adminError, setAdminError] = useState('');

    // Set initial unit once masjidConfig is available
    useEffect(() => {
        if (!masjidConfig) return;
        const lastUnit = cachedContext.masjidID === String(masjidConfig._id ?? masjidConfig.id) && cachedContext.unitID
            ? (cachedContext.unitID === 'all' ? 'all' : parseInt(cachedContext.unitID))
            : (Array.isArray(masjidConfig.units) ? masjidConfig.units[0] : '');
        setUnitID(lastUnit || '');
    }, [masjidConfig?._id ?? masjidConfig?.id]); // eslint-disable-line react-hooks/exhaustive-deps

    if (!apiReady || masjidLoading) return <ApiSplash />;

    if (!masjidConfig) {
        return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxWidth: '300px', margin: '2rem auto', padding: '2rem', border: '1px solid #ccc', borderRadius: '8px' }}>
                <h2>Masjid Not Found</h2>
                <p>The masjid '{masjidSlug}' does not exist.</p>
                <button onClick={() => navigate('/masjid-login')} style={{ padding: '0.5rem' }}>Go to Login</button>
            </div>
        );
    }

    const masjidId = masjidConfig._id ?? masjidConfig.id;

    const handleLogout = () => {
        setAdmin(false);
        localStorage.removeItem('addressList');
        localStorage.removeItem('searchParams');
        localStorage.removeItem('areaFilter');
        localStorage.removeItem('activeFilters');
        localStorage.removeItem('landingContext');
        sessionStorage.clear();
        navigate('/');
    };

    const handleLogin = () => {
        setAdmin(false);
        navigate(`/landing/${masjidId}/${unitID}`, { state: { isLoggedIn: true } });
    };

    const handleAdminLogin = () => {
        const expectedPassword = `${masjidConfig.landing}${getHijriYear()}`;
        if (adminPassword === expectedPassword) {
            setUserRole('MasjidAdmin');
            setAdminError('');
            setAdminPassword('');
            navigate(`/landing/${masjidId}/${unitID}`, { state: { isLoggedIn: true } });
        } else {
            setAdminError('Incorrect admin password');
        }
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxWidth: '300px', margin: '2rem auto', padding: '2rem', border: '1px solid #ccc', borderRadius: '8px' }}>
            {cachedContext.masjidID === String(masjidId) && (
                <button onClick={handleLogout} style={{ alignSelf: 'flex-end', background: 'none', border: 'none', color: '#d32f2f', cursor: 'pointer', padding: 0, fontSize: '0.9rem' }}>Logout</button>
            )}
            <h2>{masjidConfig.name}</h2>
            <div>
                <label>
                    Masjid ID:
                    <input
                        type="number"
                        value={masjidId}
                        readOnly
                        style={{ background: '#f0f0f0', cursor: 'not-allowed', width: '100%', marginTop: '0.5rem', padding: '0.5rem' }}
                    />
                </label>
            </div>
            <div>
                <label>
                    Unit ID:
                    <select
                        value={unitID}
                        onChange={e => setUnitID(e.target.value)}
                        style={{ width: '100%', marginTop: '0.5rem', padding: '0.5rem' }}
                    >
                        {(Array.isArray(masjidConfig.units) ? masjidConfig.units : []).map(u => (
                            <option key={u} value={u}>{u}</option>
                        ))}
                        <option key="all" value="all">All</option>
                    </select>
                </label>
            </div>
            <button onClick={handleLogin} style={{ padding: '0.5rem' }}>
                Login
            </button>
            <button onClick={() => { setShowAdminLogin(!showAdminLogin); setAdminError(''); setAdminPassword(''); }} style={{ padding: '0.5rem', background: '#f0f0f0', border: '1px solid #ccc', cursor: 'pointer' }}>
                {showAdminLogin ? 'Cancel Masjid Admin Login' : 'Masjid Admin Login'}
            </button>
            {showAdminLogin && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', padding: '1rem', border: '1px solid #ff9800', borderRadius: '4px', background: '#fff8f0' }}>
                    <label>
                        Admin Password:
                        <input
                            type="password"
                            value={adminPassword}
                            onChange={e => { setAdminPassword(e.target.value); setAdminError(''); }}
                            onKeyPress={e => e.key === 'Enter' && handleAdminLogin()}
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

export default MasjidLanding;
