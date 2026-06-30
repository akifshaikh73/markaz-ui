import React from 'react';
import { Link } from 'react-router-dom';
import { formatDate } from '../utils';

function AddressRow({ address, isSelected, onToggle }) {
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
                <Link to={{ pathname: `/address/${address._id}`, state: { address } }}>
                    {address._id}
                </Link>
            </td>
            <td>{`${address.firstName || ''} ${address.lastName || ''}`.trim()}</td>
            <td>{address.address1}{address.city ? `, ${address.city}` : ''}{address.state ? `, ${address.state}` : ''}</td>
            <td>
                <input type="checkbox" checked={!!isSelected} onChange={onToggle} style={{ marginRight: '5px', cursor: 'pointer' }} />
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
