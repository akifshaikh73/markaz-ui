import React from 'react';
import { Link } from 'react-router-dom';
import { MASJID_CONFIG } from '../config';

const Home = () => {
    if (!MASJID_CONFIG.length) {
        return (
            <div style={{ textAlign: 'center', marginTop: '80px' }}>
                <h2>No Masjid Landing Pages Configured</h2>
            </div>
        );
    }

    return (
        <div style={{ textAlign: 'center', marginTop: '80px' }}>
            <h2>Select Masjid</h2>
            <div style={{ display: 'inline-flex', flexDirection: 'column', gap: '0.75rem', minWidth: '240px' }}>
                {MASJID_CONFIG.map((masjid) => (
                    <Link
                        key={masjid.id}
                        to={`/${masjid.landing}`}
                        style={{
                            display: 'block',
                            padding: '0.75rem 1rem',
                            border: '1px solid #ccc',
                            borderRadius: '8px',
                            textDecoration: 'none',
                            color: '#222',
                            background: '#f9f9f9'
                        }}
                    >
                        {masjid.name}
                    </Link>
                ))}
            </div>
        </div>
    );
};

export default Home;
