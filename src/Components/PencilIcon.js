import React from 'react';

// Unicode's ✎ pencil glyph renders differently (and sometimes mirrored) across OS/browser
// font fallbacks, so laptop vs phone could show visibly different icons. An inline SVG
// renders identically everywhere; scaleX(-1) reverses its default orientation.
const PencilIcon = () => (
    <svg
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{ display: 'block', transform: 'scaleX(-1)' }}
    >
        <path d="M12 20h9" />
        <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4Z" />
    </svg>
);

export default PencilIcon;
