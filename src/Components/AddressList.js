import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Modal, Button } from 'react-bootstrap';
import AddressDetail from './AddressDetail';
import { formatDate } from '../utils';


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
                        <th>Name</th>
                        <th>Address</th>
                        <th>Area</th>
                        <th>Comments</th>
                        <th>Last Response</th>
                        <th>Date</th>
                    </tr>
                </thead>
                <tbody>
                    {(() => {
                        const sorted = [...addressList].sort((a, b) => {
                            const aArea = (a.area || '').toLowerCase();
                            const bArea = (b.area || '').toLowerCase();
                            if (aArea < bArea) return -1;
                            if (aArea > bArea) return 1;
                            const dateA = new Date((a.lastModifiedDate?.$date) ?? a.lastModifiedDate);
                            const dateB = new Date((b.lastModifiedDate?.$date) ?? b.lastModifiedDate);
                            return dateB - dateA;
                        });

                        const groups = sorted.reduce((acc, address) => {
                            const area = address.area || '(No Area)';
                            if (!acc[area]) acc[area] = [];
                            acc[area].push(address);
                            return acc;
                        }, {});

                        return Object.entries(groups).flatMap(([area, addresses]) => [
                            <tr key={`group-${area}`}>
                                <td colSpan={8} style={{ background: '#e8eaf6', fontWeight: 'bold', padding: '6px 8px', fontSize: '1em' }}>
                                    {area} ({addresses.length})
                                </td>
                            </tr>,
                            ...addresses.map(address => (
                                <tr key={address._id}>
                                    <td>
                                        <Link to={{ pathname: `/address/${address._id}`, state: { address } }}>
                                            {address.masjidId}-{address.unitId}-{address._id}
                                        </Link>
                                    </td>
                                    <td>
                                        <a href="#" onClick={(e) => { e.preventDefault(); handleOpen(address); }}>
                                            {address._id}
                                        </a>
                                    </td>
                                    <td>{`${address.firstName || ''} ${address.lastName || ''}`.trim()}</td>
                                    <td>{address.address1}{address.city ? `, ${address.city}` : ''}{address.state ? `, ${address.state}` : ''}</td>
                                    <td>{address.area}</td>
                                    <td>
                                        {[...address.visitHistory]
                                            .filter(v => v.comments && v.comments.trim() !== '')
                                            .sort((a, b) => {
                                                const dA = new Date((a.createdDate?.$date) ?? a.createdDate);
                                                const dB = new Date((b.createdDate?.$date) ?? b.createdDate);
                                                return dB - dA;
                                            })
                                            .map((v, i) => (
                                                <div key={i} style={{ fontSize: '0.85em', borderBottom: i > 0 ? '1px dotted #ccc' : 'none', paddingBottom: '2px', marginBottom: '2px' }}>
                                                    <span style={{ color: '#888', marginRight: '4px' }}>{formatDate(v.createdDate)}:</span>
                                                    {v.comments}
                                                </div>
                                            ))
                                        }
                                    </td>
                                    <td>{address.visitHistory.length > 0 ? address.visitHistory[address.visitHistory.length - 1].response : ''}</td>
                                    <td>{address.visitHistory.length > 0 ? formatDate(address.visitHistory[address.visitHistory.length - 1].createdDate) : ''}</td>
                                </tr>
                            ))
                        ]);
                    })()}
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