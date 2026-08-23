import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

const API_URL = process.env.REACT_APP_API_URL || '';

const labelStyle = { fontWeight: 600, color: '#555', minWidth: '160px', display: 'inline-block' };
const valueStyle = { color: '#222' };
const btnStyle = { padding: '0.5rem 1.2rem', borderRadius: '4px', border: 'none', cursor: 'pointer', fontSize: '1rem' };
const inputStyle = { padding: '0.3rem 0.5rem', border: '1px solid #bbb', borderRadius: '4px', fontSize: '0.95rem', minWidth: '180px' };

const Field = ({ label, value }) => (
    <div style={{ display: 'flex', gap: '0.5rem', padding: '0.5rem 0', borderBottom: '1px solid #f0f0f0' }}>
        <span style={labelStyle}>{label}</span>
        <span style={valueStyle}>{value ?? <em style={{ color: '#aaa' }}>--</em>}</span>
    </div>
);

const ADDRESS_FIELDS = ['address', 'city', 'state', 'zipcode'];

const MasjidDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [masjid, setMasjid] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [pin, setPin] = useState(null);
    const [pinResetting, setPinResetting] = useState(false);
    const [pinResetMsg, setPinResetMsg] = useState('');
    const [pinEditMode, setPinEditMode] = useState(false);
    const [pinEditValue, setPinEditValue] = useState('');
    const [pinSaving, setPinSaving] = useState(false);

    // Address editing state
    const [addrEdit, setAddrEdit] = useState(false);
    const [addrFields, setAddrFields] = useState({ address: '', city: '', state: '', zipcode: '' });
    const [addrSaving, setAddrSaving] = useState(false);
    const [addrMsg, setAddrMsg] = useState('');

    // Autocomplete state
    const [suggestions, setSuggestions] = useState([]);
    const [suggLoading, setSuggLoading] = useState(false);
    const [locLoading, setLocLoading] = useState(false);
    const suggTimer = useRef(null);

    // Forward-geocode as user types street address
    const handleAddressInput = (val) => {
        setAddrFields(f => ({ ...f, address: val }));
        setSuggestions([]);
        clearTimeout(suggTimer.current);
        if (val.trim().length < 4) return;
        suggTimer.current = setTimeout(() => {
            setSuggLoading(true);
            fetch(`https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&limit=5&q=${encodeURIComponent(val)}`, {
                headers: { 'Accept-Language': 'en' }
            })
                .then(r => r.json())
                .then(results => setSuggestions(results || []))
                .catch(() => {})
                .finally(() => setSuggLoading(false));
        }, 400);
    };

    const applySuggestion = (item) => {
        const a = item.address || {};
        const houseNumber = a.house_number || '';
        const road = a.road || a.pedestrian || '';
        const street = [houseNumber, road].filter(Boolean).join(' ');
        setAddrFields({
            address: street || item.display_name.split(',')[0],
            city: a.city || a.town || a.village || a.county || '',
            state: a.state || '',
            zipcode: a.postcode || '',
        });
        setSuggestions([]);
    };

    // Reverse-geocode from current device location
    const handleUseCurrentLocation = () => {
        if (!navigator.geolocation) { setAddrMsg('Geolocation not supported by this browser'); return; }
        setLocLoading(true);
        setAddrMsg('');
        navigator.geolocation.getCurrentPosition(
            ({ coords }) => {
                fetch(`https://nominatim.openstreetmap.org/reverse?format=json&addressdetails=1&lat=${coords.latitude}&lon=${coords.longitude}`, {
                    headers: { 'Accept-Language': 'en' }
                })
                    .then(r => r.json())
                    .then(data => {
                        if (data && data.address) applySuggestion(data);
                        else setAddrMsg('Could not resolve address from location');
                    })
                    .catch(() => setAddrMsg('Failed to fetch address'))
                    .finally(() => setLocLoading(false));
            },
            (err) => { setAddrMsg(`Location error: ${err.message}`); setLocLoading(false); },
            { timeout: 10000 }
        );
    };

    useEffect(() => {
        setLoading(true);
        setError('');
        fetch(`${API_URL}/api/masjids/${encodeURIComponent(id)}`)
            .then(r => {
                if (r.status === 404) throw new Error(`Masjid "${id}" not found`);
                if (!r.ok) throw new Error(`Server error ${r.status}`);
                return r.json();
            })
            .then(data => {
                setMasjid(data);
                setPin(data.pin ?? null);
                setAddrFields({
                    address: data.address || '',
                    city: data.city || '',
                    state: data.state || '',
                    zipcode: data.zipcode || '',
                });
            })
            .catch(err => setError(err.message))
            .finally(() => setLoading(false));
    }, [id]);

    const handleResetPin = () => {
        setPinResetting(true);
        setPinResetMsg('');
        fetch(`${API_URL}/api/masjids/${encodeURIComponent(id)}/pin`, { method: 'POST' })
            .then(r => { if (!r.ok) throw new Error(`Server error ${r.status}`); return r.json(); })
            .then(data => { setPin(data.pin); setPinResetMsg(`New PIN saved: ${data.pin}`); })
            .catch(err => setPinResetMsg(`Error: ${err.message}`))
            .finally(() => setPinResetting(false));
    };

    const handleEditPin = () => { setPinEditMode(true); setPinEditValue(pin || ''); setPinResetMsg(''); };
    const handleCancelEditPin = () => { setPinEditMode(false); setPinEditValue(''); setPinResetMsg(''); };

    const handleSavePin = () => {
        if (!pinEditValue.trim()) { setPinResetMsg('Error: PIN cannot be empty'); return; }
        setPinSaving(true);
        setPinResetMsg('');
        fetch(`${API_URL}/api/masjids/${encodeURIComponent(id)}/pin`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ pin: pinEditValue })
        })
            .then(r => { if (!r.ok) throw new Error(`Server error ${r.status}`); return r.json(); })
            .then(data => { setPin(data.pin); setPinResetMsg(`PIN updated: ${data.pin}`); setPinEditMode(false); setPinEditValue(''); })
            .catch(err => setPinResetMsg(`Error: ${err.message}`))
            .finally(() => setPinSaving(false));
    };

    const handleSaveAddress = () => {
        setAddrSaving(true);
        setAddrMsg('');
        fetch(`${API_URL}/api/masjids/${encodeURIComponent(id)}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(addrFields),
        })
            .then(r => { if (!r.ok) throw new Error(`Server error ${r.status}`); return r.json(); })
            .then(data => {
                setMasjid(data);
                setAddrEdit(false);
                setAddrMsg('Address saved ✓');
                setTimeout(() => setAddrMsg(''), 3000);
            })
            .catch(err => setAddrMsg(`Error: ${err.message}`))
            .finally(() => setAddrSaving(false));
    };

    return (
        <div style={{ maxWidth: '700px', margin: '2rem auto', padding: '0 1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
                <button onClick={() => navigate('/')} style={{ ...btnStyle, background: '#f0f0f0', color: '#333' }}>Home</button>
                <button onClick={() => navigate('/admin/masjids')} style={{ ...btnStyle, background: '#f0f0f0', color: '#333' }}>Masjid List</button>
                <h2 style={{ margin: 0 }}>Masjid Details</h2>
            </div>

            {loading && <p style={{ color: '#888' }}>Loading...</p>}
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

                    {/* ── Address Section ── */}
                    <div style={{ padding: '0.75rem 0', borderBottom: '1px solid #f0f0f0' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: addrEdit ? '0.75rem' : 0 }}>
                            <span style={labelStyle}>Address</span>
                            {!addrEdit && (
                                <>
                                    <span style={valueStyle}>
                                        {[addrFields.address, addrFields.city, addrFields.state, addrFields.zipcode].filter(Boolean).join(', ') || <em style={{ color: '#aaa' }}>not set</em>}
                                    </span>
                                    <button onClick={() => { setAddrEdit(true); setAddrMsg(''); }}
                                        style={{ ...btnStyle, background: '#1976d2', color: '#fff', fontSize: '0.82rem', padding: '0.25rem 0.7rem' }}>
                                        Edit
                                    </button>
                                </>
                            )}
                        </div>
                        {addrEdit && (
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem 1rem', marginLeft: '168px' }}>
                                {/* "Use my location" button */}
                                <div style={{ gridColumn: '1 / -1', marginBottom: '0.25rem' }}>
                                    <button onClick={handleUseCurrentLocation} disabled={locLoading}
                                        style={{ ...btnStyle, background: '#455a64', color: '#fff', fontSize: '0.82rem', padding: '0.3rem 0.8rem', opacity: locLoading ? 0.6 : 1 }}>
                                        {locLoading ? '📍 Locating…' : '📍 Use Current Location'}
                                    </button>
                                </div>

                                {/* Street Address with autocomplete */}
                                <label style={{ display: 'flex', flexDirection: 'column', gap: '2px', gridColumn: '1 / -1', position: 'relative' }}>
                                    <span style={{ fontSize: '0.78rem', color: '#666', fontWeight: 600 }}>Street Address {suggLoading && <span style={{ color: '#888' }}>searching…</span>}</span>
                                    <input
                                        style={inputStyle}
                                        value={addrFields.address}
                                        onChange={e => handleAddressInput(e.target.value)}
                                        placeholder="Start typing to search…"
                                        autoComplete="off"
                                    />
                                    {suggestions.length > 0 && (
                                        <ul style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: '#fff', border: '1px solid #ccc', borderRadius: '4px', zIndex: 100, margin: 0, padding: 0, listStyle: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.15)', maxHeight: '220px', overflowY: 'auto' }}>
                                            {suggestions.map((s, i) => (
                                                <li key={i} onClick={() => applySuggestion(s)}
                                                    style={{ padding: '0.5rem 0.75rem', cursor: 'pointer', fontSize: '0.85rem', borderBottom: '1px solid #f0f0f0' }}
                                                    onMouseEnter={e => e.currentTarget.style.background = '#e3f2fd'}
                                                    onMouseLeave={e => e.currentTarget.style.background = '#fff'}>
                                                    {s.display_name}
                                                </li>
                                            ))}
                                        </ul>
                                    )}
                                </label>

                                {/* City, State, Zipcode */}
                                {[{ key: 'city', label: 'City' }, { key: 'state', label: 'State' }, { key: 'zipcode', label: 'Zipcode' }].map(({ key, label }) => (
                                    <label key={key} style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                        <span style={{ fontSize: '0.78rem', color: '#666', fontWeight: 600 }}>{label}</span>
                                        <input style={inputStyle} value={addrFields[key]}
                                            onChange={e => setAddrFields(f => ({ ...f, [key]: e.target.value }))}
                                            placeholder={label} />
                                    </label>
                                ))}

                                <div style={{ gridColumn: '1 / -1', display: 'flex', gap: '0.5rem', marginTop: '0.25rem', alignItems: 'center' }}>
                                    <button onClick={handleSaveAddress} disabled={addrSaving}
                                        style={{ ...btnStyle, background: '#2e7d32', color: '#fff', fontSize: '0.85rem', padding: '0.3rem 0.9rem', opacity: addrSaving ? 0.6 : 1 }}>
                                        {addrSaving ? 'Saving…' : 'Save'}
                                    </button>
                                    <button onClick={() => { setAddrEdit(false); setAddrMsg(''); setSuggestions([]); }}
                                        style={{ ...btnStyle, background: '#757575', color: '#fff', fontSize: '0.85rem', padding: '0.3rem 0.8rem' }}>
                                        Cancel
                                    </button>
                                    {addrMsg && <span style={{ fontSize: '0.85rem', fontWeight: 600, color: addrMsg.startsWith('Error') ? '#d32f2f' : '#2e7d32' }}>{addrMsg}</span>}
                                </div>
                            </div>
                        )}
                        {!addrEdit && addrMsg && <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#2e7d32', marginLeft: '168px' }}>{addrMsg}</span>}
                    </div>

                    {/* ── Masjid PIN ── */}
                    <div style={{ display: 'flex', gap: '0.75rem', padding: '0.5rem 0', borderBottom: '1px solid #f0f0f0', alignItems: 'center', flexWrap: 'wrap' }}>
                        <span style={labelStyle}>Masjid PIN</span>
                        {pinEditMode ? (
                            <>
                                <input type="text" value={pinEditValue} onChange={e => setPinEditValue(e.target.value)}
                                    style={{ fontFamily: 'monospace', fontSize: '1.15rem', letterSpacing: '0.2em', padding: '0.4rem 0.6rem', border: '2px solid #1976d2', borderRadius: '4px', width: '100px' }}
                                    placeholder="Enter PIN" autoFocus />
                                <button onClick={handleSavePin} disabled={pinSaving}
                                    style={{ ...btnStyle, background: '#2e7d32', color: '#fff', fontSize: '0.85rem', padding: '0.3rem 0.8rem', opacity: pinSaving ? 0.6 : 1 }}>
                                    {pinSaving ? 'Saving...' : 'Save'}
                                </button>
                                <button onClick={handleCancelEditPin} disabled={pinSaving}
                                    style={{ ...btnStyle, background: '#757575', color: '#fff', fontSize: '0.85rem', padding: '0.3rem 0.8rem' }}>
                                    Cancel
                                </button>
                            </>
                        ) : (
                            <>
                                <span style={{ fontFamily: 'monospace', fontSize: '1.15rem', letterSpacing: '0.2em', color: '#222', minWidth: '48px' }}>
                                    {pin ?? <em style={{ fontFamily: 'inherit', fontSize: '0.95rem', letterSpacing: 'normal', color: '#aaa' }}>not set</em>}
                                </span>
                                <button onClick={handleEditPin}
                                    style={{ ...btnStyle, background: '#1976d2', color: '#fff', fontSize: '0.85rem', padding: '0.3rem 0.8rem' }}>
                                    Edit
                                </button>
                                <button onClick={handleResetPin} disabled={pinResetting}
                                    style={{ ...btnStyle, background: '#f57c00', color: '#fff', fontSize: '0.85rem', padding: '0.3rem 0.9rem', opacity: pinResetting ? 0.6 : 1 }}>
                                    {pinResetting ? 'Generating...' : pin ? 'Reset PIN' : 'Generate PIN'}
                                </button>
                            </>
                        )}
                        {pinResetMsg && (
                            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: pinResetMsg.startsWith('Error') ? '#d32f2f' : '#2e7d32' }}>
                                {pinResetMsg}
                            </span>
                        )}
                    </div>

                    {/* Remaining fields — exclude address fields and already-shown ones */}
                    {Object.entries(masjid)
                        .filter(([k]) => ![...'_id,id,name,landing,units,_class,pin'.split(','), ...ADDRESS_FIELDS].includes(k))
                        .map(([k, v]) => (
                            <Field key={k} label={k} value={typeof v === 'object' && v !== null ? JSON.stringify(v) : String(v)} />
                        ))}
                </div>
            )}
        </div>
    );
};


export default MasjidDetail;
