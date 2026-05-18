import React, { useState, useEffect } from 'react';

const API_URL = process.env.REACT_APP_API_URL || '';

const isRemoteApi = Boolean(
    API_URL &&
    !API_URL.toLowerCase().includes('localhost') &&
    !API_URL.toLowerCase().includes('127.0.0.1')
);

function Badge({ label, value }) {
    const isRemote = value === 'remote';
    const isUnknown = !value || value === '...' || value === 'unknown';
    const style = {
        fontSize: '0.75rem',
        padding: '0.2rem 0.5rem',
        borderRadius: '4px',
        background: isUnknown ? '#e2e3e5' : isRemote ? '#d4edda' : '#fff3cd',
        color: isUnknown ? '#383d41' : isRemote ? '#155724' : '#856404',
        border: '1px solid',
        borderColor: isUnknown ? '#d6d8db' : isRemote ? '#c3e6cb' : '#ffeeba',
    };
    const display = isUnknown ? value || 'Unknown' : value.charAt(0).toUpperCase() + value.slice(1);
    return <span style={style}>{label}: {display}</span>;
}

function StatusBadges({ showOnMobile = false }) {
    const [dbStatus, setDbStatus] = useState('...');
    const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
    const apiStatus = isRemoteApi ? 'remote' : 'local';

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth <= 768);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    useEffect(() => {
        fetch(`${API_URL}/api/dbStatus`)
            .then(res => {
                if (!res.ok) throw new Error('non-ok response');
                return res.json();
            })
            .then(data => {
                const val = (data.dbStatus || '').toLowerCase();
                setDbStatus(val === 'local' || val === 'remote' ? val : 'unknown');
            })
            .catch(() => setDbStatus('unknown'));
    }, []);

    // Hide on mobile unless showOnMobile is true
    if (isMobile && !showOnMobile) {
        return null;
    }

    return (
        <>
            <Badge label="API" value={apiStatus} />
            <Badge label="DB" value={dbStatus} />
        </>
    );
}

export default StatusBadges;
