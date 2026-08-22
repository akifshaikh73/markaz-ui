import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

const API_URL = process.env.REACT_APP_API_URL || '';

const labelStyle = { fontWeight: 600, color: '#555', minWidth: '180px', display: 'inline-block' };
const valueStyle = { color: '#222' };
const btnStyle = { padding: '0.5rem 1.2rem', borderRadius: '4px', border: 'none', cursor: 'pointer', fontSize: '1rem' };

const Field = ({ label, value }) => (
    <div style={{ display: 'flex', gap: '0.5rem', padding: '0.5rem 0', borderBottom: '1px solid #f0f0f0' }}>
        <span style={labelStyle}>{label}</span>
        <span style={valueStyle}>{value ?? <em style={{ color: '#aaa' }}>—</em>}</span>
    </div>
);

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
    if (!Array.isArray(roles) || roles.length === 0) return null;
    return roles.map(r => {
        const oid = r?.$id?.$oid ?? r?.$id ?? r?.id ?? (typeof r === 'string' ? r : null);
        return (oid && ROLE_MAP[oid]) || r?.name || r?.roleName || String(oid ?? JSON.stringify(r));
    }).join(', ');
};

function generatePin(digits = 4) {
    return String(Math.floor(Math.random() * Math.pow(10, digits))).padStart(digits, '0');
}

const PasswordResetModal = ({ userId, onClose }) => {
    const [pin, setPin] = useState(() => generatePin());
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [error, setError] = useState('');

    const handleReset = useCallback(() => {
        if (!pin.trim()) return;
        setSaving(true);
        setError('');
        fetch(`${API_URL}/api/users/${encodeURIComponent(userId)}/password`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ password: pin.trim() }),
        })
            .then(r => { if (!r.ok) throw new Error(`Server error ${r.status}`); return r.json(); })
            .then(() => setSaved(true))
            .catch(err => setError(err.message))
            .finally(() => setSaving(false));
    }, [userId, pin]);

    return (
        <div style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
        }} onClick={onClose}>
            <div style={{
                background: '#fff', borderRadius: '8px', padding: '2rem', width: '340px',
                boxShadow: '0 4px 24px rgba(0,0,0,0.18)',
            }} onClick={e => e.stopPropagation()}>
                <h3 style={{ marginTop: 0 }}>Reset Password</h3>

                {!saved ? (
                    <>
                        <p style={{ fontSize: '0.9rem', color: '#555', margin: '0 0 1rem' }}>
                            A 4-digit PIN has been generated. You can edit it before saving.
                        </p>
                        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
                            <input
                                value={pin}
                                onChange={e => setPin(e.target.value)}
                                style={{ flex: 1, padding: '0.5rem', fontSize: '1.2rem', letterSpacing: '0.2em', borderRadius: '4px', border: '1px solid #ccc', textAlign: 'center' }}
                                maxLength={20}
                            />
                            <button
                                type="button"
                                onClick={() => setPin(generatePin())}
                                style={{ ...btnStyle, background: '#f0f0f0', color: '#333', fontSize: '0.85rem', whiteSpace: 'nowrap' }}
                            >&#x21BB; New PIN</button>
                        </div>
                        {error && <p style={{ color: '#d32f2f', fontSize: '0.9rem', margin: '0 0 0.75rem' }}>{error}</p>}
                        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                            <button onClick={onClose} style={{ ...btnStyle, background: '#f0f0f0', color: '#333' }}>Cancel</button>
                            <button
                                onClick={handleReset}
                                disabled={saving || !pin.trim()}
                                style={{ ...btnStyle, background: '#d32f2f', color: '#fff', opacity: saving ? 0.7 : 1 }}
                            >{saving ? 'Saving...' : 'Save Password'}</button>
                        </div>
                    </>
                ) : (
                    <>
                        <p style={{ color: '#2e7d32', fontWeight: 600, marginBottom: '0.5rem' }}>Password updated successfully.</p>
                        <p style={{ fontSize: '0.9rem', color: '#555', margin: '0 0 1.25rem' }}>
                            Share this PIN with the user: <strong style={{ fontSize: '1.1rem', letterSpacing: '0.15em' }}>{pin}</strong>
                        </p>
                        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                            <button onClick={onClose} style={{ ...btnStyle, background: '#1976d2', color: '#fff' }}>Close</button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

const UserDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [showReset, setShowReset] = useState(false);

    useEffect(() => {
        setLoading(true);
        setError('');
        fetch(`${API_URL}/api/users/${encodeURIComponent(id)}`)
            .then(r => {
                if (r.status === 404) throw new Error(`User "${id}" not found`);
                if (!r.ok) throw new Error(`Server error ${r.status}`);
                return r.json();
            })
            .then(data => setUser(data))
            .catch(err => setError(err.message))
            .finally(() => setLoading(false));
    }, [id]);

    const userId = user ? String(user._id?.$oid ?? user._id) : id;

    return (
        <div style={{ maxWidth: '700px', margin: '2rem auto', padding: '0 1rem' }}>
            {showReset && <PasswordResetModal userId={userId} onClose={() => setShowReset(false)} />}

            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
                <button onClick={() => navigate('/')} style={{ ...btnStyle, background: '#f0f0f0', color: '#333' }}>Home</button>
                <button onClick={() => navigate('/admin/users')} style={{ ...btnStyle, background: '#f0f0f0', color: '#333' }}>User List</button>
                <h2 style={{ margin: 0 }}>User Details</h2>
            </div>

            {loading && <p style={{ color: '#888' }}>Loading...</p>}
            {error && <p style={{ color: '#d32f2f' }}>Error: {error}</p>}

            {!loading && !error && user && (
                <div style={{ border: '1px solid #e0e0e0', borderRadius: '8px', padding: '1.5rem', background: '#fff' }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '1rem' }}>
                        <h3 style={{ margin: 0, color: '#1976d2' }}>{user.firstName} {user.lastName}</h3>
                        <button
                            onClick={() => setShowReset(true)}
                            style={{ ...btnStyle, background: '#f57c00', color: '#fff', fontSize: '0.9rem', padding: '0.4rem 1rem' }}
                        >Reset Password</button>
                    </div>

                    <Field label="Email" value={user.email} />
                    <Field label="First Name" value={user.firstName} />
                    <Field label="Last Name" value={user.lastName} />
                    <Field label="Status" value={<EnabledBadge enabled={user.enabled} />} />
                    <Field
                        label="Masjid ID"
                        value={user.masjidId != null
                            ? <button
                                onClick={() => navigate(`/admin/masjids/${user.masjidId}`)}
                                style={{ background: 'none', border: 'none', color: '#1976d2', cursor: 'pointer', padding: 0, fontSize: '1rem', textDecoration: 'underline' }}
                              >{user.masjidId}</button>
                            : undefined}
                    />
                    <Field
                        label="Access To Masjid IDs"
                        value={Array.isArray(user.accessToMasjidIds) && user.accessToMasjidIds.length > 0
                            ? user.accessToMasjidIds.join(', ')
                            : undefined}
                    />
                    <Field label="Role" value={resolveRole(user.roles)} />

                    {Object.entries(user)
                        .filter(([k]) => !['_id', 'email', 'firstName', 'lastName', 'enabled', 'masjidId', 'accessToMasjidIds', 'roles', '_class', 'password'].includes(k))
                        .map(([k, v]) => (
                            <Field
                                key={k}
                                label={k}
                                value={typeof v === 'object' && v !== null ? JSON.stringify(v) : String(v)}
                            />
                        ))}
                </div>
            )}
        </div>
    );
};

export default UserDetail;
