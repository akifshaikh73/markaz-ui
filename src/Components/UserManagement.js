import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { setAdmin } from '../config';

const API_URL = process.env.REACT_APP_API_URL || '';

const inputStyle = { padding: '0.5rem', fontSize: '1rem', borderRadius: '4px', border: '1px solid #ccc', width: '100%', boxSizing: 'border-box' };
const btnStyle = { padding: '0.5rem 1.2rem', borderRadius: '4px', border: 'none', cursor: 'pointer', fontSize: '1rem' };
const thStyle = { padding: '0.6rem 0.75rem', fontWeight: 600, borderBottom: '2px solid #ddd', whiteSpace: 'nowrap' };
const tdStyle = { padding: '0.6rem 0.75rem', verticalAlign: 'middle' };

const EnabledBadge = ({ enabled }) => (
    <span style={{
        display: 'inline-block',
        padding: '0.2rem 0.6rem',
        borderRadius: '4px',
        fontSize: '0.8rem',
        fontWeight: 600,
        background: enabled ? '#e8f5e9' : '#fce4ec',
        color: enabled ? '#2e7d32' : '#c62828',
    }}>
        {enabled ? 'Active' : 'Disabled'}
    </span>
);

const ROLE_MAP = {
    '5cae3937918e273ab8e131d6': 'USER',
    '5cae3937918e273ab8e131d5': 'ADMIN',
};

const resolveRole = (roles) => {
    if (!Array.isArray(roles) || roles.length === 0) return '—';
    return roles.map(r => {
        const oid = r?.$id?.$oid ?? r?.$id ?? r?.id ?? (typeof r === 'string' ? r : null);
        return (oid && ROLE_MAP[oid]) || r?.name || r?.roleName || String(oid ?? JSON.stringify(r));
    }).join(', ');
};

const UserManagement = () => {
    const navigate = useNavigate();
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [searchText, setSearchText] = useState('');
    const [filterMasjidId, setFilterMasjidId] = useState('');

    const fetchUsers = useCallback((text = '', masjidId = '') => {
        setLoading(true);
        setError('');
        const params = new URLSearchParams();
        if (text) params.set('search', text);
        if (masjidId) params.set('masjidId', masjidId);
        const qs = params.toString();
        fetch(`${API_URL}/api/users${qs ? `?${qs}` : ''}`)
            .then(r => { if (!r.ok) throw new Error(`Server error ${r.status}`); return r.json(); })
            .then(data => setUsers(data))
            .catch(err => setError(err.message))
            .finally(() => setLoading(false));
    }, []);

    useEffect(() => { fetchUsers(); }, [fetchUsers]);

    const handleSearch = (e) => {
        e.preventDefault();
        fetchUsers(searchText.trim(), filterMasjidId.trim());
    };

    const handleClear = () => {
        setSearchText('');
        setFilterMasjidId('');
        fetchUsers('', '');
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
        <div style={{ maxWidth: '1100px', margin: '2rem auto', padding: '0 1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
                <button onClick={() => navigate('/admin-home')} style={{ ...btnStyle, background: '#f0f0f0', color: '#333' }}>← Home</button>
                <button onClick={() => navigate(-1)} style={{ ...btnStyle, background: '#f0f0f0', color: '#333' }}>← Back</button>
                <h2 style={{ margin: 0 }}>User Management</h2>
                <button onClick={handleLogout} style={{ ...btnStyle, background: '#d32f2f', color: '#fff', marginLeft: 'auto' }}>Logout</button>
            </div>

            <form onSubmit={handleSearch} style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
                <input
                    style={{ ...inputStyle, flex: '2', minWidth: '180px' }}
                    placeholder="Search by email, first or last name…"
                    value={searchText}
                    onChange={e => setSearchText(e.target.value)}
                />
                <input
                    style={{ ...inputStyle, flex: '0 0 130px' }}
                    placeholder="Masjid ID filter"
                    value={filterMasjidId}
                    onChange={e => setFilterMasjidId(e.target.value)}
                    type="number"
                />
                <button type="submit" style={{ ...btnStyle, background: '#388e3c', color: '#fff' }}>Search</button>
                {(searchText || filterMasjidId) && (
                    <button type="button" onClick={handleClear} style={{ ...btnStyle, background: '#f0f0f0', color: '#333' }}>Clear</button>
                )}
            </form>

            {loading && <p style={{ color: '#888' }}>Loading…</p>}
            {error && <p style={{ color: '#d32f2f' }}>Error: {error}</p>}

            {!loading && !error && (
                <>
                    <p style={{ fontSize: '0.9rem', color: '#555', marginBottom: '0.75rem' }}>
                        {users.length} user{users.length !== 1 ? 's' : ''} found
                    </p>
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.92rem' }}>
                            <thead>
                                <tr style={{ background: '#f5f5f5', textAlign: 'left' }}>
                                    <th style={thStyle}>Email</th>
                                    <th style={thStyle}>Name</th>
                                    <th style={thStyle}>Status</th>
                                    <th style={thStyle}>Masjid ID</th>
                                    <th style={thStyle}>Role</th>
                                    <th style={thStyle}></th>
                                </tr>
                            </thead>
                            <tbody>
                                {users.length === 0 && (
                                    <tr><td colSpan={6} style={{ padding: '1rem', color: '#888', textAlign: 'center' }}>No users found.</td></tr>
                                )}
                                {users.map(u => (
                                    <tr key={String(u._id?.$oid ?? u._id)} style={{ borderBottom: '1px solid #eee' }}>
                                        <td style={tdStyle}>{u.email}</td>
                                        <td style={{ ...tdStyle, whiteSpace: 'nowrap' }}>{u.firstName} {u.lastName}</td>
                                        <td style={tdStyle}><EnabledBadge enabled={u.enabled} /></td>
                                        <td style={tdStyle}>
                                            {u.masjidId != null
                                                ? <button
                                                    onClick={() => navigate(`/admin/masjids/${u.masjidId}`)}
                                                    style={{ background: 'none', border: 'none', color: '#1976d2', cursor: 'pointer', padding: 0, fontSize: '0.92rem', textDecoration: 'underline' }}
                                                  >{u.masjidId}</button>
                                                : '—'}
                                        </td>
                                        <td style={tdStyle}>{resolveRole(u.roles)}</td>
                                        <td style={tdStyle}>
                                            <button
                                                onClick={() => navigate(`/admin/users/${encodeURIComponent(String(u._id?.$oid ?? u._id))}`)}
                                                style={{ ...btnStyle, background: '#1976d2', color: '#fff', fontSize: '0.85rem', padding: '0.3rem 0.8rem' }}
                                            >
                                                Details
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </>
            )}
        </div>
    );
};

export default UserManagement;
