import React from 'react';
import { Link } from 'react-router-dom';

const card = {
    border: '1px solid #e0e0e0',
    borderRadius: '8px',
    padding: '1.5rem',
    background: '#fff',
    marginBottom: '1.5rem',
};

const sectionTitle = {
    margin: '0 0 1rem 0',
    fontSize: '1rem',
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    color: '#888',
};

const linkRow = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0.6rem 0',
    borderBottom: '1px solid #f0f0f0',
};

const linkStyle = {
    color: '#1976d2',
    textDecoration: 'none',
    fontWeight: 500,
    fontSize: '1rem',
};

const badge = (color) => ({
    fontSize: '0.7rem',
    padding: '0.2rem 0.5rem',
    borderRadius: '4px',
    background: color,
    color: '#fff',
    fontWeight: 600,
    letterSpacing: '0.04em',
});

const Home = () => (
    <div style={{ maxWidth: '600px', margin: '3rem auto', padding: '0 1rem' }}>
        <h1 style={{ marginBottom: '0.25rem' }}>Markaz Visitation</h1>
        <p style={{ color: '#888', marginTop: 0, marginBottom: '2rem' }}>Select an entry point below.</p>

        {/* Admin */}
        <div style={card}>
            <h2 style={sectionTitle}>Admin</h2>

            <div style={linkRow}>
                <Link to="/masjid-login" style={linkStyle}>Any Masjid Login</Link>
                <span style={badge('#d32f2f')}>Protected</span>
            </div>
            <div style={linkRow}>
                <Link to="/admin/all" style={linkStyle}>Masjid Landing Pages</Link>
                <span style={badge('#d32f2f')}>Protected</span>
            </div>
            <div style={{ ...linkRow, borderBottom: 'none' }}>
                <Link to="/admin/masjids" style={linkStyle}>Masjid Management</Link>
                <span style={badge('#d32f2f')}>Protected</span>
            </div>
        </div>
    </div>
);

export default Home;
