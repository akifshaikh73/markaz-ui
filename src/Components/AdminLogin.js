import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { setAdmin } from '../config';

const AdminLogin = () => {
    const [adminPassword, setAdminPassword] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();
    const location = useLocation();

    // Simple password check - in production, this should be done securely on backend
    const ADMIN_PASSWORD = process.env.REACT_APP_ADMIN_PASSWORD;

    const handleAdminLogin = () => {
        if (adminPassword === ADMIN_PASSWORD) {
            setAdmin(true);
            setError('');
            const redirectPath = location.state?.from?.pathname || '/all';
            navigate(redirectPath, { replace: true });
        } else {
            setError('Invalid admin password');
            setAdminPassword('');
        }
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxWidth: '300px', margin: '2rem auto', padding: '2rem', border: '1px solid #ccc', borderRadius: '8px' }}>
            <h2>Admin Login</h2>
            <div>
                <label>
                    Admin Password:
                    <input
                        type="password"
                        value={adminPassword}
                        onChange={e => setAdminPassword(e.target.value)}
                        onKeyPress={e => e.key === 'Enter' && handleAdminLogin()}
                        placeholder="Enter admin password"
                        style={{ width: '100%', marginTop: '0.5rem', padding: '0.5rem' }}
                    />
                </label>
            </div>
            {error && <div style={{ color: 'red', fontSize: '0.9rem' }}>{error}</div>}
            <button onClick={handleAdminLogin} style={{ padding: '0.5rem' }}>
                Login as Admin
            </button>
        </div>
    );
};

export default AdminLogin;
