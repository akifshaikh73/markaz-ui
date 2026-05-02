import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Modal, Button } from 'react-bootstrap'; // Assuming you're using react-bootstrap for modals
import AddressDetail from './AddressDetail'; // Import the AddressDetail component


function AddressList({ initialAddressList }) {
    console.log(initialAddressList);
    const [addressList, setAddressList] = useState(initialAddressList || []);
    const [selectedAddress, setSelectedAddress] = useState(null);

    const handleOpen = (address) => {
        setSelectedAddress(address);
    };

    const handleClose = () => {
        setSelectedAddress(null);
    };

    useEffect(() => {
        setAddressList(initialAddressList);
    }, [initialAddressList]);

    return (
        <div>
            <table>
                <thead>
                    <tr>
                        <th>M-U-ID</th>
                        <th>ID</th>
                        <th>First Name</th>
                        <th>Last Name</th>
                        <th>Address</th>
                        <th>Last Comment</th>
                        <th>Last Response</th>
                        <th>Date</th>
                    </tr>
                </thead>
                <tbody>
                    {addressList.map(address => (
                        <tr key={address._id}>
                            <td>
                                <Link to={{
                                    pathname: `/address/${address._id}`,
                                    state: { address: address }
                                }}>
                                    {address.masjidId}-{address.unitId}-{address._id}
                                </Link>
                            </td>
                            <td>
                                <a href="#" onClick={(e) => { e.preventDefault(); handleOpen(address); }}>
                                    {address._id}
                                </a>
                            </td>
                            <td>{address.firstName}</td>
                            <td>{address.lastName}</td>
                            <td>{address.address1} , {address.city},{address.state}</td>
                            <td>{address.visitHistory.length > 0 ? address.visitHistory[address.visitHistory.length - 1].comments : ''}</td>
                            <td>{address.visitHistory.length > 0 ? address.visitHistory[address.visitHistory.length - 1].response : ''}</td>
                            <td>{address.visitHistory.length > 0 ? new Date(address.visitHistory[address.visitHistory.length - 1].createdDate).toLocaleDateString() : ''}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
            <Modal show={selectedAddress !== null} onHide={handleClose}>
                <Modal.Body>
                    {selectedAddress && <AddressDetail address={selectedAddress} isModal={true}/>}
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={handleClose}>
                        Close
                    </Button>
                </Modal.Footer>
            </Modal>
        </div>
    );
}

export default AddressList;