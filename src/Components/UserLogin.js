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

const UserLogin = () => {
    const navigate = useNavigate();

    // Masjid PIN section state
    const [masjidPin, setMasjidPin] = useState('');
    const [masjidLoading, setMasjidLoading] = useState(false);
    const [masjidError, setMasjidError] = useState('');

    // Admin login section state
    const [showAdmin, setShowAdmin] = useState(false);
    const [adminEmail, setAdminEmail] = useState('');
    const [adminPin, setAdminPin] = useState('');
    const [adminLoading, setAdminLoading] = useState(false);
    const [adminError, setAdminError] = useState('');

    useEffect(() => {
        const storedPin = localStorage.getItem('userPin');
        const loginSource = localStorage.getItem('loginSource');
        const storedSlug = localStorage.getItem('userMasjidSlug');
        // Resume session: navigate straight to the stored slug without re-calling the API
        if (storedPin && loginSource && storedSlug) {
            navigate(`/${storedSlug}`, { replace: true, state: { isLoggedIn: true } });
        }
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    const handleMasjidPinLogin = async (pinValue) => {
        setMasjidLoading(true);
        setMasjidError('');
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
            setMasjidError(err.message || 'Login failed');
            localStorage.removeItem('userPin');
            setMasjidLoading(false);
        }
    };

    const handleAdminLogin = async (emailValue, pinValue) => {
        setAdminLoading(true);
        setAdminError('');
        try {
            const response = await fetch(`${API_URL}/api/users/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: emailValue.trim(), pin: pinValue }),
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.message || data.error || 'Invalid credentials');

            localStorage.setItem('userPin', pinValue);
            localStorage.setItem('userEmail', emailValue.trim());
            localStorage.setItem('loginSource', 'user');
            setUserRole('MasjidAdmin');
            if (data.masjids && Array.isArray(data.masjids)) {
                localStorage.setItem('userMasjids', JSON.stringify(data.masjids));
            }

            const slug = data.masjidSlug || (data.masjids && data.masjids[0]);
            if (slug) {
                localStorage.setItem('userMasjidSlug', slug);
                navigate(`/${slug}`, { state: { isLoggedIn: true } });
            } else {
                throw new Error('No masjid access found for this account');
            }
        } catch (err) {
            setAdminError(err.message || 'Login failed');
            localStorage.removeItem('userPin');
            localStorage.removeItem('userEmail');
            setAdminLoading(false);
        }
    };

    const handleMasjidSubmit = (e) => {
        e.preventDefault();
        if (!masjidPin.trim()) { setMasjidError('Masjid PIN is required'); return; }
        handleMasjidPinLogin(masjidPin.trim());
    };

    const handleAdminSubmit = (e) => {
        e.preventDefault();
        if (!adminEmail.trim()) { setAdminError('Email is required'); return; }
        if (!adminPin.trim()) { setAdminError('PIN is required'); return; }
        handleAdminLogin(adminEmail, adminPin.trim());
    };

    const loading = masjidLoading || adminLoading;

    return (
        <div style={{ maxWidth: '340px', margin: '3rem auto', padding: '0 1rem' }}>

            {/* ── Section 1: Masjid PIN ── */}
            <div style={{ padding: '1.75rem', border: '1px solid #e0e0e0', borderRadius: '8px', background: '#fff', marginBottom: '1rem' }}>
                <h2 style={{ marginTop: 0, marginBottom: '1.25rem', fontSize: '1.2rem' }}>Masjid Login</h2>
                <form onSubmit={handleMasjidSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div>
                        <label style={labelStyle}>
                            Masjid PIN <span style={{ color: '#d32f2f' }}>*</span>
                        </label>
                        <input
                            type="password"
                            value={masjidPin}
                            onChange={e => setMasjidPin(e.target.value)}
                            placeholder="Enter Masjid PIN"
                            style={inputStyle}
                            disabled={loading}
                            autoFocus
                        />
                    </div>
                    {masjidError && (
                        <div style={{ padding: '0.6rem 0.75rem', background: '#ffebee', color: '#c62828', borderRadius: '4px', fontSize: '0.9rem' }}>
                            {masjidError}
                        </div>
                    )}
                    <button
                        type="submit"
                        disabled={loading}
                        style={{ ...btnStyle, background: '#1976d2', color: '#fff', opacity: masjidLoading ? 0.6 : 1, cursor: masjidLoading ? 'not-allowed' : 'pointer' }}
                    >
                        {masjidLoading ? 'Logging in...' : 'Login'}
                    </button>
                </form>
            </div>

            {/* ── Section 2: Masjid Admin Login (expandable) ── */}
            <div style={{ border: '1px solid #e0e0e0', borderRadius: '8px', background: '#fff', overflow: 'hidden' }}>
                <button
                    type="button"
                    onClick={() => { setShowAdmin(v => !v); setAdminError(''); }}
                    style={{
                        width: '100%', padding: '0.9rem 1.25rem', background: showAdmin ? '#f5f5f5' : '#fff',
                        border: 'none', cursor: 'pointer', display: 'flex', justifyContent: 'space-between',
                        alignItems: 'center', fontSize: '0.95rem', fontWeight: 600, color: '#333',
                    }}
                >
                    <span>Masjid Admin Login</span>
                    <span style={{ fontSize: '0.75rem', transform: showAdmin ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>▼</span>
                </button>

                {showAdmin && (
                    <form onSubmit={handleAdminSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', padding: '1.25rem', borderTop: '1px solid #eee' }}>
                        <div>
                            <label style={labelStyle}>
                                Email ID <span style={{ color: '#d32f2f' }}>*</span>
                            </label>
                            <input
                                type="email"
                                value={adminEmail}
                                onChange={e => setAdminEmail(e.target.value)}
                                placeholder="Enter email address"
                                style={inputStyle}
                                disabled={loading}
                                autoFocus
                            />
                        </div>
                        <div>
                            <label style={labelStyle}>
                                User PIN <span style={{ color: '#d32f2f' }}>*</span>
                            </label>
                            <input
                                type="password"
                                value={adminPin}
                                onChange={e => setAdminPin(e.target.value)}
                                placeholder="Enter User PIN"
                                style={inputStyle}
                                disabled={loading}
                            />
                        </div>
                        {adminError && (
                            <div style={{ padding: '0.6rem 0.75rem', background: '#ffebee', color: '#c62828', borderRadius: '4px', fontSize: '0.9rem' }}>
                                {adminError}
                            </div>
                        )}
                        <button
                            type="submit"
                            disabled={loading}
                            style={{ ...btnStyle, background: '#388e3c', color: '#fff', opacity: adminLoading ? 0.6 : 1, cursor: adminLoading ? 'not-allowed' : 'pointer' }}
                        >
                            {adminLoading ? 'Logging in...' : 'Admin Login'}
                        </button>
                    </form>
                )}
            </div>

        </div>
    );
};

export default UserLogin;
