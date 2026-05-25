import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getMasjidByLanding } from '../config';

const MasjidLanding = () => {
    const { masjidSlug } = useParams();
    const navigate = useNavigate();
    
    // Get masjid configuration
    const masjidConfig = getMasjidByLanding(masjidSlug);
    
    // State for unit selection
    const [unitID, setUnitID] = useState(masjidConfig ? masjidConfig.units[0] : '');

    // Handle when masjid slug is not found
    if (!masjidConfig) {
        return (
            <div style={{ textAlign: 'center', marginTop: '80px' }}>
                <h2>Masjid Not Found</h2>
                <p>The masjid '{masjidSlug}' does not exist.</p>
                <button onClick={() => navigate('/login')}>Go to Login</button>
            </div>
        );
    }

    const handleLogin = () => {
        navigate(`/landing/${masjidConfig.id}/${unitID}`, { state: { isLoggedIn: true } });
    };

    return (
        <div style={{ textAlign: 'center', marginTop: '80px' }}>
            <h2>{masjidConfig.name}</h2>
            <div>
                <label>
                    Masjid ID:
                    <input
                        type="number"
                        value={masjidConfig.id}
                        readOnly
                        style={{ background: '#f0f0f0', cursor: 'not-allowed' }}
                    />
                </label>
            </div>
            <div>
                <label>
                    Unit ID:
                    <select 
                        value={unitID} 
                        onChange={e => setUnitID(e.target.value)} 
                        style={{ marginLeft: '0.5rem', width: '80px' }}
                    >
                        {masjidConfig.units.map(u => (
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

export default MasjidLanding;
