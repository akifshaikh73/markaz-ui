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
    border: 'none', cursor: 'pointer',
};

const UserLogin = () => {
    const navigate = useNavigate();
    const [pin, setPin] = useState('');
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        const storedEmail = localStorage.getItem('userEmail');
        const storedPin = localStorage.getItem('userPin');
        if (storedPin) {
            verifyAndRedirect(storedPin, storedEmail || '');
        }
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    const verifyAndRedirect = async (pinValue, emailValue) => {
        setLoading(true);
        setError('');
        try {
            const body = { pin: pinValue };
            if (emailValue && emailValue.trim()) body.email = emailValue.trim();

            const response = await fetch(`${API_URL}/api/users/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            });

            const data = await response.json();
            if (!response.ok) throw new Error(data.message || data.error || 'Invalid credentials');

            // Store credentials and role
            localStorage.setItem('userPin', pinValue);
            if (emailValue && emailValue.trim()) localStorage.setItem('userEmail', emailValue.trim());
            localStorage.setItem('loginSource', 'user');

            // Email + PIN login -> MasjidAdmin
            setUserRole('MasjidAdmin');

            // Store list of masjids user has access to
            if (data.masjids && Array.isArray(data.masjids)) {
                localStorage.setItem('userMasjids', JSON.stringify(data.masjids));
            }

            if (data.masjidSlug) {
                navigate(`/${data.masjidSlug}`, { state: { isLoggedIn: true } });
            } else if (data.masjids && data.masjids.length > 0) {
                navigate(`/${data.masjids[0]}`, { state: { isLoggedIn: true } });
            } else {
                setError('No masjid access found for this account');
                localStorage.removeItem('userEmail');
                localStorage.removeItem('userPin');
                setLoading(false);
            }
        } catch (err) {
            setError(err.message || 'Login failed');
            localStorage.removeItem('userEmail');
            localStorage.removeItem('userPin');
            setLoading(false);
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!pin.trim()) { setError('Masjid PIN is required'); return; }
        verifyAndRedirect(pin.trim(), email);
    };

    return (
        <div style={{ maxWidth: '320px', margin: '3rem auto', padding: '2rem', border: '1px solid #e0e0e0', borderRadius: '8px', background: '#fff' }}>
            <h2 style={{ marginTop: 0, marginBottom: '1.5rem' }}>Masjid Login</h2>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

                <div>
                    <label style={{ fontWeight: 600, display: 'block', marginBottom: '0.4rem' }}>
                        Masjid PIN <span style={{ color: '#d32f2f' }}>*</span>
                    </label>
                    <input
                        type="password"
                        value={pin}
                        onChange={e => setPin(e.target.value)}
                        placeholder="Enter your PIN"
                        style={inputStyle}
                        disabled={loading}
                        autoFocus
                    />
                </div>

                <div>
                    <label style={{ fontWeight: 600, display: 'block', marginBottom: '0.4rem' }}>
                        Email ID <span style={{ color: '#999', fontWeight: 400, fontSize: '0.85rem' }}>(optional — for admin access)</span>
                    </label>
                    <input
                        type="email"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        placeholder="Enter email address"
                        style={inputStyle}
                        disabled={loading}
                    />
                </div>

                {error && (
                    <div style={{ padding: '0.75rem', background: '#ffebee', color: '#c62828', borderRadius: '4px', fontSize: '0.9rem' }}>
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

                <button
                    type="button"
                    onClick={() => navigate('/admin/login')}
                    style={{ ...btnStyle, background: 'none', border: '1px solid #ddd', color: '#1976d2' }}
                >
                    Admin Login
                </button>
            </form>
        </div>
    );
};

export default UserLogin;
