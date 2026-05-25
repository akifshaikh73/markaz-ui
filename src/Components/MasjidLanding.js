import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getMasjidByLanding } from '../config';
import StatusBadges from './StatusBadges';

const MasjidLanding = () => {
    const { masjidSlug } = useParams();
    const navigate = useNavigate();
    
    // Get masjid configuration
    const masjidConfig = getMasjidByLanding(masjidSlug);

    // Restore last selected unit for this masjid if available
    const cachedContext = JSON.parse(localStorage.getItem('landingContext')) || {};
    const lastUnit = cachedContext.masjidID === String(masjidConfig?.id) && cachedContext.unitID
        ? parseInt(cachedContext.unitID)
        : masjidConfig?.units[0];

    // State for unit selection
    const [unitID, setUnitID] = useState(lastUnit || '');

    // Handle when masjid slug is not found
    if (!masjidConfig) {
        return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxWidth: '300px', margin: '2rem auto', padding: '2rem', border: '1px solid #ccc', borderRadius: '8px' }}>
                <h2>Masjid Not Found</h2>
                <p>The masjid '{masjidSlug}' does not exist.</p>
                <button onClick={() => navigate('/masjid-login')} style={{ padding: '0.5rem' }}>Go to Login</button>
            </div>
        );
    }

    const handleLogin = () => {
        navigate(`/landing/${masjidConfig.id}/${unitID}`, { state: { isLoggedIn: true } });
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxWidth: '300px', margin: '2rem auto', padding: '2rem', border: '1px solid #ccc', borderRadius: '8px' }}>
            <h2>{masjidConfig.name}</h2>
            <div>
                <label>
                    Masjid ID:
                    <input
                        type="number"
                        value={masjidConfig.id}
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
                        {masjidConfig.units.map(u => (
                            <option key={u} value={u}>{u}</option>
                        ))}
                    </select>
                </label>
            </div>
            <button onClick={handleLogin} style={{ padding: '0.5rem' }}>
                Login
            </button>
            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                <StatusBadges showOnMobile={true} />
            </div>
        </div>
    );
};

export default MasjidLanding;
