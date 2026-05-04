import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const Login = ({ lockedMasjidID, unitOptions }) => {
    const [masjidID, setMasjidID] = useState(lockedMasjidID || 156);
    const [unitID, setUnitID] = useState(unitOptions ? unitOptions[0] : 1);

    const navigate = useNavigate();

    const handleLogin = () => {
        navigate(`/landing/${masjidID}/${unitID}`, { state: { isLoggedIn: true } });
    };

    return (
        <div>
            <label>
                Masjid ID:
                <input
                    type="number"
                    value={masjidID}
                    onChange={e => setMasjidID(e.target.value)}
                    readOnly={!!lockedMasjidID}
                    style={lockedMasjidID ? { background: '#f0f0f0', cursor: 'not-allowed' } : {}}
                />
            </label>
            <label>
                Unit ID:
                {unitOptions ? (
                    <select value={unitID} onChange={e => setUnitID(e.target.value)}>
                        {unitOptions.map(u => (
                            <option key={u} value={u}>{u}</option>
                        ))}
                    </select>
                ) : (
                    <input type="number" value={unitID} onChange={e => setUnitID(e.target.value)} />
                )}
            </label>
            <button onClick={handleLogin} disabled={!masjidID || !unitID}>
                Login
            </button>
        </div>
    );
};

export default Login;