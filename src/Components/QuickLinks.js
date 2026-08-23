import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';

function QuickLinks() {
    const navigate = useNavigate();
    const { masjidID } = useParams();

    const links = [
        {
            id: 'visitations',
            label: 'Visitations',
            icon: '📋',
            description: 'Track visitation activities',
            enabled: true,
            onClick: () => navigate('/visitation', { state: { isLoggedIn: true, masjidID } })
        },
        {
            id: 'routes',
            label: 'Routes',
            icon: '🗺️',
            description: 'Plan and optimize routes',
            enabled: true,
            onClick: () => navigate('/route', { state: { masjidID } })
        },
        {
            id: 'full-list',
            label: 'Full List',
            icon: '📑',
            description: 'View all addresses',
            enabled: true,
            onClick: () => navigate(`/landing/${masjidID}/all`, { state: { isLoggedIn: true } })
        },
        {
            id: 'reports',
            label: 'Reports',
            icon: '📊',
            description: 'View detailed reports and analytics',
            enabled: true,
            onClick: () => navigate(`/report/${masjidID}`, { state: { isLoggedIn: true, masjidID } })
        },
        {
            id: 'visitations-report',
            label: 'Visitations Report',
            icon: '📈',
            description: 'Generate visitation reports',
            enabled: false,
            onClick: null
        },
        {
            id: 'old-workers',
            label: 'Old Workers',
            icon: '⏳',
            description: 'Manage previous workers',
            enabled: false,
            onClick: null
        },
        {
            id: 'masturat-work',
            label: 'Masturat Work',
            icon: '👩‍💼',
            description: 'Women outreach program',
            enabled: false,
            onClick: null
        }
    ];

    return (
        <div id="quick-links-container" style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: '#f5f5f5' }}>
            {/* Header */}
            <div style={{ padding: '1.5rem 2rem', background: '#fff', borderBottom: '1px solid #ddd', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
                <button 
                    onClick={() => navigate(-1)}
                    style={{ background: 'none', border: 'none', color: '#1976d2', cursor: 'pointer', fontSize: '1rem', fontWeight: 600, marginBottom: '0.5rem' }}
                >
                    ← Back
                </button>
                <h1 style={{ margin: '0.5rem 0 0 0', fontSize: '2rem', fontWeight: 700, color: '#333' }}>Quick Links</h1>
                <p style={{ margin: '0.5rem 0 0 0', color: '#666', fontSize: '0.95rem' }}>Access key features and tools</p>
            </div>

            {/* Grid of Links */}
            <div style={{ 
                flex: 1, 
                overflow: 'auto', 
                padding: '2rem',
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                gap: '1.5rem'
            }}>
                {links.map(link => (
                    <div
                        key={link.id}
                        onClick={link.enabled ? link.onClick : null}
                        style={{
                            padding: '1.5rem',
                            background: link.enabled ? '#fff' : '#f0f0f0',
                            border: link.enabled ? '1px solid #ddd' : '1px solid #ccc',
                            borderRadius: '8px',
                            cursor: link.enabled ? 'pointer' : 'not-allowed',
                            transition: 'all 0.2s',
                            boxShadow: link.enabled ? '0 2px 6px rgba(0,0,0,0.08)' : 'none',
                            opacity: link.enabled ? 1 : 0.6,
                            pointerEvents: link.enabled ? 'auto' : 'none'
                        }}
                        onMouseEnter={(e) => {
                            if (link.enabled) {
                                e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.12)';
                                e.currentTarget.style.transform = 'translateY(-2px)';
                            }
                        }}
                        onMouseLeave={(e) => {
                            if (link.enabled) {
                                e.currentTarget.style.boxShadow = '0 2px 6px rgba(0,0,0,0.08)';
                                e.currentTarget.style.transform = 'translateY(0)';
                            }
                        }}
                    >
                        <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>{link.icon}</div>
                        <h2 style={{ margin: '0 0 0.5rem 0', fontSize: '1.3rem', fontWeight: 600, color: link.enabled ? '#1976d2' : '#999' }}>
                            {link.label}
                            {!link.enabled && <span style={{ fontSize: '0.75rem', marginLeft: '0.5rem', color: '#bbb', fontWeight: 400 }}>Coming Soon</span>}
                        </h2>
                        <p style={{ margin: '0', fontSize: '0.9rem', color: link.enabled ? '#666' : '#aaa', lineHeight: 1.5 }}>
                            {link.description}
                        </p>
                    </div>
                ))}
            </div>
        </div>
    );
}

export default QuickLinks;
