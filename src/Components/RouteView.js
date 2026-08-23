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
    const [splitPos, setSplitPos] = useState(60); // Map takes 60% by default
    const [isDragging, setIsDragging] = useState(false);

    // Handle dragging the divider
    useEffect(() => {
        const handleMouseMove = (e) => {
            if (!isDragging) return;
            const container = document.getElementById('route-view-container');
            if (!container) return;
            const rect = container.getBoundingClientRect();
            const newPos = Math.max(20, Math.min(80, ((e.clientY - rect.top) / rect.height) * 100));
            setSplitPos(newPos);
        };
        const handleMouseUp = () => setIsDragging(false);
        if (isDragging) {
            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseup', handleMouseUp);
            return () => {
                document.removeEventListener('mousemove', handleMouseMove);
                document.removeEventListener('mouseup', handleMouseUp);
            };
        }
    }, [isDragging]);

    // listings passed via route state; fall back to localStorage
    const getInitialListings = () => {
        if (location.state?.listings && Array.isArray(location.state.listings)) {
            console.log('[RouteView] Listings from location.state:', location.state.listings);
            return location.state.listings;
        }
        try {
            const saved = localStorage.getItem('addressList');
            if (saved) {
                const parsed = JSON.parse(saved);
                return Array.isArray(parsed) ? parsed : [];
            }
            return [];
        } catch (err) {
            console.error('[RouteView] Error parsing addressList from localStorage:', err);
            return [];
        }
    };

    // location.state may contain masjidID and unitID for context

    const [listings, setListings] = useState(getInitialListings());
    const [routePolyline, setRoutePolyline] = useState(null);
    const [routeLoading, setRouteLoading] = useState(false);
    const [totalDistance, setTotalDistance] = useState(null);
    const [totalDuration, setTotalDuration] = useState(null);
    const [nearbyCount, setNearbyCount] = useState(5);
    const [nearbyLoading, setNearbyLoading] = useState(false);
    const [nearbyError, setNearbyError] = useState('');
    const [selectedIds, setSelectedIds] = useState([]);
    const [selectedArea, setSelectedArea] = useState('');
    const [updateAreaLoading, setUpdateAreaLoading] = useState(false);
    const [updateAreaError, setUpdateAreaError] = useState('');

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

    const handleToggleId = (id) => {
        setSelectedIds(prev => 
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    const handleUpdateArea = () => {
        if (selectedIds.length === 0 || !selectedArea.trim()) return;
        setUpdateAreaLoading(true);
        setUpdateAreaError('');
        
        Promise.all(
            selectedIds.map(id =>
                fetch(`${API_URL}/api/addressList/${id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ area: selectedArea })
                }).then(r => r.json())
            )
        )
        .then(results => {
            if (results.some(r => r.error)) {
                setUpdateAreaError('Some updates failed');
                return;
            }
            // Update local listings with new area
            setListings(listings.map(l => 
                selectedIds.includes(l._id) ? { ...l, area: selectedArea } : l
            ));
            setSelectedIds([]);
            setSelectedArea('');
        })
        .catch(() => setUpdateAreaError('Failed to update area'))
        .finally(() => setUpdateAreaLoading(false));
    };

    const plotted = listings.filter(l => l.latitude && l.longitude);

    // Get unique areas: first from sessionStorage (Landing page cache), then from current listings
    const getMasjidAndUnitFromState = () => {
        if (location.state?.masjidID && location.state?.unitID) {
            return { masjidID: location.state.masjidID, unitID: location.state.unitID };
        }
        return { masjidID: null, unitID: null };
    };

    const { masjidID, unitID } = getMasjidAndUnitFromState();
    const unitAreasKey = masjidID && unitID ? `unitAreas_${masjidID}_${unitID}` : null;
    
    // Try to get areas from sessionStorage (shared with Landing page), fallback to listings
    const getCachedAreas = () => {
        if (unitAreasKey) {
            try {
                const cached = sessionStorage.getItem(unitAreasKey);
                if (cached) {
                    const areas = JSON.parse(cached);
                    if (Array.isArray(areas) && areas.length > 0) {
                        console.log('[RouteView] Loaded areas from sessionStorage:', areas);
                        return areas;
                    }
                }
            } catch (err) {
                console.error('[RouteView] Error loading areas from sessionStorage:', err);
            }
        }
        // Fallback: extract from listings
        const fromListings = Array.from(new Set(
            listings.map(l => l.area).filter(a => a && a.trim())
        )).sort();
        if (fromListings.length > 0) {
            console.log('[RouteView] Loaded areas from listings:', fromListings);
        }
        return fromListings;
    };

    const uniqueAreas = getCachedAreas();

    if (listings.length > 0) {
        console.log('[RouteView] Listings count:', listings.length, 'Unique areas found:', uniqueAreas, 'Sample listing area:', listings[0]?.area);
    }

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
        <div id="route-view-container" style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
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
                {selectedIds.length > 0 && (
                    <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '4px 10px', background: '#e3f2fd', border: '1px solid #64b5f6', borderRadius: '6px' }}>
                        <span style={{ fontWeight: 500, fontSize: '0.88em' }}>{selectedIds.length} selected</span>
                        <input
                            type="text"
                            list="areaList"
                            placeholder={uniqueAreas.length > 0 ? "Select or type area" : "Type new area (no existing areas)"}
                            value={selectedArea}
                            onChange={e => setSelectedArea(e.target.value)}
                            style={{ padding: '4px 6px', fontSize: '0.88em', border: '1px solid #90caf9', borderRadius: '3px', minWidth: '140px' }}
                        />
                        <datalist id="areaList">
                            {uniqueAreas.map(area => (
                                <option key={area} value={area} />
                            ))}
                        </datalist>
                        {uniqueAreas.length > 0 && (
                            <span style={{ fontSize: '0.75em', color: '#666', background: '#fff', padding: '2px 4px', borderRadius: '2px', border: '1px solid #ccc' }}>
                                {uniqueAreas.length} area{uniqueAreas.length !== 1 ? 's' : ''}
                            </span>
                        )}
                        <button
                            onClick={handleUpdateArea}
                            disabled={!selectedArea.trim() || updateAreaLoading}
                            style={{ padding: '3px 10px', background: '#1976d2', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 600, fontSize: '0.88em' }}
                        >
                            {updateAreaLoading ? '…' : 'Set Area'}
                        </button>
                        <button
                            onClick={() => { setSelectedIds([]); setSelectedArea(''); }}
                            style={{ padding: '3px 10px', background: '#ccc', color: '#333', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 600, fontSize: '0.88em' }}
                        >
                            Clear
                        </button>
                        {updateAreaError && <span style={{ color: 'red', fontSize: '0.85em' }}>{updateAreaError}</span>}
                    </div>
                )}
            </div>

            {/* Resizable Map Pane */}
            <div style={{ flex: `0 0 ${splitPos}%`, minHeight: 0, overflow: 'hidden' }}>
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

            {/* Draggable Divider */}
            <div
                onMouseDown={() => setIsDragging(true)}
                onMouseEnter={(e) => (e.target.style.background = '#999')}
                onMouseLeave={(e) => !isDragging && (e.target.style.background = '#ff0000')}
                style={{
                    height: '20px',
                    background: '#ff0000',
                    cursor: 'row-resize',
                    borderTop: '1px solid #bbb',
                    borderBottom: '1px solid #bbb',
                    transition: isDragging ? 'none' : 'background 0.2s',
                    userSelect: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '12px',
                    color: '#fff',
                    fontWeight: 'bold'
                }}
            >
                ↕ DRAG TO RESIZE ↕
            </div>

            {/* Resizable Stop List Pane */}
            <div style={{ flex: `0 0 ${100 - splitPos}%`, minHeight: 0, overflowY: 'auto', background: '#fff' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem' }}>
                    <thead style={{ position: 'sticky', top: 0, background: '#f0f0f0' }}>
                        <tr>
                            <th style={th} width="30px">
                                <input 
                                    type="checkbox" 
                                    checked={listings.length > 0 && listings.every(l => selectedIds.includes(l._id))}
                                    ref={el => {
                                        if (el) {
                                            const allSelected = listings.length > 0 && listings.every(l => selectedIds.includes(l._id));
                                            const someSelected = listings.some(l => selectedIds.includes(l._id));
                                            el.indeterminate = someSelected && !allSelected;
                                        }
                                    }}
                                    onChange={() => {
                                        if (listings.every(l => selectedIds.includes(l._id))) {
                                            setSelectedIds([]);
                                        } else {
                                            setSelectedIds(listings.map(l => l._id));
                                        }
                                    }}
                                    style={{ cursor: 'pointer' }}
                                />
                            </th>
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
                            <tr key={l._id} style={{ borderBottom: '1px solid #eee', cursor: 'pointer' }}>
                                <td style={{ ...td, width: '30px' }}>
                                    <input 
                                        type="checkbox" 
                                        checked={selectedIds.includes(l._id)}
                                        onChange={() => handleToggleId(l._id)}
                                        onClick={e => e.stopPropagation()}
                                        style={{ cursor: 'pointer' }}
                                    />
                                </td>
                                <td style={td} onClick={() => navigate(`/address/${l._id}`)}>{i + 1}</td>
                                <td style={td} onClick={() => navigate(`/address/${l._id}`)}>{l._id}</td>
                                <td style={td} onClick={() => navigate(`/address/${l._id}`)}>{[l.firstName, l.lastName].filter(Boolean).join(' ') || '—'}</td>
                                <td style={td} onClick={() => navigate(`/address/${l._id}`)}>{[l.address1, l.address2].filter(Boolean).join(', ')}</td>
                                <td style={td} onClick={() => navigate(`/address/${l._id}`)}>{l.area || '—'}</td>
                                <td style={td} onClick={() => navigate(`/address/${l._id}`)}>{formatDate(l.lastModifiedDate)}</td>
                                <td style={td} onClick={() => navigate(`/address/${l._id}`)}>{l.latitude && l.longitude ? '✅' : '❌'}</td>
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
