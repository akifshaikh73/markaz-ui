import React, { useEffect } from 'react';

// The user manual is a static page (public/user-manual.html, generated from
// docs/functional-manual-user.md); /help forwards to it. replace() keeps /help out of the history,
// so Back from the manual returns to the page the user came from.
const MANUAL_URL = `${process.env.PUBLIC_URL || ''}/user-manual.html`;

function Help() {
    useEffect(() => {
        window.location.replace(MANUAL_URL);
    }, []);

    return (
        <p style={{ padding: '1.5rem', textAlign: 'center' }}>
            Opening the user manual… <a href={MANUAL_URL}>Open it here</a> if nothing happens.
        </p>
    );
}

export default Help;
