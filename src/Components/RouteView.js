import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Tooltip, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { formatDate } from '../utils';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
    iconUrl:       require('leaflet/dist/images/marker-icon.png'),
    shadowUrl:     require('leaflet/dist/images/marker-shadow.png'),
});

const makeNumberedIcon = (n) => L.divIcon({
    className: '',
    html: `<div style="background:#1976d2;color:#fff;border-radius:50%;width:28px;height:28px;display:flex;align-items:center;justify-content:center;font-weight:bold;font-size:13px;border:2px solid #fff;box-shadow:0 1px 4px rgba(0,0,0,0.4)">${n}</div>`,
    iconSize: [28, 28], iconAnchor: [14, 14],
});

function FitBounds({ positions }) {
    const map = useMap();
    useEffect(() => {
        if (positions.length > 1) map.fitBounds(positions, { padding: [50, 50] });
    }, [map, positions]);
    return null;
}

function RouteView() {
    const location = useLocation();
    const navigate = useNavigate();
    const API_URL = process.env.REACT_APP_API_URL || '';

    // listings passed via route state; fall back to fetching by ids
    const { listings: initialListings = [], masjidID, unitID } = location.state || {};

    const [listings, setListings] = useState(initialListings);
    const [routePolyline, setRoutePolyline] = useState(null);
    const [routeLoading, setRouteLoading] = useState(false);
    const [totalDistance, setTotalDistance] = useState(null);
    const [totalDuration, setTotalDuration] = useState(null);
    const [nearbyCount, setNearbyCount] = useState(5);
    const [nearbyLoading, setNearbyLoading] = useState(false);
    const [nearbyError, setNearbyError] = useState('');

    const handleFindNearby = () => {
        const source = listings[0];
        if (!source) return;
        setNearbyLoading(true);
        setNearbyError('');
        fetch(`${API_URL}/api/addressList/${source._id}/nearby?count=${nearbyCount}`)
            .then(r => r.json())
            .then(data => {
                if (data.error) { setNearbyError(data.error); return; }
                // Merge source + nearby, deduplicating by _id
                const merged = [source, ...data.filter(l => l._id !== source._id)];
                setListings(merged);
            })
            .catch(() => setNearbyError('Failed to fetch nearby listings'))
            .finally(() => setNearbyLoading(false));
    };

    const plotted = listings.filter(l => l.latitude && l.longitude);

    // Fetch OSRM route whenever plotted points change
    useEffect(() => {
        if (plotted.length < 2) { setRoutePolyline(null); return; }
        setRouteLoading(true);
        const coords = plotted.map(l => `${l.longitude},${l.latitude}`).join(';');
        fetch(`https://router.project-osrm.org/route/v1/driving/${coords}?overview=full&geometries=geojson`)
            .then(r => r.json())
            .then(osrm => {
                if (osrm.routes && osrm.routes[0]) {
                    const route = osrm.routes[0];
                    setRoutePolyline(route.geometry.coordinates.map(([lng, lat]) => [lat, lng]));
                    setTotalDistance((route.distance / 1609.34).toFixed(1)); // metres → miles
                    setTotalDuration(Math.round(route.duration / 60));       // seconds → minutes
                }
            })
            .catch(() => {})
            .finally(() => setRouteLoading(false));
    }, [listings]); // eslint-disable-line react-hooks/exhaustive-deps

    const center = plotted.length > 0
        ? [plotted[0].latitude, plotted[0].longitude]
        : [39.5, -98.35];

    if (listings.length === 0) {
        return (
            <div style={{ margin: '2rem', padding: '1.5rem', border: '1px solid #ddd', borderRadius: '8px' }}>
                <h2>Route</h2>
                <p>No listings selected. Go back to the address list and select listings to build a route.</p>
                <button onClick={() => navigate(-1)}>← Back</button>
            </div>
        );
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
            {/* Toolbar */}
            <div style={{ padding: '10px 16px', background: '#f5f5f5', borderBottom: '1px solid #ddd', display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                <button onClick={() => navigate(-1)}>← Back to List</button>
                <strong>Route</strong>
                <span style={{ color: '#555', fontSize: '0.9em' }}>
                    {plotted.length} stop{plotted.length !== 1 ? 's' : ''} plotted
                    {listings.length - plotted.length > 0 && ` · ${listings.length - plotted.length} without coordinates`}
                </span>
                {routeLoading && <span style={{ color: '#888', fontSize: '0.85em' }}>Fetching route…</span>}
                {totalDistance && !routeLoading && (
                    <span style={{ color: '#1976d2', fontWeight: 500, fontSize: '0.9em' }}>
                        ~{totalDistance} mi · ~{totalDuration} min driving
                    </span>
                )}
                {listings.length === 1 && (
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginLeft: 'auto', padding: '4px 10px', background: '#fff3e0', border: '1px solid #ffb74d', borderRadius: '6px' }}>
                        <label style={{ margin: 0, fontWeight: 500, fontSize: '0.88em' }}>
                            Find nearby:
                            <input
                                type="number"
                                min="1"
                                max="50"
                                value={nearbyCount}
                                onChange={e => setNearbyCount(Math.max(1, parseInt(e.target.value) || 1))}
                                style={{ width: '52px', margin: '0 6px', padding: '2px 4px', textAlign: 'center' }}
                            />
                            listings
                        </label>
                        <button
                            onClick={handleFindNearby}
                            disabled={nearbyLoading}
                            style={{ padding: '3px 10px', background: '#e65100', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 600 }}
                        >
                            {nearbyLoading ? '…' : 'Go'}
                        </button>
                        {nearbyError && <span style={{ color: 'red', fontSize: '0.85em' }}>{nearbyError}</span>}
                    </span>
                )}
            </div>

            {/* Map */}
            <div style={{ flex: 1, minHeight: 0 }}>
                <MapContainer center={center} zoom={13} style={{ height: '100%', width: '100%' }}>
                    <TileLayer
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                    {plotted.length > 0 && (
                        <FitBounds positions={plotted.map(l => [l.latitude, l.longitude])} />
                    )}
                    {routePolyline && (
                        <Polyline positions={routePolyline} color="#1976d2" weight={4} opacity={0.8} dashArray="8 4" />
                    )}
                    {plotted.map((l, i) => (
                        <Marker key={l._id} position={[l.latitude, l.longitude]} icon={makeNumberedIcon(i + 1)}
                            eventHandlers={{ click: () => navigate(`/address/${l._id}`) }}>
                            <Tooltip direction="top" opacity={0.95}>
                                <div style={{ lineHeight: 1.6 }}>
                                    <strong>Stop {i + 1}: {[l.firstName, l.lastName].filter(Boolean).join(' ') || '—'}</strong><br />
                                    {[l.address1, l.address2].filter(Boolean).join(', ')}<br />
                                    {l.area && <em>{l.area}</em>}<br />
                                    <span>Last Met: {formatDate(l.lastModifiedDate)}</span>
                                </div>
                            </Tooltip>
                        </Marker>
                    ))}
                </MapContainer>
            </div>

            {/* Stop list */}
            <div style={{ maxHeight: '220px', overflowY: 'auto', borderTop: '1px solid #ddd', background: '#fff' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem' }}>
                    <thead style={{ position: 'sticky', top: 0, background: '#f0f0f0' }}>
                        <tr>
                            <th style={th}>#</th>
                            <th style={th}>ID</th>
                            <th style={th}>Name</th>
                            <th style={th}>Address</th>
                            <th style={th}>Area</th>
                            <th style={th}>Last Met</th>
                            <th style={th}>Has Coords</th>
                        </tr>
                    </thead>
                    <tbody>
                        {listings.map((l, i) => (
                            <tr key={l._id} style={{ borderBottom: '1px solid #eee', cursor: 'pointer' }}
                                onClick={() => navigate(`/address/${l._id}`)}>
                                <td style={td}>{i + 1}</td>
                                <td style={td}>{l._id}</td>
                                <td style={td}>{[l.firstName, l.lastName].filter(Boolean).join(' ') || '—'}</td>
                                <td style={td}>{[l.address1, l.address2].filter(Boolean).join(', ')}</td>
                                <td style={td}>{l.area || '—'}</td>
                                <td style={td}>{formatDate(l.lastModifiedDate)}</td>
                                <td style={td}>{l.latitude && l.longitude ? '✅' : '❌'}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

const th = { textAlign: 'left', padding: '6px 10px', borderBottom: '2px solid #ccc', fontWeight: 600 };
const td = { padding: '5px 10px' };

export default RouteView;
