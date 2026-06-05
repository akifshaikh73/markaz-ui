import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { formatDate } from '../utils';
import { getAdmin, MASJID_UNITS } from '../config';
import StatusBadges from './StatusBadges';

function AddressDetail({ address: initialAddress, isModal }) {
    const { id } = useParams();
    const API_URL = process.env.REACT_APP_API_URL || '';
    const [address, setAddress] = useState(initialAddress || {});
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [originalFirstName, setOriginalFirstName] = useState('');
    const [originalLastName, setOriginalLastName] = useState('');
    const [unitId, setUnitId] = useState('');
    const [originalUnitId, setOriginalUnitId] = useState('');
    const [response, setResponse] = useState('');
    const [comments, setComments] = useState('');
    const [modifiedDate, setModifiedDate] = useState(new Date().toISOString().split('T')[0]);
    const [isAdmin, setIsAdmin] = useState(getAdmin());
    const navigate = useNavigate();

    const RESPONSE_OPTIONS = ['Met', 'No Response', 'Left Message', 'Moved', 'Invalid', 'Do Not Disturb', 'Duplicate', 'Rented'];

    useEffect(() => {
        if (!initialAddress) {
            fetch(`${API_URL}/api/addressList/search/${id}`)
                .then(response => response.json())
                .then(data => {
                    console.log(data); // Log the fetched data
                    setAddress(data);
                    setFirstName(data.firstName);
                    setLastName(data.lastName);
                    setOriginalFirstName(data.firstName);
                    setOriginalLastName(data.lastName);
                    setUnitId(data.unitId);
                    setOriginalUnitId(data.unitId);
                });
        } else {
            setAddress(initialAddress);
            setFirstName(initialAddress.firstName);
            setLastName(initialAddress.lastName);
            setOriginalFirstName(initialAddress.firstName);
            setOriginalLastName(initialAddress.lastName);
            setUnitId(initialAddress.unitId);
            setOriginalUnitId(initialAddress.unitId);
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
            setModifiedDate(new Date().toISOString().split('T')[0]);
        })
        .catch(err => console.error('Error:', err));
    };

    const handleNavigation = () => {
        navigate(`/landing/${address.masjidId}/${address.unitId}`, { state: { isLoggedIn: true } });
    };

    return (
        <div>
            <div>
                <h2>Address Detail</h2>
                <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                    <StatusBadges />
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
            </div>
            <div>
                <label><strong>Masjid ID:</strong> {address.masjidId}</label>
            </div>
            <div>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end' }}>
                    <label>
                        <strong>Unit ID:</strong>
                        <select value={unitId} onChange={e => setUnitId(e.target.value)} disabled={!isAdmin} style={!isAdmin ? { background: '#f0f0f0', cursor: 'not-allowed', marginLeft: '0.5rem', padding: '0.25rem' } : { marginLeft: '0.5rem', padding: '0.25rem' }}>
                            {MASJID_UNITS[address.masjidId] && MASJID_UNITS[address.masjidId].map(u => (
                                <option key={u} value={u}>{u}</option>
                            ))}
                        </select>
                    </label>
                    <button onClick={handleUpdateUnit} disabled={!isAdmin || unitId === originalUnitId} style={!isAdmin || unitId === originalUnitId ? { opacity: 0.5, cursor: 'not-allowed', padding: '0.5rem 1rem' } : { padding: '0.5rem 1rem' }}>Update</button>
                </div>
            </div>
            <div>
                <label><strong>Address:</strong> {address.address1}</label>
            </div>
            <div>
                <label><strong>Area:</strong> {address.area}</label>
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
                <label><strong>Last Modified Date:</strong> {formatDate(address.lastModifiedDate)}</label>
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
            <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                {!isModal && (
                    <button onClick={handleNavigation}>Back to Landing Page</button>
                )}
            </div>
        </div>
    );
}

export default AddressDetail;