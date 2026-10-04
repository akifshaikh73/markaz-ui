import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { localDateString } from '../utils';
import useDuplicateAddressCheck from '../hooks/useDuplicateAddressCheck';
import DuplicateAddressWarning from './DuplicateAddressWarning';

const RESPONSE_OPTIONS = ['Met', 'No Response', 'Left Message', 'Moved', 'Invalid', 'Do Not Disturb', 'Duplicate', 'Rented'];

// Prefer the unit the user is currently viewing; fall back to the first configured unit.
function pickUnit(defaultUnitId, unitOptions) {
    if (defaultUnitId !== undefined && defaultUnitId !== null && defaultUnitId !== ''
        && unitOptions.some(u => String(u) === String(defaultUnitId))) {
        return String(defaultUnitId);
    }
    return unitOptions[0] !== undefined ? String(unitOptions[0]) : '';
}

// allowUpdateExisting: offer "Update this listing" / "Activate & save" on a duplicate match, which
// saves this form onto the existing listing. Off for now — matches only get "Open listing"
// (or "Activate & open" when inactive).
function AddAddress({ masjidID, unitOptions, defaultUnitId, onClose, onCreated, allowUpdateExisting = false }) {
    const API_URL = process.env.REACT_APP_API_URL || '';

    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [address1, setAddress1] = useState('');
    const [address2, setAddress2] = useState('');
    const [city, setCity] = useState('');
    const [addrState, setAddrState] = useState('');
    const [zipcode, setZipcode] = useState('');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [unitId, setUnitId] = useState(() => pickUnit(defaultUnitId, unitOptions));

    // unitOptions may still be loading when the form mounts; fill the unit in once they arrive
    // so we never post unitId: null.
    useEffect(() => {
        if (unitId === '' && unitOptions.length > 0) setUnitId(pickUnit(defaultUnitId, unitOptions));
    }, [unitOptions, defaultUnitId, unitId]);

    const [response, setResponse] = useState('');
    const [comment, setComment] = useState('');
    const [visitDate, setVisitDate] = useState(localDateString());

    const [createdId, setCreatedId] = useState(null);
    const [error, setError] = useState('');
    const [submitting, setSubmitting] = useState(false);
    // Set when an existing listing was updated/activated instead of creating a new one.
    const [usedExisting, setUsedExisting] = useState(null); // { activated: boolean }
    const [confirmingId, setConfirmingId] = useState(null);
    const navigate = useNavigate();
    const location = useLocation();

    const dupes = useDuplicateAddressCheck({ masjidId: masjidID, address1, address2, enabled: !createdId });

    const handleSubmit = () => {
        if (!firstName.trim() || !lastName.trim() || !address1.trim()) {
            setError('First name, last name and address are required.');
            return;
        }
        if (isNaN(parseInt(unitId))) {
            setError('Please select a unit.');
            return;
        }
        setError('');
        setSubmitting(true);

        const body = {
            firstName: firstName.trim(),
            lastName: lastName.trim(),
            address1: address1.trim(),
            ...(address2.trim() && { address2: address2.trim() }),
            ...(city.trim()     && { city: city.trim() }),
            ...(addrState.trim()&& { state: addrState.trim() }),
            ...(zipcode.trim()  && { zipcode: zipcode.trim() }),
            ...(phoneNumber.trim() && { phoneNumber: phoneNumber.trim() }),
            masjidId: parseInt(masjidID),
            unitId: parseInt(unitId),
        };

        body.listingSource = 'render-app';

        if (response || comment) {
            body.visitedDate = visitDate;
            body.latestResponse = response;
            body.comments = comment;
        }

        fetch(`${API_URL}/api/addressList`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
        })
            .then(res => {
                if (!res.ok) throw new Error(`Server error: ${res.status}`);
                return res.json();
            })
            .then(data => {
                const id = data._id || data.id;
                setCreatedId(id);
                if (onCreated) onCreated(id);
            })
            .catch(err => setError(err.message))
            .finally(() => setSubmitting(false));
    };

    // Fields from this form that would change on an existing listing. address1, city, state and
    // zip are left as they are; address2 is only filled in when the listing has none.
    const buildExistingPatch = (match) => {
        const patch = {};
        const changes = [];
        const add = (field, label, value, current) => {
            if (value === '' || value === undefined || String(value) === String(current ?? '')) return;
            patch[field] = value;
            changes.push(`${label}: ${current || '—'} → ${value}`);
        };
        add('firstName', 'First name', firstName.trim(), match.firstName);
        add('lastName', 'Last name', lastName.trim(), match.lastName);
        add('phoneNumber', 'Phone', phoneNumber.trim(), match.phoneNumber);
        if (!isNaN(parseInt(unitId))) add('unitId', 'Unit', parseInt(unitId), match.unitId);
        if (!(match.address2 || '').trim()) add('address2', 'Address line 2', address2.trim(), '');
        if (match.inactive) {
            patch.inactive = false;
            changes.push('Status: Inactive → Active');
        }
        return { patch, changes };
    };

    const putJson = (url, body) => fetch(url, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
    }).then(res => res.json().catch(() => ({})).then(data => {
        if (!res.ok) throw new Error(data.error || `Server error: ${res.status}`);
        return data;
    }));

    // Save this form onto an existing listing (activating it if needed) instead of creating a duplicate.
    const handleUseExisting = (match) => {
        if (comment.trim() && !response) {
            setError('Pick a Response to log this visit on the existing listing.');
            return;
        }
        const { patch } = buildExistingPatch(match);
        setError('');
        setSubmitting(true);
        const update = Object.keys(patch).length > 0
            ? putJson(`${API_URL}/api/addressList/${match._id}`, patch)
            : Promise.resolve();
        update
            .then(() => {
                if (!response) return null;
                return putJson(`${API_URL}/api/addressList/visit/${match._id}`, {
                    lastmodifieddate: `${visitDate}T00:00:00Z`,
                    response,
                    comment,
                }).then(() => (
                    // Same rule as the visit log in AddressDetail.
                    ['Invalid', 'Moved', 'Duplicate'].includes(response)
                        ? putJson(`${API_URL}/api/addressList/${match._id}`, { inactive: true })
                        : null
                ));
            })
            .then(() => {
                setConfirmingId(null);
                setUsedExisting({ activated: !!match.inactive });
                setCreatedId(match._id);
                if (onCreated) onCreated(match._id);
            })
            .catch(err => setError(err.message))
            .finally(() => setSubmitting(false));
    };

    const confirmLeaveForm = () => {
        const hasInput = [firstName, lastName, phoneNumber, comment].some(v => v.trim());
        return !hasInput || window.confirm('Open the existing listing? What you entered here will not be saved.');
    };

    const openListing = (match) => {
        navigate(`/address/${match._id}`, { state: { address: match, from: location.pathname, fromState: location.state || {} } });
    };

    const handleOpenExisting = (match) => {
        if (confirmLeaveForm()) openListing(match);
    };

    const handleActivateAndOpen = (match) => {
        if (!confirmLeaveForm()) return;
        setError('');
        setSubmitting(true);
        putJson(`${API_URL}/api/addressList/${match._id}`, { inactive: false })
            .then(() => openListing({ ...match, inactive: false }))
            .catch(err => {
                setError(err.message);
                setSubmitting(false);
            });
    };

    const actionBtn = { padding: '0.25rem 0.6rem', fontSize: '0.8rem', borderRadius: '4px', cursor: 'pointer' };
    const primaryBtn = { ...actionBtn, background: '#e65100', color: '#fff', border: 'none' };

    const renderDuplicateActions = (match) => {
        if (!allowUpdateExisting) {
            return match.inactive ? (
                <button onClick={() => handleActivateAndOpen(match)} disabled={submitting} style={primaryBtn}>
                    {submitting ? 'Activating…' : 'Activate & open'}
                </button>
            ) : (
                <button onClick={() => handleOpenExisting(match)} style={primaryBtn}>Open listing</button>
            );
        }
        if (confirmingId === match._id) {
            const { changes } = buildExistingPatch(match);
            return (
                <div style={{ background: '#fff', border: '1px solid #ffe0b2', borderRadius: '4px', padding: '0.4rem 0.6rem', fontSize: '0.8rem' }}>
                    {changes.length > 0 ? (
                        <>
                            Will update listing #{match._id}:
                            <ul style={{ margin: '0.25rem 0 0.4rem', paddingLeft: '1.2rem' }}>
                                {changes.map(c => <li key={c}>{c}</li>)}
                            </ul>
                        </>
                    ) : (
                        <p style={{ margin: '0 0 0.4rem' }}>Listing #{match._id} already has these details.</p>
                    )}
                    {response && <p style={{ margin: '0 0 0.4rem' }}>Visit "{response}" will be logged on it.</p>}
                    <div style={{ display: 'flex', gap: '0.4rem' }}>
                        <button onClick={() => handleUseExisting(match)} disabled={submitting} style={primaryBtn}>{submitting ? 'Saving…' : 'Confirm'}</button>
                        <button onClick={() => setConfirmingId(null)} disabled={submitting} style={actionBtn}>Cancel</button>
                    </div>
                </div>
            );
        }
        return (
            <div style={{ display: 'flex', gap: '0.4rem' }}>
                <button onClick={() => setConfirmingId(match._id)} disabled={submitting} style={primaryBtn}>
                    {match.inactive ? 'Activate & save' : 'Update this listing'}
                </button>
                <button onClick={() => handleOpenExisting(match)} style={actionBtn}>Open listing</button>
            </div>
        );
    };

    const fieldStyle = { width: '100%', marginTop: '0.25rem', padding: '0.4rem', boxSizing: 'border-box' };
    const labelStyle = { display: 'block', marginBottom: '0.75rem', fontWeight: 500 };

    if (createdId) {
        return (
            <div style={{ padding: '1.5rem', border: '1px solid #4caf50', borderRadius: '8px', background: '#f1faf1', maxWidth: '420px', margin: '1rem auto' }}>
                <h3 style={{ margin: '0 0 0.5rem', color: '#2e7d32' }}>
                    {usedExisting ? (usedExisting.activated ? 'Listing Activated' : 'Listing Updated') : 'Address Created'}
                </h3>
                <p style={{ margin: '0 0 0.25rem' }}>{usedExisting ? 'Existing ID' : 'New ID'}: <strong>{createdId}</strong></p>
                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
                    <button onClick={() => { setCreatedId(null); setUsedExisting(null); setConfirmingId(null); setFirstName(''); setLastName(''); setAddress1(''); setAddress2(''); setCity(''); setAddrState(''); setZipcode(''); setPhoneNumber(''); setResponse(''); setComment(''); setVisitDate(localDateString()); }}>
                        Add Another
                    </button>
                    {onClose && <button onClick={onClose}>Close</button>}
                </div>
            </div>
        );
    }

    return (
        <div style={{ padding: '1.5rem', border: '1px solid #ccc', borderRadius: '8px', maxWidth: '420px', margin: '1rem auto', background: '#fff' }}>
            <h3 style={{ margin: '0 0 1rem' }}>Add New Address</h3>

            <label style={labelStyle}>
                Masjid ID
                <input type="text" value={masjidID} readOnly style={{ ...fieldStyle, background: '#f0f0f0', cursor: 'not-allowed' }} />
            </label>

            <label style={labelStyle}>
                Unit
                <select value={unitId} onChange={e => setUnitId(e.target.value)} style={fieldStyle}>
                    {unitOptions.map(u => <option key={u} value={u}>{u}</option>)}
                </select>
            </label>

            <label style={labelStyle}>
                First Name <span style={{ color: 'red' }}>*</span>
                <input type="text" value={firstName} onChange={e => setFirstName(e.target.value)} style={fieldStyle} placeholder="First name" />
            </label>

            <label style={labelStyle}>
                Last Name <span style={{ color: 'red' }}>*</span>
                <input type="text" value={lastName} onChange={e => setLastName(e.target.value)} style={fieldStyle} placeholder="Last name" />
            </label>

            <label style={labelStyle}>
                Address Line 1 <span style={{ color: 'red' }}>*</span>
                <input type="text" value={address1} onChange={e => setAddress1(e.target.value)} style={fieldStyle} placeholder="Street address" />
            </label>

            <label style={labelStyle}>
                Address Line 2 <span style={{ color: '#999', fontWeight: 400, fontSize: '0.85rem' }}>(optional — Apt, Suite, etc.)</span>
                <input type="text" value={address2} onChange={e => setAddress2(e.target.value)} style={fieldStyle} placeholder="Apt / Suite / Unit" />
            </label>

            <DuplicateAddressWarning {...dupes} renderActions={renderDuplicateActions} />

            <div style={{ display: 'flex', gap: '0.5rem' }}>
                <label style={{ ...labelStyle, flex: 2 }}>
                    City
                    <input type="text" value={city} onChange={e => setCity(e.target.value)} style={fieldStyle} placeholder="City" />
                </label>
                <label style={{ ...labelStyle, flex: 1 }}>
                    State
                    <input type="text" value={addrState} onChange={e => setAddrState(e.target.value)} style={fieldStyle} placeholder="IL" maxLength={2} />
                </label>
                <label style={{ ...labelStyle, flex: 1 }}>
                    Zip
                    <input type="text" value={zipcode} onChange={e => setZipcode(e.target.value)} style={fieldStyle} placeholder="60601" maxLength={10} />
                </label>
            </div>

            <label style={labelStyle}>
                Phone Number
                <input type="tel" value={phoneNumber} onChange={e => setPhoneNumber(e.target.value)} style={fieldStyle} placeholder="Phone number" />
            </label>

            <hr style={{ margin: '1rem 0', borderColor: '#eee' }} />
            <h4 style={{ margin: '0 0 0.75rem', fontWeight: 500 }}>Visitation Log (optional)</h4>

            <label style={labelStyle}>
                Response
                <select value={response} onChange={e => setResponse(e.target.value)} style={fieldStyle}>
                    <option value="">— select —</option>
                    {RESPONSE_OPTIONS.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
            </label>

            <label style={labelStyle}>
                Comment
                <textarea value={comment} onChange={e => setComment(e.target.value)} rows={3} style={fieldStyle} placeholder="Notes from visit" />
            </label>

            <label style={labelStyle}>
                Date
                <input type="date" value={visitDate} onChange={e => setVisitDate(e.target.value)} style={fieldStyle} />
            </label>

            {error && <p style={{ color: '#d32f2f', margin: '0.5rem 0', fontSize: '0.9rem' }}>{error}</p>}

            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                <button onClick={handleSubmit} disabled={submitting} style={{ padding: '0.5rem 1rem', background: '#1976d2', color: '#fff', border: 'none', borderRadius: '4px', cursor: submitting ? 'not-allowed' : 'pointer', opacity: submitting ? 0.6 : 1 }}>
                    {submitting ? 'Saving…' : 'Add Address'}
                </button>
                {onClose && <button onClick={onClose} style={{ padding: '0.5rem 1rem' }}>Cancel</button>}
            </div>
        </div>
    );
}

export default AddAddress;
