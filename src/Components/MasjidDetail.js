import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

const API_URL = process.env.REACT_APP_API_URL || '';

const labelStyle = { fontWeight: 600, color: '#555', minWidth: '160px', display: 'inline-block' };
const valueStyle = { color: '#222' };

const Field = ({ label, value }) => (
    <div style={{ display: 'flex', gap: '0.5rem', padding: '0.5rem 0', borderBottom: '1px solid #f0f0f0' }}>
        <span style={labelStyle}>{label}</span>
        <span style={valueStyle}>{value ?? <em style={{ color: '#aaa' }}>—</em>}</span>
    </div>
);

const MasjidDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [masjid, setMasjid] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        setLoading(true);
        setError('');
        fetch(`${API_URL}/api/masjids/${encodeURIComponent(id)}`)
            .then(r => {
                if (r.status === 404) throw new Error(`Masjid "${id}" not found`);
                if (!r.ok) throw new Error(`Server error ${r.status}`);
                return r.json();
            })
            .then(data => setMasjid(data))
            .catch(err => setError(err.message))
            .finally(() => setLoading(false));
    }, [id]);

    return (
        <div style={{ maxWidth: '700px', margin: '2rem auto', padding: '0 1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
                <button
                    onClick={() => navigate('/')}
                    style={{ padding: '0.5rem 1.2rem', borderRadius: '4px', border: 'none', cursor: 'pointer', background: '#f0f0f0', color: '#333', fontSize: '1rem' }}
                >
                    ← Home
                </button>
                <button
                    onClick={() => navigate('/admin/masjids')}
                    style={{ padding: '0.5rem 1.2rem', borderRadius: '4px', border: 'none', cursor: 'pointer', background: '#f0f0f0', color: '#333', fontSize: '1rem' }}
                >
                    ← Masjid List
                </button>
                <h2 style={{ margin: 0 }}>Masjid Details</h2>
            </div>

            {loading && <p style={{ color: '#888' }}>Loading…</p>}
            {error && <p style={{ color: '#d32f2f' }}>Error: {error}</p>}

            {!loading && !error && masjid && (
                <div style={{ border: '1px solid #e0e0e0', borderRadius: '8px', padding: '1.5rem', background: '#fff' }}>
                    <h3 style={{ marginTop: 0, marginBottom: '1rem', color: '#1976d2' }}>{masjid.name}</h3>

                    <Field label="ID" value={masjid._id ?? masjid.id} />
                    <Field label="Name" value={masjid.name} />
                    <Field label="Landing Page URL" value={masjid.landing
                        ? <a href={`/${masjid.landing}`} style={{ color: '#1976d2', textDecoration: 'none' }}>/{masjid.landing}</a>
                        : undefined}
                    />
                    <Field label="Units" value={Array.isArray(masjid.units) ? masjid.units.join(', ') : masjid.units} />

                    {/* Render any remaining fields not already shown */}
                    {Object.entries(masjid)
                        .filter(([k]) => !['_id', 'id', 'name', 'landing', 'units', '_class'].includes(k))
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

export default MasjidDetail;
