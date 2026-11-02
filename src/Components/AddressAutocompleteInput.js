import React, { useState, useEffect, useRef } from 'react';
import { searchAddresses, autocompleteEnabled } from '../mapbox';

const DEBOUNCE_MS = 250;
const MIN_CHARS = 3;

// Street address input with Mapbox suggestions (biased to the user's location).
// onChange(text) fires on typing; onSelect({ address1, address2, city, state, zipcode }) fires when
// a suggestion is picked. Without REACT_APP_MAPBOX_TOKEN it behaves as a plain input.
function AddressAutocompleteInput({ value, onChange, onSelect, style, placeholder }) {
    const [suggestions, setSuggestions] = useState([]);
    const [open, setOpen] = useState(false);
    const [active, setActive] = useState(-1);

    const locationRef = useRef(null);
    const timerRef = useRef(null);
    const abortRef = useRef(null);

    useEffect(() => () => {
        clearTimeout(timerRef.current);
        if (abortRef.current) abortRef.current.abort();
    }, []);

    const requestLocation = () => {
        if (locationRef.current !== null || !navigator.geolocation) return;
        locationRef.current = false; // asked once; false = unavailable/denied
        navigator.geolocation.getCurrentPosition(
            pos => { locationRef.current = { lat: pos.coords.latitude, lng: pos.coords.longitude }; },
            () => {},
            { maximumAge: 600000, timeout: 5000 }
        );
    };

    const cancelPending = () => {
        clearTimeout(timerRef.current);
        if (abortRef.current) abortRef.current.abort();
    };

    const fetchSuggestions = (text) => {
        const controller = new AbortController();
        abortRef.current = controller;
        searchAddresses(text, { location: locationRef.current || null, signal: controller.signal })
            .then(results => {
                setSuggestions(results);
                setActive(-1);
                setOpen(true);
            })
            .catch(err => {
                if (err.name !== 'AbortError') setSuggestions([]);
            });
    };

    const handleChange = (e) => {
        const text = e.target.value;
        onChange(text);
        cancelPending();
        if (!autocompleteEnabled()) return;
        if (text.trim().length < MIN_CHARS) {
            setSuggestions([]);
            setOpen(false);
            return;
        }
        timerRef.current = setTimeout(() => fetchSuggestions(text), DEBOUNCE_MS);
    };

    const pick = (suggestion) => {
        cancelPending();
        setOpen(false);
        setSuggestions([]);
        if (suggestion.parts.address1) onSelect(suggestion.parts);
    };

    const handleKeyDown = (e) => {
        if (!open || suggestions.length === 0) return;
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setActive(i => (i + 1) % suggestions.length);
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setActive(i => (i <= 0 ? suggestions.length - 1 : i - 1));
        } else if (e.key === 'Enter' && active >= 0) {
            e.preventDefault();
            pick(suggestions[active]);
        } else if (e.key === 'Escape') {
            setOpen(false);
        }
    };

    return (
        <div style={{ position: 'relative' }}>
            <input
                type="text"
                value={value}
                onChange={handleChange}
                onFocus={requestLocation}
                onBlur={() => setOpen(false)}
                onKeyDown={handleKeyDown}
                style={style}
                placeholder={placeholder}
                autoComplete="off"
                aria-autocomplete="list"
            />
            {open && suggestions.length > 0 && (
                <ul
                    role="listbox"
                    style={{
                        position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 10,
                        margin: 0, padding: 0, listStyle: 'none', background: '#fff',
                        border: '1px solid #ccc', borderTop: 'none', borderRadius: '0 0 4px 4px',
                        boxShadow: '0 4px 8px rgba(0,0,0,0.12)', maxHeight: '240px', overflowY: 'auto',
                    }}
                >
                    {suggestions.map((s, i) => (
                        <li
                            key={s.id}
                            role="option"
                            aria-selected={i === active}
                            // mousedown (not click) so it fires before the input's blur closes the list
                            onMouseDown={(e) => { e.preventDefault(); pick(s); }}
                            onMouseEnter={() => setActive(i)}
                            style={{
                                padding: '0.4rem 0.6rem', cursor: 'pointer', fontSize: '0.9rem',
                                background: i === active ? '#e3f2fd' : '#fff',
                            }}
                        >
                            {s.label}
                        </li>
                    ))}
                    <li style={{ padding: '0.2rem 0.6rem', fontSize: '0.7rem', color: '#777', textAlign: 'right' }}>
                        Search by Mapbox
                    </li>
                </ul>
            )}
        </div>
    );
}

export default AddressAutocompleteInput;
