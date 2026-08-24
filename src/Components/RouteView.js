import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Tooltip, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
    iconUrl:       require('leaflet/dist/images/marker-icon.png'),
    shadowUrl:     require('leaflet/dist/images/marker-shadow.png'),
});

const makeNumberedIcon = (n, isSelected = false, area = null) => {
    let color = '#999'; // gray - no area
    if (isSelected) color = '#1976d2'; // blue - selected
    else if (area) color = '#4caf50'; // green - has area
    
    return L.divIcon({
        className: '',
        html: `<div style="background:${color};color:#fff;border-radius:50%;width:28px;height:28px;display:flex;align-items:center;justify-content:center;font-weight:bold;font-size:13px;border:2px solid #fff;box-shadow:0 1px 4px rgba(0,0,0,0.4)">${n}</div>`,
        iconSize: [28, 28], iconAnchor: [14, 14],
    });
};

const masjidIcon = L.divIcon({
    className: '',
    html: `<div style="background:#6a1b9a;color:#fff;border-radius:50%;width:34px;height:34px;display:flex;align-items:center;justify-content:center;font-size:18px;border:3px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,0.5)">🕌</div>`,
    iconSize: [34, 34], iconAnchor: [17, 17],
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
    const [splitPos, setSplitPos] = useState(60);
    const [isDragging, setIsDragging] = useState(false);

    // Define functions BEFORE using them
    const getInitialListings = () => {
        if (location.state?.listings && Array.isArray(location.state.listings)) {
            console.log('[RouteView] Loaded listings from location.state:', location.state.listings.length);
            return location.state.listings;
        }
        return [];
    };

    const { masjidID: passedMasjidID, masjidRef: passedMasjidRef } = location.state || {};

    // All state declarations AFTER functions but BEFORE effects
    const [showRoute, setShowRoute] = useState(false);
    const [totalDistance, setTotalDistance] = useState(null);
    const [totalDuration, setTotalDuration] = useState(null);
    const [nearbyCount, setNearbyCount] = useState(5);
    const [nearbyLoading, setNearbyLoading] = useState(false);
    const [nearbyError, setNearbyError] = useState('');
    const [selectedIds, setSelectedIds] = useState(
        location.state?.listings?.map(l => l._id) || []
    );
    const [selectedArea, setSelectedArea] = useState('');
    const [updateAreaLoading, setUpdateAreaLoading] = useState(false);
    const [updateAreaError, setUpdateAreaError] = useState('');
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
    const [listings, setListings] = useState(getInitialListings());
    const [routePolyline, setRoutePolyline] = useState(null);
    const [routeLoading, setRouteLoading] = useState(false);
    // Resolved masjid reference with geocoded coordinates
    const [masjidRef, setMasjidRef] = useState(passedMasjidRef || null);
    
    // Detect if mobile (for responsive layout)
    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 768);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Handle dragging the divider (works for both vertical and horizontal)
    useEffect(() => {
        const handleMouseMove = (e) => {
            if (!isDragging) return;
            const container = document.getElementById('route-view-container');
            if (!container) return;
            const rect = container.getBoundingClientRect();
            
            if (isMobile) {
                // Horizontal divider: calculate based on Y position
                const newPos = Math.max(20, Math.min(80, ((e.clientY - rect.top) / rect.height) * 100));
                setSplitPos(newPos);
            } else {
                // Vertical divider: calculate based on X position
                const newPos = Math.max(20, Math.min(80, ((e.clientX - rect.left) / rect.width) * 100));
                setSplitPos(newPos);
            }
        };
        const handleMouseUp = () => setIsDragging(false);
        if (isDragging) {
            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseup', handleMouseUp);
            document.addEventListener('touchmove', handleMouseMove);
            document.addEventListener('touchend', handleMouseUp);
            return () => {
                document.removeEventListener('mousemove', handleMouseMove);
                document.removeEventListener('mouseup', handleMouseUp);
                document.removeEventListener('touchmove', handleMouseMove);
                document.removeEventListener('touchend', handleMouseUp);
            };
        }
    }, [isDragging, isMobile]);
    
    // Resolve masjidID from state or landingContext, then fetch+geocode masjid doc
    useEffect(() => {
        const resolveMasjid = async () => {
            // Already have a masjidRef with coordinates — nothing to do
            if (masjidRef?.latitude && masjidRef?.longitude) return;

            // Determine masjidID
            let masjidID = passedMasjidID;
            if (!masjidID) {
                try {
                    const ctx = JSON.parse(localStorage.getItem('landingContext') || '{}');
                    masjidID = ctx.masjidID || null;
                } catch {}
            }
            if (!masjidID) return;

            // Fetch masjid doc (with sessionStorage cache)
            let doc = masjidRef;
            if (!doc) {
                const cacheKey = `masjidDoc_${masjidID}`;
                try {
                    const cached = sessionStorage.getItem(cacheKey);
                    if (cached) doc = JSON.parse(cached);
                } catch {}
                if (!doc) {
                    try {
                        const r = await fetch(`${API_URL}/api/masjids/${encodeURIComponent(masjidID)}`);
                        if (r.ok) {
                            doc = await r.json();
                            try { sessionStorage.setItem(cacheKey, JSON.stringify(doc)); } catch {}
                        }
                    } catch (e) {
                        console.error('[RouteView] Failed to fetch masjid doc:', e);
                    }
                }
            }
            if (!doc) return;

            // Already has coordinates — just set it
            if (doc.latitude && doc.longitude) {
                setMasjidRef(doc);
                return;
            }

            // Geocode the masjid address via Nominatim
            const addrStr = [doc.address, doc.city, doc.state, doc.zipcode].filter(Boolean).join(', ');
            if (!addrStr) { setMasjidRef(doc); return; }

            try {
                const geo = await fetch(
                    `https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&limit=1&q=${encodeURIComponent(addrStr)}`,
                    { headers: { 'Accept-Language': 'en' } }
                );
                const results = await geo.json();
                if (results?.[0]) {
                    doc = { ...doc, latitude: parseFloat(results[0].lat), longitude: parseFloat(results[0].lon) };
                }
            } catch (e) {
                console.error('[RouteView] Geocode failed:', e);
            }
            setMasjidRef(doc);
        };
        resolveMasjid();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [API_URL, passedMasjidID]);

    const handleFindNearby = () => {
        const source = listings[0];
        if (!source) return;
        setNearbyLoading(true);
        setNearbyError('');
        fetch(`${API_URL}/api/addressList/${source._id}/nearby?count=${nearbyCount}`)
            .then(r => {
                if (!r.ok) {
                    throw new Error(`HTTP ${r.status}: Failed to fetch nearby listings`);
                }
                return r.json();
            })
            .then(data => {
                if (data.error) { 
                    console.error('[handleFindNearby] Error in response:', data);
                    setNearbyError(data.error); 
                    return; 
                }
                console.log('[handleFindNearby] Found', data.length, 'nearby addresses');
                const merged = [source, ...data.filter(l => l._id !== source._id)];
                setListings(merged);
                setShowRoute(false);
            })
            .catch(err => {
                console.error('[handleFindNearby] Error:', err);
                setNearbyError('Failed to fetch nearby listings: ' + err.message);
            })
            .finally(() => setNearbyLoading(false));
    };

    const handleUpdateArea = () => {
        console.log('[handleUpdateArea] Called with:');
        console.log('  selectedIds:', selectedIds);
        console.log('  selectedArea:', selectedArea);
        console.log('  selectedIds.length:', selectedIds.length);
        console.log('  selectedArea.trim():', selectedArea.trim());
        
        if (selectedIds.length === 0 || !selectedArea.trim()) {
            console.log('[handleUpdateArea] Early return - missing selectedIds or selectedArea');
            return;
        }
        
        setUpdateAreaLoading(true);
        setUpdateAreaError('');
        
        console.log('[handleUpdateArea] Starting bulk update for', selectedIds.length, 'addresses with area:', selectedArea);
        
        fetch(`${API_URL}/api/addressList/bulk/area`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ids: selectedIds, area: selectedArea })
        })
        .then(r => {
            if (!r.ok) {
                throw new Error(`HTTP ${r.status}: Failed to update area`);
            }
            return r.json();
        })
        .then(result => {
            console.log('[handleUpdateArea] Bulk update response:', result);
            if (result.error) {
                console.error('[handleUpdateArea] Error in response:', result.error);
                setUpdateAreaError(result.error);
                return;
            }
            console.log('[handleUpdateArea] Successfully updated', selectedIds.length, 'addresses');
            setListings(listings.map(l => 
                selectedIds.includes(l._id) ? { ...l, area: selectedArea } : l
            ));
            setSelectedIds([]);
            setSelectedArea('');
            setShowRoute(false);
        })
        .catch(err => {
            console.error('[handleUpdateArea] Error:', err);
            setUpdateAreaError('Failed to update area: ' + err.message);
        })
        .finally(() => setUpdateAreaLoading(false));
    };

    const handleToggleId = (id) => {
        setSelectedIds(prev => 
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    const handleClearRoute = () => {
        // Clear only route and selection state, keep the address list intact
        setSelectedIds([]);
        setSelectedArea('');
        setShowRoute(false);
        setRoutePolyline(null);
        setTotalDistance(null);
        setTotalDuration(null);
    };

    const plotted = listings.filter(l => l.latitude && l.longitude);

    const getMasjidAndUnitFromState = () => {
        if (location.state?.masjidID && location.state?.unitID) {
            return { masjidID: location.state.masjidID, unitID: location.state.unitID };
        }
        return { masjidID: null, unitID: null };
    };

    const { masjidID, unitID } = getMasjidAndUnitFromState();
    const unitAreasKey = masjidID && unitID ? `unitAreas_${masjidID}_${unitID}` : null;
    
    const getCachedAreas = () => {
        if (unitAreasKey) {
            try {
                const cached = sessionStorage.getItem(unitAreasKey);
                if (cached) {
                    const areas = JSON.parse(cached);
                    if (Array.isArray(areas) && areas.length > 0) {
                        return areas;
                    }
                }
            } catch (err) {
                console.error('[RouteView] Error loading areas from sessionStorage:', err);
            }
        }
        const fromListings = Array.from(new Set(
            listings.map(l => l.area).filter(a => a && a.trim())
        )).sort();
        return fromListings;
    };

    const uniqueAreas = getCachedAreas();

    // Only route selected addresses, or all plotted if none selected
    const addressesToRoute = selectedIds.length > 0 
        ? listings.filter(l => selectedIds.includes(l._id) && l.latitude && l.longitude)
        : plotted;

    const handleCalculateRoute = () => {
        if (addressesToRoute.length < 1) {
            alert('Need at least 1 selected address with coordinates to create a route');
            return;
        }
        setRouteLoading(true);

        // Prepend masjid as origin if it has coordinates
        const masjidCoord = masjidRef?.latitude && masjidRef?.longitude
            ? `${masjidRef.longitude},${masjidRef.latitude}`
            : null;
        const stopCoords = addressesToRoute.map(l => `${l.longitude},${l.latitude}`);
        const allCoords = masjidCoord ? [masjidCoord, ...stopCoords] : stopCoords;

        fetch(`https://router.project-osrm.org/route/v1/driving/${allCoords.join(';')}?overview=full&geometries=geojson`)
            .then(r => {
                if (!r.ok) {
                    throw new Error(`HTTP ${r.status}: Route calculation failed`);
                }
                return r.json();
            })
            .then(osrm => {
                if (osrm.code !== 'Ok') {
                    throw new Error(`OSRM Error: ${osrm.code} - ${osrm.message || 'Unknown error'}`);
                }
                if (osrm.routes && osrm.routes[0]) {
                    const route = osrm.routes[0];
                    setRoutePolyline(route.geometry.coordinates.map(([lng, lat]) => [lat, lng]));
                    setTotalDistance((route.distance / 1609.34).toFixed(1));
                    setTotalDuration(Math.round(route.duration / 60));
                    setShowRoute(true);
                    console.log('[handleCalculateRoute] Route calculated:', route.distance, 'm,', route.duration, 's');
                } else {
                    throw new Error('No route found in response');
                }
            })
            .catch(err => {
                console.error('[handleCalculateRoute] Error:', err);
                alert('Failed to fetch route: ' + err.message);
            })
            .finally(() => setRouteLoading(false));
    };

    const center = addressesToRoute.length > 0
        ? [addressesToRoute[0].latitude, addressesToRoute[0].longitude]
        : masjidRef?.latitude && masjidRef?.longitude
            ? [masjidRef.latitude, masjidRef.longitude]
            : [39.5, -98.35];

    return (
        <div id="route-view-container" style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
            {/* Toolbar */}
            <div style={{ padding: '10px 16px', background: '#f5f5f5', borderBottom: '1px solid #ddd', display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                <button onClick={() => navigate(-1)}>← Back to List</button>
                <button onClick={handleClearRoute} style={{ padding: '4px 12px', background: '#ff5252', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 600, fontSize: '0.9em' }}>✕ Clear Route</button>
                
                {addressesToRoute.length >= 1 && (
                    <button
                        onClick={handleCalculateRoute}
                        disabled={routeLoading || showRoute}
                        style={{ padding: '4px 12px', background: showRoute ? '#4caf50' : '#1976d2', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 600, fontSize: '0.9em' }}
                    >
                        {routeLoading ? '⟳ Optimizing…' : showRoute ? '✓ Route Optimized' : '🗺️ Optimize Route'}
                    </button>
                )}
                <strong>Route</strong>
                {masjidRef && (
                    <span style={{ color: '#6a1b9a', fontSize: '0.88em', fontWeight: 500 }}>
                        🕌 From: {masjidRef.name || 'Masjid'}
                    </span>
                )}
                <span style={{ color: '#555', fontSize: '0.9em' }}>
                    {selectedIds.length > 0 ? `${selectedIds.length} selected` : (showRoute ? `${addressesToRoute.length} stops` : '0 stops')}
                </span>
                {routeLoading && <span style={{ color: '#888', fontSize: '0.85em' }}>Fetching route…</span>}
                {totalDistance && !routeLoading && showRoute && (
                    <span style={{ color: '#1976d2', fontWeight: 500, fontSize: '0.9em' }}>
                        ~{totalDistance} mi · ~{totalDuration} min
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
                        </label>
                        <button
                            onClick={handleFindNearby}
                            disabled={nearbyLoading}
                            style={{ padding: '3px 10px', background: '#e65100', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 600 }}
                        >
                            {nearbyLoading ? '…' : 'Go'}
                        </button>
                        {nearbyError && <span style={{ color: '#c62828', fontSize: '0.8em', fontWeight: 500 }}>❌ {nearbyError}</span>}
                    </span>
                )}
                {selectedIds.length > 0 && (
                    <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '4px 10px', background: '#e3f2fd', border: '1px solid #64b5f6', borderRadius: '6px' }}>
                        <input
                            type="text"
                            list="areaList"
                            placeholder="Type area"
                            value={selectedArea}
                            onChange={e => setSelectedArea(e.target.value)}
                            style={{ padding: '4px 6px', fontSize: '0.88em', border: '1px solid #90caf9', borderRadius: '3px', minWidth: '140px' }}
                        />
                        <datalist id="areaList">
                            {uniqueAreas.map(area => (
                                <option key={area} value={area} />
                            ))}
                        </datalist>
                        <button
                            onClick={handleUpdateArea}
                            disabled={!selectedArea.trim() || updateAreaLoading}
                            style={{ padding: '3px 10px', background: '#1976d2', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 600, fontSize: '0.88em' }}
                        >
                            {updateAreaLoading ? '…' : 'Set'}
                        </button>
                        <button
                            onClick={() => { setSelectedIds([]); setSelectedArea(''); }}
                            style={{ padding: '3px 10px', background: '#ccc', color: '#333', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 600, fontSize: '0.88em' }}
                        >
                            Clear
                        </button>
                        {updateAreaError && <span style={{ color: '#c62828', fontSize: '0.8em', fontWeight: 500 }}>❌ {updateAreaError}</span>}
                    </div>
                )}
            </div>

            {/* Content Pane - Responsive */}
            <div style={{ 
                flex: 1, 
                display: 'flex', 
                flexDirection: isMobile ? 'column' : 'row',
                minHeight: 0, 
                gap: 0 
            }}>
                {/* Map */}
                <div style={{ 
                    flex: isMobile ? `0 0 ${splitPos}%` : `0 0 ${splitPos}%`,
                    minHeight: 0, 
                    overflow: 'hidden'
                }}>
                    <MapContainer 
                        center={center} 
                        zoom={13} 
                        style={{ height: '100%', width: '100%' }}
                    >
                        <TileLayer
                            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        />
                        {addressesToRoute.length > 0 && (
                            <FitBounds positions={[
                                ...addressesToRoute.map(l => [l.latitude, l.longitude]),
                                ...(masjidRef?.latitude && masjidRef?.longitude ? [[masjidRef.latitude, masjidRef.longitude]] : [])
                            ]} />
                        )}
                        {routePolyline && showRoute && (
                            <Polyline positions={routePolyline} color="#1976d2" weight={4} opacity={0.8} dashArray="8 4" />
                        )}
                        {/* Masjid reference marker */}
                        {masjidRef?.latitude && masjidRef?.longitude && (
                            <Marker position={[masjidRef.latitude, masjidRef.longitude]} icon={masjidIcon}>
                                <Tooltip direction="top" opacity={0.95} permanent>
                                    <div style={{ fontWeight: 'bold', color: '#6a1b9a' }}>🕌 {masjidRef.name || 'Masjid'}</div>
                                </Tooltip>
                            </Marker>
                        )}
                        {listings.map((l, i) => {
                            if (!l.latitude || !l.longitude) return null;
                            const isSelected = selectedIds.includes(l._id);
                            return (
                                <Marker 
                                    key={l._id} 
                                    position={[l.latitude, l.longitude]} 
                                    icon={makeNumberedIcon(i + 1, isSelected, l.area)}
                                    eventHandlers={{ click: () => handleToggleId(l._id) }}
                                >
                                    <Tooltip direction="top" opacity={0.95}>
                                        <div style={{ lineHeight: 1.6 }}>
                                            <strong>Stop {i + 1}: {[l.firstName, l.lastName].filter(Boolean).join(' ') || '—'}</strong><br />
                                            {[l.address1, l.address2].filter(Boolean).join(', ')}<br />
                                            {l.area && <em>{l.area}</em>}
                                            {isSelected && <div style={{ marginTop: '4px', color: '#1976d2', fontWeight: 'bold' }}>✓ Selected</div>}
                                        </div>
                                    </Tooltip>
                                </Marker>
                            );
                        })}
                    </MapContainer>
                </div>

                {/* Resizable Divider - Desktop: Vertical, Mobile: Horizontal */}
                <div
                    onMouseDown={() => setIsDragging(true)}
                    onTouchStart={() => setIsDragging(true)}
                    onMouseEnter={(e) => (e.target.style.background = '#999')}
                    onMouseLeave={(e) => !isDragging && (e.target.style.background = '#ddd')}
                    style={{
                        ...(isMobile ? {
                            height: '10px',
                            width: '100%',
                            cursor: 'row-resize',
                            borderTop: '1px solid #bbb',
                            borderBottom: '1px solid #bbb'
                        } : {
                            width: '10px',
                            height: '100%',
                            cursor: 'col-resize',
                            borderLeft: '1px solid #bbb',
                            borderRight: '1px solid #bbb'
                        }),
                        background: '#ddd',
                        transition: isDragging ? 'none' : 'background 0.2s',
                        userSelect: 'none'
                    }}
                />

                {/* Stop List */}
                <div style={{ 
                    flex: `0 0 ${100 - splitPos}%`, 
                    minHeight: 0, 
                    overflowY: 'auto', 
                    background: '#fff'
                }}>
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
                                <th style={th}>Name</th>
                                <th style={th}>Address</th>
                                <th style={th}>Area</th>
                                <th style={th}>Coords</th>
                            </tr>
                        </thead>
                        <tbody>
                            {listings.map((l, i) => (
                                <tr key={l._id} style={{ borderBottom: '1px solid #eee', cursor: 'pointer', background: selectedIds.includes(l._id) ? '#e3f2fd' : '#fff' }}>
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
                                    <td style={td} onClick={() => navigate(`/address/${l._id}`)}>{[l.firstName, l.lastName].filter(Boolean).join(' ') || '—'}</td>
                                    <td style={td} onClick={() => navigate(`/address/${l._id}`)}>{[l.address1, l.address2].filter(Boolean).join(', ')}</td>
                                    <td style={td} onClick={() => navigate(`/address/${l._id}`)}>{l.area || '—'}</td>
                                    <td style={td} onClick={() => navigate(`/address/${l._id}`)}>{l.latitude && l.longitude ? '✅' : '❌'}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

const th = { textAlign: 'left', padding: '6px 10px', borderBottom: '2px solid #ccc', fontWeight: 600 };
const td = { padding: '5px 10px' };

export default RouteView;
