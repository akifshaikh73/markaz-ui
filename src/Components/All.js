import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { MASJID_CONFIG, setAdmin } from '../config';

const All = () => {
    const navigate = useNavigate();

    const handleLogout = () => {
        setAdmin(false);
        localStorage.removeItem('addressList');
        localStorage.removeItem('searchParams');
        localStorage.removeItem('areaFilter');
        localStorage.removeItem('activeFilters');
        localStorage.removeItem('landingContext');
        localStorage.removeItem('loginSource');
        sessionStorage.clear();
        navigate('/admin/login');
    };
    if (!MASJID_CONFIG.length) {
        return (
            <div style={{ maxWidth: '700px', margin: '3rem auto', padding: '0 1rem' }}>
                <h2>No Masjid Landing Pages Configured</h2>
            </div>
        );
    }

    return (
        <div style={{ maxWidth: '700px', margin: '3rem auto', padding: '0 1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <Link to="/" style={{ fontSize: '0.9rem', color: '#1976d2', textDecoration: 'none' }}>← Home</Link>
                <button onClick={handleLogout} style={{ background: 'none', border: 'none', color: '#d32f2f', cursor: 'pointer', fontSize: '0.9rem', padding: 0 }}>Logout</button>
            </div>
            <h1 style={{ marginBottom: '0.25rem' }}>Masjid Quick Access</h1>
            <p style={{ color: '#888', marginTop: 0, marginBottom: '2rem' }}>Select a masjid to view its address list.</p>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                    <tr style={{ borderBottom: '2px solid #e0e0e0', textAlign: 'left' }}>
                        <th style={{ padding: '0.6rem 0.75rem', color: '#888', fontWeight: 600, fontSize: '0.8rem', textTransform: 'uppercase' }}>Name</th>
                        <th style={{ padding: '0.6rem 0.75rem', color: '#888', fontWeight: 600, fontSize: '0.8rem', textTransform: 'uppercase' }}>ID</th>
                        <th style={{ padding: '0.6rem 0.75rem', color: '#888', fontWeight: 600, fontSize: '0.8rem', textTransform: 'uppercase' }}>Landing Route</th>
                    </tr>
                </thead>
                <tbody>
                    {MASJID_CONFIG.map((masjid, i) => (
                        <tr
                            key={masjid.id}
                            style={{ borderBottom: i === MASJID_CONFIG.length - 1 ? 'none' : '1px solid #f0f0f0' }}
                        >
                            <td style={{ padding: '0.75rem' }}>
                                <Link
                                    to={`/landing/${masjid.id}/all`}
                                    style={{ color: '#1976d2', textDecoration: 'none', fontWeight: 500 }}
                                    state={{ isLoggedIn: true }}
                                >
                                    {masjid.name}
                                </Link>
                            </td>
                            <td style={{ padding: '0.75rem', color: '#555', fontFamily: 'monospace' }}>{masjid.id}</td>
                            <td style={{ padding: '0.75rem' }}>
                                <Link
                                    to={`/${masjid.landing}`}
                                    style={{ color: '#aaa', textDecoration: 'none', fontSize: '0.9rem' }}
                                >
                                    /{masjid.landing}
                                </Link>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default All;
