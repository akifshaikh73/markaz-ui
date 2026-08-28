import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { formatDate } from '../utils';

function AddressRow({ address, isSelected, onToggle, isUnitSelected = false, onUnitToggle, isAdmin = false }) {
    const location = useLocation();
    const visitHistory = Array.isArray(address.visitHistory) ? address.visitHistory : [];

    const commentsWithDate = [...visitHistory]
        .filter(v => v.comments && v.comments.trim() !== '')
        .sort((a, b) => {
            const dA = new Date((a.createdDate?.$date) ?? a.createdDate);
            const dB = new Date((b.createdDate?.$date) ?? b.createdDate);
            return dB - dA;
        });

    const lastVisit = visitHistory.length > 0 ? visitHistory[visitHistory.length - 1] : null;

    return (
        <tr>
            <td className="m-u-id-col">
                {address.masjidId}-{address.unitId}-{address._id}
            </td>
            <td>
                <input
                    type="checkbox"
                    checked={!!isSelected}
                    onChange={onToggle}
                    title="Select for area assignment"
                    style={{ marginRight: '5px', cursor: 'pointer', accentColor: '#1976d2' }}
                />
                <Link to={`/address/${address._id}`} state={{ address, from: `${location.pathname}${location.search}` }} replace>
                    {address._id}
                </Link>
            </td>
            <td>{`${address.firstName || ''} ${address.lastName || ''}`.trim()}</td>
            <td>{[address.address1, address.address2].filter(Boolean).join(', ')}</td>
            {isAdmin && (
                <td>
                    <input type="checkbox" checked={!!isUnitSelected} onChange={onUnitToggle} style={{ marginRight: '5px', cursor: 'pointer' }} />
                    {address.unitId}
                </td>
            )}
            <td>
                {address.area}
            </td>
            <td>
                {commentsWithDate.map((v, i) => (
                    <div
                        key={`${address._id}-comment-${i}`}
                        style={{ fontSize: '0.85em', borderBottom: i > 0 ? '1px dotted #ccc' : 'none', paddingBottom: '2px', marginBottom: '2px' }}
                    >
                        <span style={{ color: '#888', marginRight: '4px' }}>{formatDate(v.createdDate)}:</span>
                        {v.comments}
                    </div>
                ))}
            </td>
            <td>{lastVisit ? lastVisit.response : ''}</td>
            <td>{lastVisit ? formatDate(lastVisit.createdDate) : ''}</td>
        </tr>
    );
}

export default AddressRow;
