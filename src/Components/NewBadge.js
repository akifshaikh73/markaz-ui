import React from 'react';

/** Green "NEW" tag shown beside the ID of a listing added during this visit to the page. */
function NewBadge({ style }) {
    return (
        <span
            title="Just added"
            style={{ fontSize: '0.7em', fontWeight: 700, color: '#2e7d32', border: '1px solid #a5d6a7', background: '#e8f5e9', borderRadius: '3px', padding: '0 4px', marginLeft: '4px', ...style }}
        >NEW</span>
    );
}

export default NewBadge;
