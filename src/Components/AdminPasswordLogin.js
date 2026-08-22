import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { setUserRole, ADMIN_PASSWORD } from '../config';

const AdminPasswordLogin = () => {
    const navigate = useNavigate();
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = (e) => {
        e.preventDefault();
        setError('');

        if (!password.trim()) {
            setError('Password is required');
            return;
        }

        setLoading(true);

        // Simulate a small delay for authentication
        setTimeout(() => {
            if (password === ADMIN_PASSWORD) {
                // Set admin role and redirect to home
                setUserRole('MarkazAdmin');
                navigate('/admin-home', { replace: true });
            } else {
                setError('Invalid admin password');
                setLoading(false);
            }
        }, 300);
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxWidth: '300px', margin: '2rem auto', padding: '2rem', border: '1px solid #ccc', borderRadius: '8px' }}>
            <h2 style={{ marginTop: 0 }}>Admin Login</h2>
            <p style={{ color: '#666', fontSize: '0.9rem', margin: 0 }}>Enter the Markaz admin password to access the admin dashboard.</p>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div>
                    <label style={{ fontWeight: 600, marginBottom: '0.5rem', display: 'block' }}>
                        Admin Password
                    </label>
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Enter admin password"
                        style={{ padding: '0.5rem', fontSize: '1rem', borderRadius: '4px', border: '1px solid #ccc', width: '100%', boxSizing: 'border-box' }}
                        disabled={loading}
                        autoFocus
                    />
                </div>

                {error && <div style={{ color: '#d32f2f', fontSize: '0.9rem', padding: '0.5rem', background: '#ffebee', borderRadius: '4px' }}>{error}</div>}

                <button
                    type="submit"
                    disabled={loading}
                    style={{ padding: '0.75rem', fontSize: '1rem', fontWeight: 600, backgroundColor: '#1976d2', color: '#fff', border: 'none', borderRadius: '4px', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1 }}
                >
                    {loading ? 'Logging in...' : 'Login'}
                </button>
            </form>

            <div style={{ marginTop: '1rem', textAlign: 'center' }}>
                <button
                    type="button"
                    onClick={() => navigate('/user-login')}
                    style={{ background: 'none', border: 'none', color: '#1976d2', cursor: 'pointer', fontSize: '0.9rem', textDecoration: 'underline' }}
                >
                    Back to user login
                </button>
            </div>
        </div>
    );
};

export default AdminPasswordLogin;
