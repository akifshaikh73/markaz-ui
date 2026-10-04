import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { formatDate, localDateString, patchCachedListing } from '../utils';
import { getAdmin } from '../config';
import { useMasjidConfig } from '../hooks/useMasjids';
import StatusBadges from './StatusBadges';
import PencilIcon from './PencilIcon';
import StudentEditor from './StudentEditor';
import { getDoNotDisturbVisit, DoNotDisturbBanner } from '../doNotDisturb';
import useDuplicateAddressCheck from '../hooks/useDuplicateAddressCheck';
import DuplicateAddressWarning from './DuplicateAddressWarning';

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
    const [editingAddress, setEditingAddress] = useState(false);
    const [addressDraft, setAddressDraft] = useState({ address1: '', address2: '', city: '', state: '', zipcode: '' });
    const [addressError, setAddressError] = useState('');
    const [addressSaved, setAddressSaved] = useState(false);
    const [coordsStale, setCoordsStale] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();

    // Look for other listings at the new address while the street or apt is being changed.
    const addressChanged = editingAddress && (
        addressDraft.address1.trim() !== (address.address1 || '').trim()
        || addressDraft.address2.trim() !== (address.address2 || '').trim()
    );
    const dupes = useDuplicateAddressCheck({
        masjidId: address.masjidId,
        address1: addressDraft.address1,
        address2: addressDraft.address2,
        excludeId: address._id,
        enabled: addressChanged,
    });

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
            patchCachedListing(address._id, body);
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
            patchCachedListing(address._id, { unitId: Number(unitId) });
            setOriginalUnitId(unitId);
            setEditingUnit(false);
            setUnitError('');
        })
        .catch(err => console.error('Error updating unit:', err));
    };
    const startEditAddress = () => {
        setAddressDraft({
            address1: address.address1 || '',
            address2: address.address2 || '',
            city: address.city || '',
            state: address.state || '',
            zipcode: address.zipcode ? String(address.zipcode) : '',
        });
        setAddressError('');
        setEditingAddress(true);
    };

    const cancelEditAddress = () => {
        setEditingAddress(false);
        setAddressError('');
    };

    const handleActivateAndOpenMatch = (match) => {
        const name = [match.firstName, match.lastName].filter(Boolean).join(' ');
        if (!window.confirm(`Activate listing #${match._id}${name ? ` (${name})` : ''} and open it? Your address edit here will not be saved.`)) return;
        fetch(`${API_URL}/api/addressList/${match._id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ inactive: false }),
        })
        .then(res => res.json().then(data => {
            if (!res.ok) throw new Error(data.error || `Server error: ${res.status}`);
            return data;
        }))
        .then(() => {
            patchCachedListing(match._id, { inactive: false });
            handleOpenMatch({ ...match, inactive: false });
        })
        .catch(err => setAddressError(err.message));
    };

    const handleOpenMatch = (match) => {
        cancelEditAddress();
        navigate(`/address/${match._id}`, { state: { address: match, from: location.state?.from, fromState: location.state?.fromState } });
    };

    const matchBtn = { padding: '0.25rem 0.6rem', fontSize: '0.8rem', borderRadius: '4px', cursor: 'pointer' };

    // Validation mirrors PUT /api/addressList/:id so users see the error before a round-trip.
    const handleUpdateAddress = () => {
        const next = {
            address1: addressDraft.address1.trim(),
            address2: addressDraft.address2.trim(),
            city: addressDraft.city.trim(),
            state: addressDraft.state.trim().toUpperCase(),
            zipcode: addressDraft.zipcode.trim(),
        };
        if (!next.address1) { setAddressError('Street address is required.'); return; }
        if (next.state && !/^[A-Z]{2}$/.test(next.state)) { setAddressError('State must be a 2-letter code, e.g. IL.'); return; }
        if (next.zipcode && !/^\d{5}(-\d{4})?$/.test(next.zipcode)) { setAddressError('Zip must be 5 digits, e.g. 60101.'); return; }

        // Only send what changed. zipcode is stored as a number, so compare numerically
        // (e.g. "60101-1234" is the same stored value as 60101).
        const body = {};
        const saved = {};
        ['address1', 'address2', 'city', 'state'].forEach(field => {
            if (next[field] !== (address[field] || '')) { body[field] = next[field]; saved[field] = next[field]; }
        });
        const zipNum = parseInt(next.zipcode, 10) || 0;
        if (zipNum !== (parseInt(address.zipcode, 10) || 0)) { body.zipcode = next.zipcode; saved.zipcode = zipNum; }
        if (Object.keys(body).length === 0) { cancelEditAddress(); return; }

        fetch(`${API_URL}/api/addressList/${address._id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
        })
        .then(res => res.json().then(data => {
            if (!res.ok) throw new Error(data.error || `Server error: ${res.status}`);
            return data;
        }))
        .then(data => {
            // An API without address support silently ignores these fields.
            if (data.modifiedCount === 0) throw new Error('Address not saved — the API needs updating.');
            setAddress(prev => ({ ...prev, ...saved }));
            patchCachedListing(address._id, saved);
            if (saved.address1 !== undefined && address.latitude && address.longitude) setCoordsStale(true);
            cancelEditAddress();
            setAddressSaved(true);
            setTimeout(() => setAddressSaved(false), 2000);
        })
        .catch(err => setAddressError(err.message));
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

    // Throws on failure so StudentEditor can show the server's validation message inline.
    const handleSaveStudents = (students) =>
        fetch(`${API_URL}/api/addressList/${address._id}/students`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ students }),
        })
        .then(async res => {
            const data = await res.json().catch(() => ({}));
            if (!res.ok) throw new Error(data.error || `Failed to save students (${res.status})`);
            setAddress(prev => ({ ...prev, students: data.students, version: data.version }));
        });

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

    const handleIsStudentToggle = (checked) => {
        handleUpdateWorkerFields({ isStudent: checked });
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
    const doNotDisturbVisit = getDoNotDisturbVisit(address);

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
                <DoNotDisturbBanner visit={doNotDisturbVisit} />
                {address.inactive && (
                    <div style={{ margin: '0.5rem 0', padding: '0.6rem 1rem', background: '#fff3e0', border: '1px solid #ffb74d', borderRadius: '6px', color: '#e65100', fontWeight: 600 }}>
                        ⚠ This listing is marked Inactive
                    </div>
                )}
                <div style={{ display: 'flex', gap: '0.5rem 1.25rem', alignItems: 'center', padding: '0.4rem 0', flexWrap: 'wrap' }}>
                    <span><strong>ID:</strong> {address._id}</span>
                    <span><strong>Masjid ID:</strong> {address.masjidId}</span>
                    <span style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
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
                    </span>
                </div>

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
                            {address.isStudent && <span title="Listing is a student" aria-label="Listing is a student" role="img">🎓</span>}
                            {nameSaved && <span style={{ color: '#4caf50', fontWeight: 600, fontSize: '0.85em' }}>✔ Saved</span>}
                            <button onClick={() => setEditingName(true)} title="Edit name" aria-label="Edit name" style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#1976d2', padding: '0 4px' }}><PencilIcon /></button>
                        </>
                    )}
                </div>
                <StudentEditor students={address.students || []} onSave={handleSaveStudents} />
            <div style={{ padding: '0.4rem 0' }}>
                {editingAddress ? (
                    <div>
                        <strong>Address:</strong>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', alignItems: 'flex-end', marginTop: '0.35rem' }}>
                            {[
                                { field: 'address1', label: 'Street', placeholder: 'Street address', width: '22ch' },
                                { field: 'address2', label: 'Apt / Unit', placeholder: 'Apt / Suite / Unit', width: '12ch' },
                                { field: 'city', label: 'City', placeholder: 'City', width: '14ch' },
                                { field: 'state', label: 'State', placeholder: 'IL', width: '5ch', maxLength: 2 },
                                { field: 'zipcode', label: 'Zip', placeholder: '60601', width: '10ch', maxLength: 10, inputMode: 'numeric' },
                            ].map(({ field, label, placeholder, width, maxLength, inputMode }, i) => (
                                <label key={field} style={{ display: 'flex', flexDirection: 'column', fontSize: '0.8em', color: '#555' }}>
                                    {label}
                                    <input
                                        autoFocus={i === 0}
                                        type="text"
                                        value={addressDraft[field]}
                                        onChange={e => setAddressDraft(prev => ({ ...prev, [field]: e.target.value }))}
                                        onKeyDown={e => { if (e.key === 'Enter') handleUpdateAddress(); if (e.key === 'Escape') cancelEditAddress(); }}
                                        placeholder={placeholder}
                                        maxLength={maxLength}
                                        inputMode={inputMode}
                                        aria-invalid={Boolean(addressError)}
                                        aria-describedby={addressError ? 'address-error' : undefined}
                                        style={{ width, padding: '0.25rem 0.4rem', border: `1px solid ${addressError ? '#c62828' : '#1976d2'}`, borderRadius: '4px', fontSize: '1.1em' }}
                                    />
                                </label>
                            ))}
                            <button onClick={handleUpdateAddress} title="Save address" style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem', color: '#4caf50', padding: '0 4px' }}>✔</button>
                            <button onClick={cancelEditAddress} title="Cancel" style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.1rem', color: '#999', padding: '0 4px' }}>✕</button>
                        </div>
                        {addressError && <div id="address-error" role="alert" style={{ color: '#c62828', fontSize: '0.85em', marginTop: '0.25rem' }}>{addressError}</div>}
                        <div style={{ marginTop: '0.5rem' }}>
                            <DuplicateAddressWarning {...dupes} renderActions={match => (
                                match.inactive ? (
                                    <button onClick={() => handleActivateAndOpenMatch(match)} style={{ ...matchBtn, background: '#e65100', color: '#fff', border: 'none' }}>Activate &amp; open</button>
                                ) : (
                                    <button onClick={() => handleOpenMatch(match)} style={matchBtn}>Open listing</button>
                                )
                            )} />
                        </div>
                    </div>
                ) : (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                        <span style={{ overflowWrap: 'anywhere', wordBreak: 'break-word', lineHeight: 1.5 }}><strong>Address:</strong> {[
                            [address.address1, address.address2 && address.address2.trim()].filter(Boolean).join(', '),
                            address.city,
                            [address.state, address.zipcode].filter(Boolean).join(' ')
                        ].filter(Boolean).join(' ')}</span>
                        {addressSaved && <span style={{ color: '#4caf50', fontWeight: 600, fontSize: '0.85em' }}>✔ Saved</span>}
                        <button onClick={startEditAddress} title="Edit address" aria-label="Edit address" style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#1976d2', padding: '0 4px' }}><PencilIcon /></button>
                    </div>
                )}
                {coordsStale && (
                    <div style={{ marginTop: '0.3rem', padding: '0.35rem 0.6rem', background: '#fff8e1', border: '1px solid #ffe082', borderRadius: '4px', color: '#8d6e00', fontSize: '0.85em' }}>
                        ⚠ Street changed — map and route position still use the old location.
                    </div>
                )}
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
                    <strong style={{ fontSize: '0.9em', color: '#555' }}>Invalid</strong>
                </label>
                <span style={{ fontSize: '0.8em', color: '#999' }}>Invalid listing status</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.5rem 0', borderBottom: '1px solid #f0f0f0' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer' }}>
                    <input type="checkbox" checked={!!address.isStudent} onChange={e => handleIsStudentToggle(e.target.checked)} style={{ width: '16px', height: '16px', accentColor: '#7b1fa2' }} />
                    <strong style={{ fontSize: '0.9em', color: '#555' }}>Is Student</strong>
                </label>
                <span style={{ fontSize: '0.8em', color: '#999' }}>Student or young adult</span>
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