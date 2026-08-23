import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { formatDate, localDateString, RoleBadge } from '../utils';
import { getAdmin } from '../config';
import { useMasjidConfig } from '../hooks/useMasjids';
import StatusBadges from './StatusBadges';

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
    const [response, setResponse] = useState('');
    const [comments, setComments] = useState('');
    const [modifiedDate, setModifiedDate] = useState(localDateString());
    const [isAdmin, setIsAdmin] = useState(getAdmin());
    const [accessDenied, setAccessDenied] = useState(false);
    const navigate = useNavigate();

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
        }
    }, [id, initialAddress, API_URL]);

    useEffect(() => {
        // Check admin status whenever component mounts or when admin status might change
        setIsAdmin(getAdmin());
    }, []);    

    const handleUpdate = () => {
        // Handle the update logic here
        console.log('Updated firstName:', firstName);
        console.log('Updated lastName:', lastName);
        console.log('Address ID:', address.id);
        address.firstName = firstName;
        address.lastName = lastName;
        
        fetch(`${API_URL}/api/addressList/${address._id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                firstName: firstName,
                lastName: lastName,
            }),
        })
        .then(res => res.json())
        .then(data => {
            console.log('Success:', data);
            setOriginalFirstName(firstName);
            setOriginalLastName(lastName);
        })
        .catch((error) => {
            console.error('Error:', error);
        });
    };
    const handleUpdateUnit = () => {
        fetch(`${API_URL}/api/addressList/${address._id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                unitId: unitId,
            }),
        })
        .then(res => res.json())
        .then(data => {
            console.log('Unit updated:', data);
            setOriginalUnitId(unitId);
        })
        .catch((error) => {
            console.error('Error:', error);
        });
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
        navigate(-1);
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

    return (
        <div>
                <h2>Address Detail</h2>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: '0.5rem', flexWrap: 'wrap' }}>
                    <StatusBadges />
                    <RoleBadge />
                    {localStorage.getItem('loginSource') === 'admin' && getAdmin() && (
                        <button onClick={() => navigate('/admin-home')} style={{ fontSize: '0.75rem', color: '#1976d2', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600, padding: 0 }}>⌂ Home</button>
                    )}
                </div>
                <p><strong>ID:</strong> {address._id}</p>

                <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end' }}>
                    <label>
                        <strong>First Name:</strong>
                        <input type="text" value={firstName} placeholder="firstName" onChange={e => setFirstName(e.target.value)} readOnly={!isAdmin} style={!isAdmin ? { background: '#f0f0f0', cursor: 'not-allowed' } : {}} />
                    </label>

                    <label>
                        <strong>Last Name:</strong>
                        <input type="text" value={lastName} placeholder='lastName' onChange={e => setLastName(e.target.value)} readOnly={!isAdmin} style={!isAdmin ? { background: '#f0f0f0', cursor: 'not-allowed' } : {}} />
                    </label>

                    <button onClick={handleUpdate} disabled={!isAdmin || (firstName === originalFirstName && lastName === originalLastName)} style={!isAdmin || (firstName === originalFirstName && lastName === originalLastName) ? { opacity: 0.5, cursor: 'not-allowed', padding: '0.5rem 1rem' } : { padding: '0.5rem 1rem' }}>Update</button>
                </div>
            <div>
                <label><strong>Masjid ID:</strong> {address.masjidId}</label>
            </div>
            <div>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end' }}>
                    <label>
                        <strong>Unit ID:</strong>
                        <select value={unitId} onChange={e => setUnitId(e.target.value)} disabled={!isAdmin} style={!isAdmin ? { background: '#f0f0f0', cursor: 'not-allowed', marginLeft: '0.5rem', padding: '0.25rem' } : { marginLeft: '0.5rem', padding: '0.25rem' }}>
                            {(masjidUnitsMap[String(address.masjidId)] || [unitId]).map(u => (
                                <option key={u} value={String(u)}>{u}</option>
                            ))}
                        </select>
                    </label>
                    <button onClick={handleUpdateUnit} disabled={!isAdmin || unitId === originalUnitId} style={!isAdmin || unitId === originalUnitId ? { opacity: 0.5, cursor: 'not-allowed', padding: '0.5rem 1rem' } : { padding: '0.5rem 1rem' }}>Update</button>
                </div>
            </div>
            <div>
                <label><strong>Address:</strong> {[address.address1, address.address2].filter(Boolean).join(', ')}</label>
            </div>
            <div>
                <label><strong>Neighborhood:</strong> {address.area}</label>
            </div>
            <div>
                <label><strong>City:</strong> {address.city}</label>
            </div>
            <div>
                <label><strong>State:</strong> {address.state}</label>
            </div>
            <div>
                <label><strong>Zipcode:</strong> {address.zipcode}</label>
            </div>
            <div>
                <label><strong>Phone Number:</strong> {address.phoneNumber}</label>
            </div>
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
            <div>
                <label><strong>Best Time:</strong> {address.bestTime}</label>
            </div>
            <div>
                <label><strong>Profession:</strong> {address.profession}</label>
            </div>
            <div>
                <label><strong>Inactive:</strong> {address.inactive ? 'Yes' : 'No'}</label>
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
                    <button onClick={handleUpdateResponse} disabled={!response} style={!response ? { opacity: 0.5, cursor: 'not-allowed' } : {}}>Update Response</button>
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
                {!isModal && (
                    <button onClick={handleNavigation}>← Back</button>
                )}
                <button
                    onClick={() => navigate('/route', { state: { listings: [address] } })}
                    disabled={!address._id}
                    style={{ background: '#e65100', color: '#fff', border: 'none', padding: '0.4rem 1rem', borderRadius: '5px', cursor: 'pointer', fontWeight: 700, fontSize: '0.9rem' }}
                >
                    🗺 Route
                </button>
            </div>
        </div>
    );
}

export default AddressDetail;