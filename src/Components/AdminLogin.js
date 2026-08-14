import React, { useState, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { setAdmin } from '../config';
import { useApiReady, ApiSplash } from '../hooks/useApiReady';

const AdminLogin = () => {
    const [error, setError] = useState('');
    const passwordRef = useRef(null);
    const navigate = useNavigate();
    const location = useLocation();
    const apiReady = useApiReady();

    const ADMIN_PASSWORD = process.env.REACT_APP_ADMIN_PASSWORD;

    if (!apiReady) return <ApiSplash />;

    const handleAdminLogin = () => {
        const entered = passwordRef.current?.value || '';
        if (entered !== ADMIN_PASSWORD) {
            setError('Invalid admin password');
            if (passwordRef.current) passwordRef.current.value = '';
            return;
        }
        setAdmin(true);
        localStorage.setItem('loginSource', 'admin');
        setError('');
        const redirectPath = location.state?.from?.pathname;
        navigate(redirectPath && redirectPath !== '/admin/login' ? redirectPath : '/admin/all', { replace: true });
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxWidth: '300px', margin: '2rem auto', padding: '2rem', border: '1px solid #ccc', borderRadius: '8px' }}>
            <button onClick={() => navigate('/')} style={{ alignSelf: 'flex-start', background: 'none', border: 'none', color: '#1976d2', cursor: 'pointer', padding: 0, fontSize: '0.9rem' }}>← Home</button>
            <h2>Admin Login</h2>
            <form onSubmit={e => { e.preventDefault(); handleAdminLogin(); }} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {/* hidden username satisfies browser credential-manager requirement */}
                <input type="text" name="username" autoComplete="username" defaultValue="admin" style={{ display: 'none' }} />
                <div>
                    <label>
                        Admin Password:
                        <input
                            ref={passwordRef}
                            type="password"
                            name="password"
                            autoComplete="current-password"
                            placeholder="Enter admin password"
                            style={{ width: '100%', marginTop: '0.5rem', padding: '0.5rem' }}
                        />
                    </label>
                </div>
                {error && <div style={{ color: 'red', fontSize: '0.9rem' }}>{error}</div>}
                <button type="submit" style={{ padding: '0.5rem' }}>
                    Markaz Admin Login
                </button>
            </form>
        </div>
    );
};

export default AdminLogin;
