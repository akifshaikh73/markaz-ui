import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { setUserRole } from '../config';

const API_URL = process.env.REACT_APP_API_URL || '';

const inputStyle = {
    padding: '0.5rem', fontSize: '1rem', borderRadius: '4px',
    border: '1px solid #ccc', width: '100%', boxSizing: 'border-box',
};
const btnStyle = {
    padding: '0.75rem', fontSize: '1rem', borderRadius: '4px',
    border: 'none', cursor: 'pointer', width: '100%',
};
const labelStyle = { fontWeight: 600, display: 'block', marginBottom: '0.4rem' };

const MasjidLogin = () => {
    const navigate = useNavigate();

    const [pin, setPin] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        // Session resume: if already logged in, navigate straight to stored masjid
        const storedPin = localStorage.getItem('userPin');
        const loginSource = localStorage.getItem('loginSource');
        const storedSlug = localStorage.getItem('userMasjidSlug');
        
        if (storedPin && loginSource && storedSlug) {
            navigate(`/${storedSlug}`, { replace: true, state: { isLoggedIn: true } });
        }
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    const handlePinLogin = async (pinValue) => {
        setLoading(true);
        setError('');
        try {
            const response = await fetch(`${API_URL}/api/masjids/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ pin: pinValue }),
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.message || data.error || 'Invalid PIN');

            localStorage.setItem('userPin', pinValue);
            localStorage.setItem('loginSource', 'masjid');
            setUserRole('MasjidUser');

            if (data.masjidSlug) {
                localStorage.setItem('userMasjidSlug', data.masjidSlug);
                navigate(`/${data.masjidSlug}`, { state: { isLoggedIn: true } });
            } else {
                throw new Error('Masjid has no login page configured');
            }
        } catch (err) {
            setError(err.message || 'Login failed');
            localStorage.removeItem('userPin');
            setLoading(false);
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!pin.trim()) {
            setError('Masjid PIN is required');
            return;
        }
        handlePinLogin(pin.trim());
    };

    return (
        <div style={{ maxWidth: '340px', margin: '3rem auto', padding: '0 1rem' }}>
            <div style={{ padding: '1.75rem', border: '1px solid #e0e0e0', borderRadius: '8px', background: '#fff' }}>
                <h2 style={{ marginTop: 0, marginBottom: '1.25rem', fontSize: '1.2rem' }}>Masjid Login</h2>
                
                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div>
                        <label style={labelStyle}>
                            Masjid PIN <span style={{ color: '#d32f2f' }}>*</span>
                        </label>
                        <input
                            type="password"
                            value={pin}
                            onChange={e => setPin(e.target.value)}
                            placeholder="Enter Masjid PIN"
                            style={inputStyle}
                            disabled={loading}
                            autoFocus
                        />
                    </div>
                    {error && (
                        <div style={{ padding: '0.6rem 0.75rem', background: '#ffebee', color: '#c62828', borderRadius: '4px', fontSize: '0.9rem' }}>
                            {error}
                        </div>
                    )}
                    <button
                        type="submit"
                        disabled={loading}
                        style={{ ...btnStyle, background: '#1976d2', color: '#fff', opacity: loading ? 0.6 : 1, cursor: loading ? 'not-allowed' : 'pointer' }}
                    >
                        {loading ? 'Logging in...' : 'Login'}
                    </button>
                </form>

                <div style={{ marginTop: '1.25rem', paddingTop: '1.25rem', borderTop: '1px solid #eee', textAlign: 'center', fontSize: '0.9rem', color: '#666' }}>
                    <a href="/user-login" style={{ color: '#1976d2', textDecoration: 'none', fontWeight: 600 }}>Masjid Admin Login →</a>
                </div>
            </div>
        </div>
    );
};

export default MasjidLogin;
