import React from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Tooltip } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { formatDate } from '../utils';

// Fix default marker icon broken by webpack
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
    iconUrl:       require('leaflet/dist/images/marker-icon.png'),
    shadowUrl:     require('leaflet/dist/images/marker-shadow.png'),
});

function MapView() {
    const location = useLocation();
    const navigate = useNavigate();
    const { masjidID, unitID } = useParams();

    if (!location.state || !location.state.isLoggedIn) {
        navigate('/login');
        return null;
    }

    const addressList = JSON.parse(localStorage.getItem('addressList')) || [];
    const mapped = addressList.filter(a => a.latitude && a.longitude);
    const center = mapped.length > 0
        ? [mapped[0].latitude, mapped[0].longitude]
        : [39.5, -98.35]; // US center fallback

    const lastComment = (a) => {
        const withComments = [...(a.visitHistory || [])]
            .filter(v => v.comments && v.comments.trim())
            .sort((x, y) => {
                const dX = new Date((x.createdDate?.$date) ?? x.createdDate);
                const dY = new Date((y.createdDate?.$date) ?? y.createdDate);
                return dY - dX;
            });
        return withComments.length > 0 ? withComments[0] : null;
    };

    return (
        <div style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: '8px 12px', display: 'flex', alignItems: 'center', gap: '1rem', background: '#f5f5f5', borderBottom: '1px solid #ddd' }}>
                <button onClick={() => navigate(`/landing/${masjidID}/${unitID}`, { state: { isLoggedIn: true } })}>
                    ← Back to List
                </button>
                <strong>Map View</strong>
                <span style={{ color: '#666', fontSize: '0.9em' }}>{mapped.length} addresses plotted</span>
            </div>
            <MapContainer center={center} zoom={13} style={{ flex: 1 }}>
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                {mapped.map(address => {
                    const comment = lastComment(address);
                    const lastVisit = (address.visitHistory || []).slice(-1)[0];
                    return (
                        <Marker key={address._id} position={[address.latitude, address.longitude]}>
                            <Tooltip direction="top" offset={[0, -10]} opacity={1}>
                                <div style={{ minWidth: '180px', lineHeight: '1.6' }}>
                                    <div><strong>{address.firstName} {address.lastName}</strong></div>
                                    <div>{address.address1}</div>
                                    <div>{address.city}{address.state ? `, ${address.state}` : ''}</div>
                                    {address.area && <div><em>{address.area}</em></div>}
                                    {lastVisit && (
                                        <div style={{ marginTop: '4px', borderTop: '1px solid #ccc', paddingTop: '4px' }}>
                                            <div><strong>Last Response:</strong> {lastVisit.response}</div>
                                            <div><strong>Date:</strong> {formatDate(lastVisit.createdDate)}</div>
                                        </div>
                                    )}
                                    {comment && (
                                        <div><strong>Comment:</strong> {comment.comments}</div>
                                    )}
                                </div>
                            </Tooltip>
                        </Marker>
                    );
                })}
            </MapContainer>
        </div>
    );
}

export default MapView;
