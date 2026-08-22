import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import StatusBadges from './StatusBadges';
import { useApiReady, ApiSplash } from '../hooks/useApiReady';
import { useMasjidConfig } from '../hooks/useMasjids';
import versionInfo from '../version.json';
const { version } = versionInfo;

const MasjidLanding = () => {
    const { masjidSlug } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const { getMasjidByLanding, loading: masjidLoading } = useMasjidConfig();
    const apiReady = useApiReady();

    const masjidConfig = getMasjidByLanding(masjidSlug);
    const cachedContext = JSON.parse(localStorage.getItem('landingContext')) || {};

    const [unitID, setUnitID] = useState('');
    const [showUserMasjids, setShowUserMasjids] = useState(false);

    // Set initial unit once masjidConfig is available
    useEffect(() => {
        if (!masjidConfig) return;
        const lastUnit = cachedContext.masjidID === String(masjidConfig._id ?? masjidConfig.id) && cachedContext.unitID
            ? (cachedContext.unitID === 'all' ? 'all' : parseInt(cachedContext.unitID))
            : (Array.isArray(masjidConfig.units) ? masjidConfig.units[0] : '');
        setUnitID(lastUnit !== undefined && lastUnit !== null && lastUnit !== '' ? lastUnit : '');
    }, [masjidConfig?._id ?? masjidConfig?.id]); // eslint-disable-line react-hooks/exhaustive-deps

    // Auto-navigate when coming from UserLogin (isLoggedIn flag in route state)
    useEffect(() => {
        if (!location.state?.isLoggedIn || !masjidConfig || !unitID) return;
        const masjidId = masjidConfig._id ?? masjidConfig.id;
        localStorage.setItem('preferredMasjid', masjidSlug);
        navigate(`/landing/${masjidId}/${unitID}`, { replace: true, state: { isLoggedIn: true } });
    }, [location.state?.isLoggedIn, masjidConfig, unitID]); // eslint-disable-line react-hooks/exhaustive-deps

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


    const handleLogin = () => {
        localStorage.setItem('preferredMasjid', masjidSlug);
        navigate(`/landing/${masjidId}/${unitID}`, { state: { isLoggedIn: true } });
    };

    const handleUserLogout = () => {
        // Clear user login session
        localStorage.removeItem('userEmail');
        localStorage.removeItem('userPin');
        localStorage.removeItem('userMasjids');
        localStorage.removeItem('userRole');
        localStorage.removeItem('loginSource');
        localStorage.removeItem('addressList');
        localStorage.removeItem('searchParams');
        localStorage.removeItem('areaFilter');
        localStorage.removeItem('activeFilters');
        localStorage.removeItem('landingContext');
        localStorage.removeItem('preferredMasjid');
        sessionStorage.clear();
        navigate('/user-login');
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxWidth: '300px', margin: '2rem auto', padding: '2rem', border: '1px solid #ccc', borderRadius: '8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h2 style={{ margin: 0 }}>{masjidConfig.name}</h2>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                    {localStorage.getItem('userEmail') && (
                        <button onClick={handleUserLogout} style={{ background: 'none', border: 'none', color: '#d32f2f', cursor: 'pointer', padding: 0, fontSize: '0.9rem', fontWeight: 500 }}>
                            Logout
                        </button>
                    )}
                </div>
            </div>
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
            {localStorage.getItem('userEmail') && (() => {
                const userMasjids = JSON.parse(localStorage.getItem('userMasjids') || '[]');
                const currentMasjidSlug = masjidSlug;
                const otherMasjids = userMasjids.filter(m => m !== currentMasjidSlug);
                return otherMasjids.length > 0 ? (
                    <div style={{ padding: '0.75rem', background: '#f5f5f5', borderRadius: '4px', border: '1px solid #ddd' }}>
                        <button 
                            onClick={() => setShowUserMasjids(!showUserMasjids)}
                            style={{ 
                                width: '100%', 
                                display: 'flex', 
                                alignItems: 'center', 
                                justifyContent: 'space-between',
                                background: 'none',
                                border: 'none',
                                padding: 0,
                                cursor: 'pointer',
                                fontSize: '0.9rem',
                                fontWeight: 600,
                                color: '#666'
                            }}
                        >
                            <span>Other Masjids</span>
                            <span style={{ transform: showUserMasjids ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}>▼</span>
                        </button>
                        {showUserMasjids && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', marginTop: '0.5rem' }}>
                                {otherMasjids.map(masjid => (
                                    <a key={masjid} href={`/${masjid}`} style={{ fontSize: '0.9rem', color: '#1976d2', textDecoration: 'none' }}>
                                        → {masjid}
                                    </a>
                                ))}
                            </div>
                        )}
                    </div>
                ) : null;
            })()}
            <button onClick={handleLogin} style={{ padding: '0.5rem' }}>
                Login
            </button>
            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                <StatusBadges showOnMobile={true} />
            </div>
            <p style={{ margin: 0, textAlign: 'center', fontSize: '0.75rem', color: '#aaa' }}>v{version}</p>
        </div>
    );
};

export default MasjidLanding;
