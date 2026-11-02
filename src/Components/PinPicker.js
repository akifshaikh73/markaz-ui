import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { geocodeArea } from '../geocode';

// Fix default marker icon broken by webpack
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
    iconUrl:       require('leaflet/dist/images/marker-icon.png'),
    shadowUrl:     require('leaflet/dist/images/marker-shadow.png'),
});

const US_CENTER = [39.5, -98.35];

function ClickToPlace({ onPlace }) {
    useMapEvents({ click: e => onPlace([e.latlng.lat, e.latlng.lng]) });
    return null;
}

// Lets the user place a listing on the map by hand when its address can't be geocoded.
// onSave({ latitude, longitude }) / onCancel(). Loaded lazily from AddressDetail.
function PinPicker({ address, onSave, onCancel, saving = false }) {
    const [start, setStart] = useState(null); // { center, zoom } once the area is resolved
    const [pin, setPin] = useState(null);

    useEffect(() => {
        let cancelled = false;
        geocodeArea(address).then(area => {
            if (cancelled) return;
            setStart(area ? { center: [area.latitude, area.longitude], zoom: 16 } : { center: US_CENTER, zoom: 4 });
        });
        return () => { cancelled = true; };
    }, [address]);

    return (
        <div style={{ marginTop: '0.75rem', border: '1px solid #ccc', borderRadius: '6px', overflow: 'hidden' }}>
            <div style={{ padding: '0.4rem 0.6rem', background: '#f5f5f5', fontSize: '0.85rem' }}>
                Tap the map where {address.address1 || 'this address'} is. Drag the pin to adjust.
            </div>
            {start ? (
                <MapContainer center={start.center} zoom={start.zoom} style={{ height: '320px', width: '100%' }}>
                    <TileLayer
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                    <ClickToPlace onPlace={setPin} />
                    {pin && (
                        <Marker
                            position={pin}
                            draggable
                            eventHandlers={{ dragend: e => { const p = e.target.getLatLng(); setPin([p.lat, p.lng]); } }}
                        />
                    )}
                </MapContainer>
            ) : (
                <div style={{ padding: '1rem', fontSize: '0.9rem', color: '#666' }}>Loading map…</div>
            )}
            <div style={{ display: 'flex', gap: '0.5rem', padding: '0.5rem 0.6rem' }}>
                <button
                    onClick={() => onSave({ latitude: pin[0], longitude: pin[1] })}
                    disabled={!pin || saving}
                    style={{ background: '#e65100', color: '#fff', border: 'none', padding: '0.35rem 0.9rem', borderRadius: '4px', fontWeight: 700, cursor: pin && !saving ? 'pointer' : 'not-allowed', opacity: pin && !saving ? 1 : 0.6 }}
                >
                    {saving ? 'Saving…' : 'Save location'}
                </button>
                <button onClick={onCancel} disabled={saving} style={{ padding: '0.35rem 0.9rem' }}>Cancel</button>
            </div>
        </div>
    );
}

export default PinPicker;
