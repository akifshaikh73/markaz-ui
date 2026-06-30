import React, { useState, useEffect } from 'react';
import { Modal, Button } from 'react-bootstrap';
import AddressDetail from './AddressDetail';
import AddressRow from './AddressRow';


function AddressList({ initialAddressList, selectedIds = [], onSelectionChange }) {
    console.log(initialAddressList);
    const [addressList, setAddressList] = useState(initialAddressList || []);
    const [selectedAddress, setSelectedAddress] = useState(null);

    const handleToggle = (id) => {
        if (selectedIds.includes(id)) {
            onSelectionChange(selectedIds.filter(i => i !== id));
        } else {
            onSelectionChange([...selectedIds, id]);
        }
    };

    const handleSelectAll = (allIds) => {
        const allSelected = allIds.every(id => selectedIds.includes(id));
        if (allSelected) {
            onSelectionChange(selectedIds.filter(id => !allIds.includes(id)));
        } else {
            const merged = Array.from(new Set([...selectedIds, ...allIds]));
            onSelectionChange(merged);
        }
    };

    const handleClose = () => {
        setSelectedAddress(null);
    };

    useEffect(() => {
        setAddressList(initialAddressList || []);
    }, [initialAddressList]);

    return (
        <div>
            <table>
                <thead>
                    <tr>
                        <th className="m-u-id-col">M-U-ID</th>
                        <th>ID</th>
                        <th>Name</th>
                        <th>Address</th>
                        {(() => {
                            const allIds = addressList.map(a => a._id);
                            const allSelected = allIds.length > 0 && allIds.every(id => selectedIds.includes(id));
                            const someSelected = allIds.some(id => selectedIds.includes(id));
                            return (
                                <th>
                                    <input
                                        type="checkbox"
                                        checked={allSelected}
                                        ref={el => { if (el) el.indeterminate = someSelected && !allSelected; }}
                                        onChange={() => handleSelectAll(allIds)}
                                        style={{ marginRight: '4px', cursor: 'pointer' }}
                                    />
                                    Neighborhood
                                </th>
                            );
                        })()}
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
                            
                            // Within same area, sort by date descending
                            const dateA = new Date((a.lastModifiedDate?.$date) ?? a.lastModifiedDate);
                            const dateB = new Date((b.lastModifiedDate?.$date) ?? b.lastModifiedDate);
                            const dateATime = isNaN(dateA.getTime()) ? 0 : dateA.getTime();
                            const dateBTime = isNaN(dateB.getTime()) ? 0 : dateB.getTime();
                            if (dateBTime !== dateATime) return dateBTime - dateATime;
                            
                            // If same date, sort by name then ID
                            const aName = `${a.firstName || ''} ${a.lastName || ''}`.trim().toLowerCase();
                            const bName = `${b.firstName || ''} ${b.lastName || ''}`.trim().toLowerCase();
                            if (aName !== bName) return aName.localeCompare(bName);
                            return (a._id || '').localeCompare(b._id || '');
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
                                <AddressRow key={address._id} address={address} isSelected={selectedIds.includes(address._id)} onToggle={() => handleToggle(address._id)} />
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