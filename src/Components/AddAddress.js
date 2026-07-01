import React, { useState } from 'react';
import { localDateString } from '../utils';

const RESPONSE_OPTIONS = ['Met', 'No Response', 'Left Message', 'Moved', 'Invalid', 'Do Not Disturb', 'Duplicate', 'Rented'];

function AddAddress({ masjidID, unitOptions, onClose, onCreated }) {
    const API_URL = process.env.REACT_APP_API_URL || '';

    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [address1, setAddress1] = useState('');
    const [address2, setAddress2] = useState('');
    const [city, setCity] = useState('');
    const [addrState, setAddrState] = useState('');
    const [zipcode, setZipcode] = useState('');
    const [unitId, setUnitId] = useState(unitOptions[0] || '');

    const [response, setResponse] = useState('');
    const [comment, setComment] = useState('');
    const [visitDate, setVisitDate] = useState(localDateString());

    const [createdId, setCreatedId] = useState(null);
    const [error, setError] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = () => {
        if (!firstName.trim() || !lastName.trim() || !address1.trim()) {
            setError('First name, last name and address are required.');
            return;
        }
        setError('');
        setSubmitting(true);

        const fullAddress1 = [address1.trim(), address2.trim()].filter(Boolean).join(', ');
        const body = {
            firstName: firstName.trim(),
            lastName: lastName.trim(),
            address1: fullAddress1,
            ...(city.trim()     && { city: city.trim() }),
            ...(addrState.trim()&& { state: addrState.trim() }),
            ...(zipcode.trim()  && { zipcode: zipcode.trim() }),
            masjidId: parseInt(masjidID),
            unitId: parseInt(unitId),
        };

        body.source = 'render';

        if (response || comment) {
            body.lastModifiedDate = `${visitDate}T00:00:00Z`;
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

    const fieldStyle = { width: '100%', marginTop: '0.25rem', padding: '0.4rem', boxSizing: 'border-box' };
    const labelStyle = { display: 'block', marginBottom: '0.75rem', fontWeight: 500 };

    if (createdId) {
        return (
            <div style={{ padding: '1.5rem', border: '1px solid #4caf50', borderRadius: '8px', background: '#f1faf1', maxWidth: '420px', margin: '1rem auto' }}>
                <h3 style={{ margin: '0 0 0.5rem', color: '#2e7d32' }}>Address Created</h3>
                <p style={{ margin: '0 0 0.25rem' }}>New ID: <strong>{createdId}</strong></p>
                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
                    <button onClick={() => { setCreatedId(null); setFirstName(''); setLastName(''); setAddress1(''); setAddress2(''); setCity(''); setAddrState(''); setZipcode(''); setResponse(''); setComment(''); setVisitDate(localDateString()); }}>
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
