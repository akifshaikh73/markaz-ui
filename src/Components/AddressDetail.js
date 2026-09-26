import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { formatDate, localDateString } from '../utils';
import { getAdmin } from '../config';
import { useMasjidConfig } from '../hooks/useMasjids';
import StatusBadges from './StatusBadges';

// Unicode's ✎ pencil glyph renders differently (and sometimes mirrored) across OS/browser
// font fallbacks, so laptop vs phone could show visibly different icons. An inline SVG
// renders identically everywhere; scaleX(-1) reverses its default orientation.
const PencilIcon = () => (
    <svg
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{ display: 'block', transform: 'scaleX(-1)' }}
    >
        <path d="M12 20h9" />
        <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4Z" />
    </svg>
);

function AddressDetail({ address: initialAddress, isModal }) {
    const { id } = useParams();
    const API_URL = process.env.REACT_APP_API_URL || '';
    const { masjidUnitsMap } = useMasjidConfig();
    const [address, setAddress] = useState(initialAddress || {});
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [originalFirstName, setOriginalFirstName] = useState('');
    const [originalLastName, setOriginalLastName] = useState('');
    const [unitId, setUnitId] = useState('');
    const [originalUnitId, setOriginalUnitId] = useState('');
    const [editingUnit, setEditingUnit] = useState(false);
    const [unitError, setUnitError] = useState('');
    const [response, setResponse] = useState('');
    const [comments, setComments] = useState('');
    const [modifiedDate, setModifiedDate] = useState(localDateString());
    const [isAdmin, setIsAdmin] = useState(getAdmin());
    const [accessDenied, setAccessDenied] = useState(false);
    const [phoneNumber, setPhoneNumber] = useState('');
    const [bestTime, setBestTime] = useState('');
    const [profession, setProfession] = useState('');
    const [ethnicity, setEthnicity] = useState('');
    const [originalPhoneNumber, setOriginalPhoneNumber] = useState('');
    const [originalBestTime, setOriginalBestTime] = useState('');
    const [originalProfession, setOriginalProfession] = useState('');
    const [originalEthnicity, setOriginalEthnicity] = useState('');
    const [editingField, setEditingField] = useState(null); // 'phoneNumber' | 'bestTime' | 'profession' | 'ethnicity'
    const [editingName, setEditingName] = useState(false);
    const [nameSaved, setNameSaved] = useState(false);
    const [contactSaved, setContactSaved] = useState(null); // field name that just saved
    const [oldWorker, setOldWorker] = useState(false);
    const [oldWorkerTimeSpent, setOldWorkerTimeSpent] = useState('');
    const [masturat, setMasturat] = useState(false);
    const [massuratTimeSpent, setMassuratTimeSpent] = useState('');
    const [notes, setNotes] = useState('');
    const [originalNotes, setOriginalNotes] = useState('');
    const [editingNotes, setEditingNotes] = useState(false);
    const [notesSaved, setNotesSaved] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();

    const RESPONSE_OPTIONS = ['Met', 'No Response', 'Left Message', 'Moved', 'Invalid', 'Do Not Disturb', 'Duplicate', 'Rented'];

    useEffect(() => {
        if (!initialAddress) {
            fetch(`${API_URL}/api/addressList/search/${id}`)
                .then(response => response.json())
                .then(data => {
                    if (!getAdmin()) {
                        const ctx = JSON.parse(localStorage.getItem('landingContext') || '{}');
                        console.log('[AccessCheck] data.masjidId:', data.masjidId, '| ctx.masjidID:', ctx.masjidID, '| isAdmin:', getAdmin());
                        if (!ctx.masjidID || String(data.masjidId) !== String(ctx.masjidID)) {
                            setAccessDenied(true);
                            return;
                        }
                    }
                    setAddress(data);
                    setFirstName(data.firstName);
                    setLastName(data.lastName);
                    setOriginalFirstName(data.firstName);
                    setOriginalLastName(data.lastName);
                    setUnitId(String(data.unitId));
                    setOriginalUnitId(String(data.unitId));
                    setPhoneNumber(data.phoneNumber || '');
                    setBestTime(data.bestTime || '');
                    setProfession(data.profession || '');
                    setEthnicity(data.ethnicity || '');
                    setOriginalPhoneNumber(data.phoneNumber || '');
                    setOriginalBestTime(data.bestTime || '');
                    setOriginalProfession(data.profession || '');
                    setOriginalEthnicity(data.ethnicity || '');
                    setOldWorker(!!data.oldWorker);
                    setOldWorkerTimeSpent(data.oldWorkerTimeSpent || '');
                    setMasturat(!!data.masturat);
                    setMassuratTimeSpent(data.massuratTimeSpent || '');
                    setNotes(data.notes || '');
                    setOriginalNotes(data.notes || '');
                })
                .catch(err => console.error('[AddressDetail] fetch error:', err));
        } else {
            setAddress(initialAddress);
            setFirstName(initialAddress.firstName);
            setLastName(initialAddress.lastName);
            setOriginalFirstName(initialAddress.firstName);
            setOriginalLastName(initialAddress.lastName);
            setUnitId(String(initialAddress.unitId));
            setOriginalUnitId(String(initialAddress.unitId));
            setPhoneNumber(initialAddress.phoneNumber || '');
            setBestTime(initialAddress.bestTime || '');
            setProfession(initialAddress.profession || '');
            setEthnicity(initialAddress.ethnicity || '');
            setOriginalPhoneNumber(initialAddress.phoneNumber || '');
            setOriginalBestTime(initialAddress.bestTime || '');
            setOriginalProfession(initialAddress.profession || '');
            setOriginalEthnicity(initialAddress.ethnicity || '');
            setOldWorker(!!initialAddress.oldWorker);
            setOldWorkerTimeSpent(initialAddress.oldWorkerTimeSpent || '');
            setMasturat(!!initialAddress.masturat);
            setMassuratTimeSpent(initialAddress.massuratTimeSpent || '');
            setNotes(initialAddress.notes || '');
            setOriginalNotes(initialAddress.notes || '');
        }
    }, [id, initialAddress, API_URL]);

    useEffect(() => {
        // Check admin status whenever component mounts or when admin status might change
        setIsAdmin(getAdmin());
    }, []);    

    const handleUpdate = () => {
        const body = {};
        if (firstName !== originalFirstName) body.firstName = firstName;
        if (lastName !== originalLastName) body.lastName = lastName;
        if (Object.keys(body).length === 0) { setEditingName(false); return; }

        fetch(`${API_URL}/api/addressList/${address._id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
        })
        .then(res => res.json())
        .then(() => {
            setAddress(prev => ({ ...prev, ...body }));
            if (body.firstName !== undefined) setOriginalFirstName(firstName);
            if (body.lastName !== undefined) setOriginalLastName(lastName);
            setEditingName(false);
            setNameSaved(true);
            setTimeout(() => setNameSaved(false), 2000);
        })
        .catch(err => console.error('Error updating name:', err));
    };

    const handleUpdateUnit = () => {
        const validUnits = masjidUnitsMap[String(address.masjidId)] || [];
        if (!validUnits.some(unit => String(unit) === unitId)) {
            setUnitError(validUnits.length > 0 ? `Enter a valid unit: ${validUnits.join(', ')}` : 'Unit options are unavailable.');
            return;
        }
        if (unitId === originalUnitId) {
            setEditingUnit(false);
            setUnitError('');
            return;
        }
        fetch(`${API_URL}/api/addressList/${address._id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ unitId: Number(unitId) }),
        })
        .then(res => res.json())
        .then(() => {
            setAddress(prev => ({ ...prev, unitId: Number(unitId) }));
            setOriginalUnitId(unitId);
            setEditingUnit(false);
            setUnitError('');
        })
        .catch(err => console.error('Error updating unit:', err));
    };
    const handleUpdateContact = (field) => {
        const valueMap = { phoneNumber, bestTime, profession, ethnicity };
        const originalMap = { phoneNumber: originalPhoneNumber, bestTime: originalBestTime, profession: originalProfession, ethnicity: originalEthnicity };
        const setterMap = {
            phoneNumber: setOriginalPhoneNumber,
            bestTime: setOriginalBestTime,
            profession: setOriginalProfession,
            ethnicity: setOriginalEthnicity,
        };
        const value = valueMap[field];
        if (value === originalMap[field]) { setEditingField(null); return; }

        fetch(`${API_URL}/api/addressList/${address._id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ [field]: value }),
        })
        .then(res => res.json())
        .then(() => {
            setAddress(prev => ({ ...prev, [field]: value }));
            setterMap[field](value);
            setEditingField(null);
            setContactSaved(field);
            setTimeout(() => setContactSaved(null), 2000);
        })
        .catch(err => console.error(`Error updating ${field}:`, err));
    };

    const handleUpdateNotes = () => {
        if (notes === originalNotes) { setEditingNotes(false); return; }

        fetch(`${API_URL}/api/addressList/${address._id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ notes }),
        })
        .then(res => res.json())
        .then(() => {
            setAddress(prev => ({ ...prev, notes }));
            setOriginalNotes(notes);
            setEditingNotes(false);
            setNotesSaved(true);
            setTimeout(() => setNotesSaved(false), 2000);
        })
        .catch(err => console.error('Error updating notes:', err));
    };

    const handleUpdateWorkerFields = (patch) => {
        fetch(`${API_URL}/api/addressList/${address._id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(patch),
        })
        .then(res => res.json())
        .then(() => setAddress(prev => ({ ...prev, ...patch })))
        .catch(err => console.error('Error updating worker fields:', err));
    };

    const handleOldWorkerChange = (checked) => {
        setOldWorker(checked);
        const patch = { oldWorker: checked };
        if (!checked) { setOldWorkerTimeSpent(''); patch.oldWorkerTimeSpent = ''; }
        handleUpdateWorkerFields(patch);
    };

    const handleOldWorkerTimeSpentChange = (val) => {
        setOldWorkerTimeSpent(val);
        handleUpdateWorkerFields({ oldWorkerTimeSpent: val });
    };

    const handleMassuratChange = (checked) => {
        setMasturat(checked);
        const patch = { masturat: checked };
        if (!checked) { setMassuratTimeSpent(''); patch.massuratTimeSpent = ''; }
        handleUpdateWorkerFields(patch);
    };

    const handleMassuratTimeSpentChange = (val) => {
        setMassuratTimeSpent(val);
        handleUpdateWorkerFields({ massuratTimeSpent: val });
    };

    const handleInactiveToggle = (checked) => {
        handleUpdateWorkerFields({ inactive: checked });
    };

    const handleUpdateResponse = () => {
        fetch(`${API_URL}/api/addressList/visit/${address._id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                lastmodifieddate: `${modifiedDate}T00:00:00Z`, 
                response, 
                comment: comments }),
        })
        .then(res => res.json())
        .then(data => {
            console.log('Response updated:', data);
            setAddress(prev => ({
                ...prev,
                visitHistory: [...(prev.visitHistory || []), { response, comments, createdDate: `${modifiedDate}T00:00:00Z` }]
            }));
            
            // If response is Invalid, Moved, or Duplicate, set inactive to true
            if (response === 'Invalid' || response === 'Moved' || response === 'Duplicate') {
                fetch(`${API_URL}/api/addressList/${address._id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        inactive: true
                    }),
                })
                .then(res => res.json())
                .then(data => {
                    console.log('Inactive flag updated:', data);
                    setAddress(prev => ({ ...prev, inactive: true }));
                })
                .catch(err => console.error('Error updating inactive:', err));
            }
            
            setResponse('');
            setComments('');
            setModifiedDate(localDateString());
        })
        .catch(err => console.error('Error:', err));
    };

    const handleNavigation = () => {
        // Prefer the explicit source page passed by the link that brought us here —
        // works even after a refresh, unlike browser history which can point elsewhere.
        // Always replace (not push) so we don't leave a duplicate history entry that
        // throws off other pages' navigate(-1)/back-button behavior.
        const from = location.state?.from;
        if (from) {
            // Landing requires isLoggedIn in state or it bounces to /user-login;
            // other pages (e.g. Route) need their original state restored or they render empty.
            navigate(from, { replace: true, state: { isLoggedIn: true, ...(location.state?.fromState || {}) } });
            return;
        }
        const ctx = JSON.parse(localStorage.getItem('landingContext')) || {};
        const masjid = ctx.masjidID || address.masjidId;
        const unit = ctx.unitID || address.unitId;
        navigate(`/landing/${masjid}/${unit}`, { replace: true, state: { isLoggedIn: true } });
    };

    if (accessDenied) {
        return (
            <div style={{ margin: '2rem', padding: '1.5rem', border: '1px solid #f5c6cb', borderRadius: '8px', background: '#fff3f3', color: '#b71c1c' }}>
                <strong>Access Denied</strong>
                <p style={{ margin: '0.5rem 0 1rem' }}>You don't have access to this listing.</p>
                <button onClick={() => navigate(-1)}>Go Back</button>
            </div>
        );
    }

    const hasCoordinates = Boolean(address.latitude) && Boolean(address.longitude);

    return (
        <div>
                <h2>Address Detail</h2>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: '0.5rem', flexWrap: 'wrap' }}>
                    <StatusBadges />
                    {localStorage.getItem('loginSource') === 'admin' && getAdmin() && (
                        <button onClick={() => navigate('/admin-home')} style={{ fontSize: '0.75rem', color: '#1976d2', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600, padding: 0 }}>⌂ Home</button>
                    )}
                    {!isModal && (() => {
                        const masjidSlug = localStorage.getItem('userMasjidSlug') || localStorage.getItem('preferredMasjid');
                        return masjidSlug ? (
                            <button onClick={() => navigate(`/${masjidSlug}`)} style={{ background: '#f57c00', color: '#fff', border: 'none', padding: '0.3rem 0.6rem', borderRadius: '4px', cursor: 'pointer', fontWeight: 600, fontSize: '0.8rem' }}>
                                🏠 Home
                            </button>
                        ) : null;
                    })()}
                </div>
                {address.inactive && (
                    <div style={{ margin: '0.5rem 0', padding: '0.6rem 1rem', background: '#fff3e0', border: '1px solid #ffb74d', borderRadius: '6px', color: '#e65100', fontWeight: 600 }}>
                        ⚠ This listing is marked Inactive
                    </div>
                )}
                <p><strong>ID:</strong> {address._id}</p>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.4rem 0' }}>
                    {editingName ? (
                        <>
                            <input autoFocus type="text" value={firstName} onChange={e => setFirstName(e.target.value)}
                                placeholder="First name"
                                onKeyDown={e => { if (e.key === 'Enter') handleUpdate(); if (e.key === 'Escape') { setFirstName(originalFirstName); setLastName(originalLastName); setEditingName(false); } }}
                                style={{ width: '12ch', padding: '0.25rem 0.4rem', border: '1px solid #1976d2', borderRadius: '4px', fontSize: '0.9em' }} />
                            <input type="text" value={lastName} onChange={e => setLastName(e.target.value)}
                                placeholder="Last name"
                                onKeyDown={e => { if (e.key === 'Enter') handleUpdate(); if (e.key === 'Escape') { setFirstName(originalFirstName); setLastName(originalLastName); setEditingName(false); } }}
                                style={{ width: '12ch', padding: '0.25rem 0.4rem', border: '1px solid #1976d2', borderRadius: '4px', fontSize: '0.9em' }} />
                            <button onClick={handleUpdate} title="Save" style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem', color: '#4caf50', padding: '0 4px' }}>✔</button>
                            <button onClick={() => { setFirstName(originalFirstName); setLastName(originalLastName); setEditingName(false); }} title="Cancel" style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.1rem', color: '#999', padding: '0 4px' }}>✕</button>
                        </>
                    ) : (
                        <>
                            <strong style={{ fontSize: '1rem' }}>{firstName} {lastName}</strong>
                            {nameSaved && <span style={{ color: '#4caf50', fontWeight: 600, fontSize: '0.85em' }}>✔ Saved</span>}
                            <button onClick={() => setEditingName(true)} title="Edit name" aria-label="Edit name" style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#1976d2', padding: '0 4px' }}><PencilIcon /></button>
                        </>
                    )}
                </div>
            <div>
                <label><strong>Masjid ID:</strong> {address.masjidId}</label>
            </div>
            <div>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', padding: '0.4rem 0', flexWrap: 'wrap' }}>
                    <strong>Unit ID:</strong>
                    {editingUnit ? (
                        <>
                            <input
                                autoFocus
                                type="text"
                                inputMode="numeric"
                                pattern="[0-9]*"
                                value={unitId}
                                onChange={e => {
                                    if (/^\d*$/.test(e.target.value)) {
                                        setUnitId(e.target.value);
                                        setUnitError('');
                                    }
                                }}
                                onKeyDown={e => {
                                    if (e.key === 'Enter') handleUpdateUnit();
                                    if (e.key === 'Escape') {
                                        setUnitId(originalUnitId);
                                        setEditingUnit(false);
                                        setUnitError('');
                                    }
                                }}
                                aria-invalid={Boolean(unitError)}
                                aria-describedby={unitError ? 'unit-error' : undefined}
                                style={{ width: '6ch', padding: '0.25rem 0.4rem', border: `1px solid ${unitError ? '#c62828' : '#1976d2'}`, borderRadius: '4px', fontSize: '0.9em' }}
                            />
                            <button onClick={handleUpdateUnit} title="Save unit" style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem', color: '#4caf50', padding: '0 4px' }}>✔</button>
                            <button onClick={() => { setUnitId(originalUnitId); setEditingUnit(false); setUnitError(''); }} title="Cancel" style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.1rem', color: '#999', padding: '0 4px' }}>✕</button>
                        </>
                    ) : (
                        <>
                            <span>{originalUnitId}</span>
                            <button onClick={() => setEditingUnit(true)} title="Edit unit" aria-label="Edit unit" style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#1976d2', padding: '0 4px' }}><PencilIcon /></button>
                        </>
                    )}
                    {unitError && <span id="unit-error" role="alert" style={{ color: '#c62828', fontSize: '0.85em' }}>{unitError}</span>}
                </div>
            </div>
            <div>
                <label style={{ display: 'block', overflowWrap: 'anywhere', wordBreak: 'break-word', lineHeight: 1.5 }}><strong>Address:</strong> {[
                    address.address1,
                    address.city,
                    [address.state, address.zipcode].filter(Boolean).join(' ')
                ].filter(Boolean).join(' ')}</label>
            </div>
            <div>
                <label><strong>Neighborhood:</strong> {address.area}</label>
            </div>
            {/* Editable contact info — one field at a time */}
            {[
                { field: 'phoneNumber', label: 'Phone Number', value: phoneNumber, setter: setPhoneNumber, type: 'tel', placeholder: 'Phone number' },
                { field: 'bestTime',    label: 'Best Time',    value: bestTime,    setter: setBestTime,    type: 'text', placeholder: 'e.g. Evenings' },
                { field: 'profession',  label: 'Profession',   value: profession,  setter: setProfession,  type: 'text', placeholder: 'Profession' },
                { field: 'ethnicity',   label: 'Ethnicity',    value: ethnicity,   setter: setEthnicity,   type: 'text', placeholder: 'e.g. Arab, Somali, IndoPak, American', hint: 'e.g. Arab, Somali, IndoPak, American' },
            ].map(({ field, label, value, setter, type, placeholder, hint }) => (
                <div key={field} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.4rem 0', borderBottom: '1px solid #f0f0f0' }}>
                    <strong style={{ minWidth: '120px', fontSize: '0.9em', color: '#555' }}>{label}:</strong>
                    {editingField === field ? (
                        <>
                            <input
                                autoFocus
                                type={type}
                                value={value}
                                onChange={e => setter(e.target.value)}
                                placeholder={placeholder}
                                onKeyDown={e => { if (e.key === 'Enter') handleUpdateContact(field); if (e.key === 'Escape') setEditingField(null); }}
                                style={{ width: '14ch', padding: '0.25rem 0.4rem', border: '1px solid #1976d2', borderRadius: '4px', fontSize: '0.9em' }}
                            />
                            {/* ✔ Save */}
                            <button
                                onClick={() => handleUpdateContact(field)}
                                title="Save"
                                style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem', color: '#4caf50', padding: '0 4px' }}
                            >✔</button>
                            {/* ✕ Cancel */}
                            <button
                                onClick={() => { setter(field === 'phoneNumber' ? originalPhoneNumber : field === 'bestTime' ? originalBestTime : field === 'profession' ? originalProfession : originalEthnicity); setEditingField(null); }}
                                title="Cancel"
                                style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.1rem', color: '#999', padding: '0 4px' }}
                            >✕</button>
                        </>
                    ) : (
                        <>
                            <span style={{ width: '14ch', fontSize: '0.9em', color: value ? '#222' : '#aaa', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {value || '—'}
                                {contactSaved === field && <span style={{ marginLeft: '0.5rem', color: '#4caf50', fontWeight: 600, fontSize: '0.85em' }}>✔ Saved</span>}
                            </span>
                            {/* Edit */}
                            <button
                                onClick={() => setEditingField(field)}
                                title="Edit"
                                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#1976d2', padding: '0 4px' }}
                            ><PencilIcon /></button>
                            {hint && (
                                <span style={{ fontSize: '0.75em', color: '#999' }}>({hint})</span>
                            )}
                        </>
                    )}
                </div>
            ))}
            {isAdmin && (
                <div>
                    <label><strong>Latitude:</strong> {address.latitude}</label>
                </div>
            )}
            {isAdmin && (
                <div>
                    <label><strong>Longitude:</strong> {address.longitude}</label>
                </div>
            )}
            {/* Mens Work (oldWorker) */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.5rem 0', borderBottom: '1px solid #f0f0f0' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer', minWidth: '120px' }}>
                    <input type="checkbox" checked={oldWorker} onChange={e => handleOldWorkerChange(e.target.checked)} style={{ width: '16px', height: '16px', accentColor: '#1976d2' }} />
                    <strong style={{ fontSize: '0.9em', color: '#555' }}>Mens Work</strong>
                </label>
                {oldWorker && (
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.9em' }}>
                        <span style={{ color: '#555' }}>Time Spent:</span>
                        <select value={oldWorkerTimeSpent} onChange={e => handleOldWorkerTimeSpentChange(e.target.value)}
                            style={{ padding: '0.2rem 0.4rem', border: '1px solid #ccc', borderRadius: '4px', fontSize: '0.9em' }}>
                            <option value="">-- Select --</option>
                            {['5 Deeds', '3d', '10d', '40d', '4mo', '1y'].map(o => <option key={o} value={o}>{o}</option>)}
                        </select>
                    </label>
                )}
            </div>
            {/* Ladies Work (masturat) */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.5rem 0', borderBottom: '1px solid #f0f0f0' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer', minWidth: '120px' }}>
                    <input type="checkbox" checked={masturat} onChange={e => handleMassuratChange(e.target.checked)} style={{ width: '16px', height: '16px', accentColor: '#7b1fa2' }} />
                    <strong style={{ fontSize: '0.9em', color: '#555' }}>Ladies Work</strong>
                </label>
                {masturat && (
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.9em' }}>
                        <span style={{ color: '#555' }}>Time Spent:</span>
                        <select value={massuratTimeSpent} onChange={e => handleMassuratTimeSpentChange(e.target.value)}
                            style={{ padding: '0.2rem 0.4rem', border: '1px solid #ccc', borderRadius: '4px', fontSize: '0.9em' }}>
                            <option value="">-- Select --</option>
                            {['Taleem', '3d', '10d', '40d'].map(o => <option key={o} value={o}>{o}</option>)}
                        </select>
                    </label>
                )}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.5rem 0', borderBottom: '1px solid #f0f0f0' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer' }}>
                    <input type="checkbox" checked={!!address.inactive} onChange={e => handleInactiveToggle(e.target.checked)} style={{ width: '16px', height: '16px', accentColor: '#e65100' }} />
                    <strong style={{ fontSize: '0.9em', color: '#555' }}>Inactive</strong>
                </label>
                <span style={{ fontSize: '0.8em', color: '#999' }}>Toggle Inactive status.</span>
            </div>
            <div>
                <label><strong>Met:</strong> {address.met ? 'Yes' : 'No'}</label>
            </div>
            <div>
                <label><strong>Last Visited Date:</strong> {formatDate(address.lastModifiedDate)}</label>
            </div>

            <div>
                <h3>Visit History:</h3>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end', marginBottom: '0.75rem', flexWrap: 'wrap' }}>
                    <label>
                        <strong>Date:</strong>
                        <input type="date" value={modifiedDate} onChange={e => setModifiedDate(e.target.value)} style={{ marginLeft: '0.5rem', padding: '0.25rem' }} />
                    </label>
                    <label>
                        <strong>Response:</strong>
                        <select value={response} onChange={e => setResponse(e.target.value)} style={{ marginLeft: '0.5rem', padding: '0.25rem' }}>
                            <option value="">-- Select --</option>
                            {RESPONSE_OPTIONS.map(opt => (
                                <option key={opt} value={opt}>{opt}</option>
                            ))}
                        </select>
                    </label>
                    <label>
                        <strong>Comments:</strong>
                        <input type="text" value={comments} onChange={e => setComments(e.target.value)} placeholder="Add comments..." style={{ marginLeft: '0.5rem', padding: '0.25rem', minWidth: '200px' }} />
                    </label>
                    <button
                        onClick={handleUpdateResponse}
                        disabled={!response}
                        style={{
                            background: response ? '#e65100' : '#6b7280',
                            color: '#fff',
                            border: 'none',
                            padding: '0.55rem 1rem',
                            borderRadius: '5px',
                            cursor: response ? 'pointer' : 'not-allowed',
                            fontWeight: 700,
                            fontSize: '0.9rem',
                            opacity: 1,
                        }}
                    >
                        Update Response
                    </button>
                </div>
                {address.visitHistory && [...address.visitHistory]
                    .sort((a, b) => {
                        const dateA = new Date((a.createdDate?.$date) ?? a.createdDate);
                        const dateB = new Date((b.createdDate?.$date) ?? b.createdDate);
                        return dateB - dateA;
                    })
                    .map((visit, index) => (
                        <div key={index} style={{ display: 'flex', gap: '1.5rem', padding: '4px 0', borderBottom: '1px solid #eee' }}>
                            <span><strong>Response:</strong> {visit.response}</span>
                            <span><strong>Comments:</strong> {visit.comments}</span>
                            <span><strong>Date:</strong> {formatDate(visit.createdDate)}</span>
                        </div>
                    ))}
            </div>

            {/* Notes — document-level, free-form; not tied to a specific visit (see Comments above) */}
            <div style={{ padding: '0.5rem 0', borderBottom: '1px solid #f0f0f0' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <strong style={{ fontSize: '0.9em', color: '#555' }}>Notes:</strong>
                    {!editingNotes && (
                        <button
                            onClick={() => setEditingNotes(true)}
                            title="Edit notes"
                            aria-label="Edit notes"
                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#1976d2', padding: '0 4px' }}
                        ><PencilIcon /></button>
                    )}
                    {notesSaved && <span style={{ color: '#4caf50', fontWeight: 600, fontSize: '0.85em' }}>✔ Saved</span>}
                </div>
                <div style={{ fontSize: '0.75em', color: '#999', margin: '0.15rem 0 0.35rem' }}>General notes about the listing.</div>
                {editingNotes ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', alignItems: 'flex-start' }}>
                        <textarea
                            autoFocus
                            value={notes}
                            onChange={e => setNotes(e.target.value)}
                            placeholder="General notes about the listing"
                            rows={3}
                            onKeyDown={e => { if (e.key === 'Escape') { setNotes(originalNotes); setEditingNotes(false); } }}
                            style={{ width: '100%', maxWidth: '40ch', padding: '0.4rem', border: '1px solid #1976d2', borderRadius: '4px', fontSize: '0.9em', fontFamily: 'inherit', resize: 'vertical' }}
                        />
                        <div style={{ display: 'flex', gap: '0.25rem' }}>
                            <button onClick={handleUpdateNotes} title="Save" style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem', color: '#4caf50', padding: '0 4px' }}>✔</button>
                            <button onClick={() => { setNotes(originalNotes); setEditingNotes(false); }} title="Cancel" style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.1rem', color: '#999', padding: '0 4px' }}>✕</button>
                        </div>
                    </div>
                ) : (
                    <p style={{ margin: 0, fontSize: '0.9em', color: notes ? '#222' : '#aaa', whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>
                        {notes || '—'}
                    </p>
                )}
            </div>

            <div>
                <h3>Students:</h3>
                {address.students && address.students.length > 0 ? (
                    address.students.map((student, index) => (
                        <div key={index}>
                            <p><strong>Student {index + 1}:</strong> {student.name}</p>
                        </div>
                    ))
                ) : (
                    <p>No students.</p>
                )}
            </div>
            <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem', alignItems: 'center' }}>
                <button
                    onClick={() => navigate('/route', { state: { listings: [address] } })}
                    disabled={!hasCoordinates || !address._id}
                    title={hasCoordinates ? undefined : 'Missing coordinates for this address'}
                    style={{ background: hasCoordinates ? '#e65100' : '#ccc', color: '#fff', border: 'none', padding: '0.4rem 1rem', borderRadius: '5px', cursor: hasCoordinates ? 'pointer' : 'not-allowed', fontWeight: 700, fontSize: '0.9rem', opacity: hasCoordinates ? 1 : 0.6 }}
                >
                    🗺 Route
                </button>
                {!isModal && (
                    <button
                        onClick={handleNavigation}
                        style={{ background: '#1976d2', color: '#fff', border: 'none', padding: '0.55rem 1rem', borderRadius: '5px', cursor: 'pointer', fontWeight: 700, fontSize: '0.9rem' }}
                    >
                        ← Back
                    </button>
                )}
            </div>
        </div>
    );
}

export default AddressDetail;