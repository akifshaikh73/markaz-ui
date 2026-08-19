import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { setAdmin } from '../config';

const API_URL = process.env.REACT_APP_API_URL || '';

const inputStyle = { padding: '0.5rem', fontSize: '1rem', borderRadius: '4px', border: '1px solid #ccc', width: '100%', boxSizing: 'border-box' };
const btnStyle = { padding: '0.5rem 1.2rem', borderRadius: '4px', border: 'none', cursor: 'pointer', fontSize: '1rem' };

const MasjidManagement = () => {
    const navigate = useNavigate();
    const [masjids, setMasjids] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [searchId, setSearchId] = useState('');
    const [searchName, setSearchName] = useState('');

    const fetchMasjids = useCallback((nameQuery = '') => {
        setLoading(true);
        setError('');
        const url = nameQuery
            ? `${API_URL}/api/masjids?search=${encodeURIComponent(nameQuery)}`
            : `${API_URL}/api/masjids`;
        fetch(url)
            .then(r => { if (!r.ok) throw new Error(`Server error ${r.status}`); return r.json(); })
            .then(data => setMasjids(data))
            .catch(err => setError(err.message))
            .finally(() => setLoading(false));
    }, []);

    useEffect(() => { fetchMasjids(); }, [fetchMasjids]);

    const handleIdSearch = (e) => {
        e.preventDefault();
        if (!searchId.trim()) return;
        navigate(`/admin/masjids/${searchId.trim()}`);
    };

    const handleNameSearch = (e) => {
        e.preventDefault();
        fetchMasjids(searchName.trim());
    };

    const handleClear = () => {
        setSearchName('');
        fetchMasjids('');
    };

    const handleLogout = () => {
        setAdmin(false);
        localStorage.removeItem('addressList');
        localStorage.removeItem('searchParams');
        localStorage.removeItem('areaFilter');
        localStorage.removeItem('activeFilters');
        localStorage.removeItem('landingContext');
        sessionStorage.clear();
        navigate('/admin/login');
    };

    return (
        <div style={{ maxWidth: '900px', margin: '2rem auto', padding: '0 1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
                <button onClick={() => navigate('/')} style={{ ...btnStyle, background: '#f0f0f0', color: '#333' }}>← Home</button>
                <button onClick={() => navigate(-1)} style={{ ...btnStyle, background: '#f0f0f0', color: '#333' }}>← Back</button>
                <h2 style={{ margin: 0 }}>Masjid Management</h2>
                <button onClick={handleLogout} style={{ ...btnStyle, background: '#d32f2f', color: '#fff', marginLeft: 'auto' }}>Logout</button>
            </div>

            {/* Search by ID */}
            <form onSubmit={handleIdSearch} style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
                <input
                    style={{ ...inputStyle, maxWidth: '200px' }}
                    placeholder="Search by Masjid ID…"
                    value={searchId}
                    onChange={e => setSearchId(e.target.value)}
                />
                <button type="submit" style={{ ...btnStyle, background: '#1976d2', color: '#fff' }}>Go to ID</button>
            </form>

            {/* Search by name */}
            <form onSubmit={handleNameSearch} style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
                <input
                    style={inputStyle}
                    placeholder="Search by name (partial match)…"
                    value={searchName}
                    onChange={e => setSearchName(e.target.value)}
                />
                <button type="submit" style={{ ...btnStyle, background: '#388e3c', color: '#fff' }}>Search</button>
                {searchName && (
                    <button type="button" onClick={handleClear} style={{ ...btnStyle, background: '#f0f0f0', color: '#333' }}>Clear</button>
                )}
            </form>

            {loading && <p style={{ color: '#888' }}>Loading…</p>}
            {error && <p style={{ color: '#d32f2f' }}>Error: {error}</p>}

            {!loading && !error && (
                <>
                    <p style={{ fontSize: '0.9rem', color: '#555', marginBottom: '0.75rem' }}>{masjids.length} masjid{masjids.length !== 1 ? 's' : ''} found</p>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.95rem' }}>
                        <thead>
                            <tr style={{ background: '#f5f5f5', textAlign: 'left' }}>
                                <th style={thStyle}>ID</th>
                                <th style={thStyle}>Name</th>
                                <th style={thStyle}>Landing</th>
                                <th style={thStyle}>Units</th>
                                <th style={thStyle}></th>
                            </tr>
                        </thead>
                        <tbody>
                            {masjids.length === 0 && (
                                <tr><td colSpan={5} style={{ padding: '1rem', color: '#888', textAlign: 'center' }}>No masjids found.</td></tr>
                            )}
                            {masjids.map(m => (
                                <tr key={m._id ?? m.id} style={{ borderBottom: '1px solid #eee' }}>
                                    <td style={tdStyle}>{m._id ?? m.id}</td>
                                    <td style={tdStyle}>{m.name}</td>
                                    <td style={tdStyle}>
                                        {m.landing
                                            ? <a href={`/${m.landing}`} style={{ color: '#1976d2', textDecoration: 'none' }}>/{m.landing}</a>
                                            : '—'}
                                    </td>
                                    <td style={tdStyle}>{Array.isArray(m.units) ? m.units.join(', ') : (m.units ?? '—')}</td>
                                    <td style={tdStyle}>
                                        <button
                                            onClick={() => navigate(`/admin/masjids/${m._id ?? m.id}`)}
                                            style={{ ...btnStyle, background: '#1976d2', color: '#fff', fontSize: '0.85rem', padding: '0.3rem 0.8rem' }}
                                        >
                                            Details
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </>
            )}
        </div>
    );
};

const thStyle = { padding: '0.6rem 0.75rem', fontWeight: 600, borderBottom: '2px solid #ddd' };
const tdStyle = { padding: '0.6rem 0.75rem', verticalAlign: 'middle' };

export default MasjidManagement;
