import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { formatDate } from '../utils';

function AddressDetail({ address: initialAddress, isModal }) {
    const { id } = useParams();
    console.log(id);
    // Fetch the address details using the id
    const [address, setAddress] = useState(initialAddress || {});
    console.log(address);
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        // Fetch data or perform some other side effect
        if (!initialAddress) {
            fetch(`http://localhost:3000/api/addressList/search/${id}`)
                .then(response => response.json())
                .then(data => {
                    console.log(data); // Log the fetched data
                    setAddress(data);
                    setFirstName(data.firstName);
                    setLastName(data.lastName);
                });
        }
    }, [id, initialAddress]);
    // Only re-run the effect if `address` changes    

    const handleUpdate = () => {
        // Handle the update logic here
        console.log('Updated firstName:', firstName);
        console.log('Updated lastName:', lastName);
        console.log('Address ID:', address.id);
        address.firstName = firstName;
        address.lastName = lastName;
        
        fetch(`http://localhost:3000/api/addressList/${address._id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                firstName: firstName,
                lastName: lastName,
            }),
        })
        .then(response => response.json())
        .then(data => {
            console.log('Success:', data);
        })
        .catch((error) => {
            console.error('Error:', error);
        });
    };
    const handleNavigation = () => {
        navigate(`/landing/${address.masjidId}/${address.unitId}`, { state: { isLoggedIn: true } });
    };

    return (
        <div>
            <div>
                <h2>Address Detail</h2>
                <p><strong>ID:</strong> {address._id}</p>

                <label>
                    <strong>First Name:</strong>
                    <input type="text" value={firstName} placeholder="firstName" onChange={e => setFirstName(e.target.value)} />
                </label>

                <label>
                    <strong>Last Name:</strong>
                    <input type="text" value={lastName} placeholder='lastName' onChange={e => setLastName(e.target.value)} />
                </label>
            </div>
            <div>
                <label><strong>Masjid ID:</strong> {address.masjidId}</label>
            </div>
            <div>
                <label><strong>Unit ID:</strong> {address.unitId}</label>
            </div>
            <div>
                <label><strong>Address:</strong> {address.address1}</label>
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
            <div>
                <label><strong>Latitude:</strong> {address.latitude}</label>
            </div>
            <div>
                <label><strong>Longitude:</strong> {address.longitude}</label>
            </div>
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
                {address.visitHistory && address.visitHistory.map((visit, index) => (
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
                <button onClick={handleUpdate}>Update</button>
                {!isModal && (
                    <button onClick={handleNavigation}>Back to Landing Page</button>
                )}
            </div>
        </div>
    );
}

export default AddressDetail;