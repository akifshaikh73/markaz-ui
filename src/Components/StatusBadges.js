import React, { useState, useEffect } from 'react';
import { getUserRole } from '../config';

const API_URL = process.env.REACT_APP_API_URL || '';

const isRemoteApi = Boolean(
    API_URL &&
    !API_URL.toLowerCase().includes('localhost') &&
    !API_URL.toLowerCase().includes('127.0.0.1')
);

function Badge({ label, value }) {
    const isRemote = value === 'remote';
    const isUnknown = !value || value === '...' || value === 'unknown';
    
    // Handle role-specific abbreviations
    let display;
    if (label === 'Role') {
        if (value === 'MasjidUser') display = 'MU';
        else if (value === 'MasjidAdmin') display = 'MA';
        else if (value === 'MarkazAdmin') display = 'MarkazAdmin';
        else display = value ? value.substring(0, 2).toUpperCase() : 'Unknown';
    } else {
        display = isUnknown ? value || 'Unknown' : value.charAt(0).toUpperCase();
    }
    
    // Role-based color scheme
    let bgColor, fgColor, borderColor;
    if (label === 'Role') {
        if (value === 'MarkazAdmin') {
            bgColor = '#f3e5f5';
            fgColor = '#6a1b9a';
            borderColor = '#ce93d8';
        } else if (value === 'MasjidAdmin') {
            bgColor = '#e3f2fd';
            fgColor = '#1565c0';
            borderColor = '#90caf9';
        } else if (value === 'MasjidUser') {
            bgColor = '#f1f8e9';
            fgColor = '#558b2f';
            borderColor = '#9ccc65';
        } else {
            bgColor = '#e2e3e5';
            fgColor = '#383d41';
            borderColor = '#d6d8db';
        }
    } else {
        bgColor = isUnknown ? '#e2e3e5' : isRemote ? '#d4edda' : '#fff3cd';
        fgColor = isUnknown ? '#383d41' : isRemote ? '#155724' : '#856404';
        borderColor = isUnknown ? '#d6d8db' : isRemote ? '#c3e6cb' : '#ffeeba';
    }
    
    const style = {
        fontSize: '0.75rem',
        padding: '0.2rem 0.5rem',
        borderRadius: '4px',
        background: bgColor,
        color: fgColor,
        border: '1px solid',
        borderColor: borderColor,
    };
    return <span style={style}>{label}:{display}</span>;
}

function StatusBadges({ showOnMobile = false }) {
    const [dbStatus, setDbStatus] = useState('...');
    const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
    const apiStatus = isRemoteApi ? 'remote' : 'local';
    const userRole = getUserRole() || 'unknown';

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
            <Badge label="Role" value={userRole} />
        </>
    );
}

export default StatusBadges;
