import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Link } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';

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
                <p>ID: {address._id}</p>


                <label>
                    First Name:
                    <input type="text" value={firstName} placeholder="firstName" onChange={e => setFirstName(e.target.value)} />
                </label>

                <label>
                    Last Name:
                    <input type="text" value={lastName} placeholder='lastName' onChange={e => setLastName(e.target.value)} />
                </label>
            </div>
            <div>
                <label>
                    Masjid ID: {address.masjidId}
                </label>
            </div>
            <div>
                <label>
                    Unit ID: {address.unitId}
                </label>
            </div>
            <div>
                <label>
                    Address: {address.address1}
                </label>
            </div>
            <div>
                <label>
                    City: {address.city}
                </label>
            </div>
            <div>
                <label>
                    State: {address.state}
                </label>
            </div>
            <div>
                <label>
                    Zipcode: {address.zipcode}
                </label>
            </div>
            <div>
                <label>Phone Number: {address.phoneNumber}</label>
            </div>
            <div>
                <label>Latitude: {address.latitude}</label>
            </div>
            <div>
                <label>Longitude: {address.longitude}</label>
            </div>
            <div>
                <label>Best Time: {address.bestTime}</label>
            </div>
            <div>
                <label>Profession: {address.profession}</label>
            </div>
            <div>
                <label>Inactive: {address.inactive ? 'Yes' : 'No'}</label>
            </div>
            <div>
                <label>Met: {address.met ? 'Yes' : 'No'}</label>
            </div>
            <div>
                <label>Last Modified Date: {address.lastModifiedDate}</label>
            </div>

            <div>
                <h3>Visit History:</h3>
                {address.visitHistory && address.visitHistory.map((visit, index) => (
                    <div key={index}>
                        <p>Response: {visit.response}</p>
                        <p>Comments: {visit.comments}</p>
                        <p>Created Date: {visit.createdDate}</p>
                    </div>
                ))}
            </div>

            <div>
                <h3>Students:</h3>
                {address.students && address.students.length > 0 ? (
                    address.students.map((student, index) => (
                        <div key={index}>
                            {/* Replace this with the actual student fields */}
                            <p>Student {index + 1}: {student.name}</p>
                        </div>
                    ))
                ) : (
                    <p>No students.</p>
                )}
            </div>
            <button onClick={handleUpdate}>Update</button>
            {
                !isModal && (
                    <div>
                        <button onClick={handleNavigation}>Back to Landing Page</button>
                    </div>)
            }
        </div>
    );
}

export default AddressDetail;