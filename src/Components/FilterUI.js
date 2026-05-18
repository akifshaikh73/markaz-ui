import React from 'react';

const btnBase = {
    padding: '0.3rem 0.8rem',
    borderRadius: '4px',
    border: '1px solid #ccc',
    cursor: 'pointer',
    fontSize: '0.85rem',
    fontWeight: 'normal',
    background: '#f8f9fa',
    color: '#333',
};

const btnActive = {
    ...btnBase,
    background: '#0d6efd',
    color: '#fff',
    border: '1px solid #0d6efd',
    fontWeight: 'bold',
};

const FilterUI = ({ filters, onFilterChange }) => {
    const { showInactive = false, filterByStudents = false } = filters || {};

    return (
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap', justifyContent: 'center', margin: '0.5rem 0' }}>
            <span style={{ fontSize: '0.85rem', color: '#555', fontWeight: 'bold' }}>Filters:</span>

            {/* Active / Inactive toggle */}
            <button
                style={!showInactive ? btnActive : btnBase}
                onClick={() => onFilterChange({ showInactive: false })}
            >
                Active
            </button>
            <button
                style={showInactive ? btnActive : btnBase}
                onClick={() => onFilterChange({ showInactive: true })}
            >
                Inactive
            </button>

            <span style={{ color: '#ccc' }}>|</span>

            {/* Students toggle */}
            <button
                style={!filterByStudents ? btnActive : btnBase}
                onClick={() => onFilterChange({ filterByStudents: false })}
            >
                All
            </button>
            <button
                style={filterByStudents ? btnActive : btnBase}
                onClick={() => onFilterChange({ filterByStudents: true })}
            >
                Has Students
            </button>
        </div>
    );
};

export default FilterUI;
