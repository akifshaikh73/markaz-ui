import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const UserLogin = () => {
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [pin, setPin] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const API_URL = process.env.REACT_APP_API_URL || '';

    useEffect(() => {
        // Check if user already has valid stored credentials
        const storedEmail = localStorage.getItem('userEmail');
        const storedPin = localStorage.getItem('userPin');
        if (storedEmail && storedPin) {
            verifyAndRedirect(storedEmail, storedPin);
        }
    }, []);

    const verifyAndRedirect = async (email, pin) => {
        try {
            setLoading(true);
            const response = await fetch(`${API_URL}/api/users/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, pin }),
            });

            const data = await response.json();
            
            if (!response.ok) {
                console.error('[UserLogin] API Error:', data);
                throw new Error(data.message || data.error || 'Invalid credentials');
            }

            console.log('[UserLogin] Login successful:', data);
            
            // Store credentials for future logins
            localStorage.setItem('userEmail', email);
            localStorage.setItem('userPin', pin);
            localStorage.setItem('loginSource', 'user');

            // Store list of masjids user has access to
            if (data.masjids && Array.isArray(data.masjids)) {
                localStorage.setItem('userMasjids', JSON.stringify(data.masjids));
            }

            // Redirect to user's masjid landing page
            if (data.masjidSlug) {
                navigate(`/${data.masjidSlug}`, { state: { isLoggedIn: true } });
            } else if (data.masjids && data.masjids.length > 0) {
                // If multiple masjids, redirect to first one
                navigate(`/${data.masjids[0]}`, { state: { isLoggedIn: true } });
            } else {
                setError('No masjid access found for this user');
                localStorage.removeItem('userEmail');
                localStorage.removeItem('userPin');
                localStorage.removeItem('userMasjids');
            }
        } catch (err) {
            console.error('[UserLogin] Error:', err);
            setError(err.message || 'Login failed');
            setLoading(false);
            localStorage.removeItem('userEmail');
            localStorage.removeItem('userPin');
            localStorage.removeItem('userMasjids');
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        setError('');
        
        if (!email.trim()) {
            setError('Email is required');
            return;
        }
        if (!pin.trim()) {
            setError('PIN is required');
            return;
        }

        verifyAndRedirect(email.trim(), pin);
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxWidth: '300px', margin: '2rem auto', padding: '2rem', border: '1px solid #ccc', borderRadius: '8px' }}>
            <h2 style={{ marginTop: 0 }}>User Login</h2>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div>
                    <label style={{ fontWeight: 600, marginBottom: '0.5rem', display: 'block' }}>
                        Email
                    </label>
                    <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="Enter email address"
                        style={{ padding: '0.5rem', fontSize: '1rem', borderRadius: '4px', border: '1px solid #ccc', width: '100%', boxSizing: 'border-box' }}
                        disabled={loading}
                    />
                </div>

                <div>
                    <label style={{ fontWeight: 600, marginBottom: '0.5rem', display: 'block' }}>
                        PIN (Password)
                    </label>
                    <input
                        type="password"
                        value={pin}
                        onChange={(e) => setPin(e.target.value)}
                        placeholder="Enter PIN"
                        style={{ padding: '0.5rem', fontSize: '1rem', borderRadius: '4px', border: '1px solid #ccc', width: '100%', boxSizing: 'border-box' }}
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
                    style={{
                        padding: '0.75rem',
                        fontSize: '1rem',
                        borderRadius: '4px',
                        border: 'none',
                        background: '#1976d2',
                        color: '#fff',
                        cursor: loading ? 'not-allowed' : 'pointer',
                        opacity: loading ? 0.6 : 1,
                    }}
                >
                    {loading ? 'Logging in...' : 'Login'}
                </button>

                <button
                    type="button"
                    onClick={() => navigate('/masjid-login')}
                    style={{
                        padding: '0.75rem',
                        fontSize: '1rem',
                        borderRadius: '4px',
                        border: '1px solid #ddd',
                        background: 'none',
                        color: '#1976d2',
                        cursor: 'pointer',
                    }}
                >
                    Login as Admin
                </button>
            </form>
        </div>
    );
};

export default UserLogin;
