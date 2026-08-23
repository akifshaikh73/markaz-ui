import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useLocation } from 'react-router-dom';

function Report() {
    const navigate = useNavigate();
    const location = useLocation();
    const { masjidID: paramMasjidID } = useParams();

    // Get masjidID from params or location state or localStorage
    const getMasjidID = () => {
        if (paramMasjidID) return paramMasjidID;
        if (location.state?.masjidID) return location.state.masjidID;
        try {
            const ctx = JSON.parse(localStorage.getItem('landingContext') || '{}');
            return ctx.masjidID || null;
        } catch {
            return null;
        }
    };

    const masjidID = getMasjidID();

    const reports = [
        {
            id: 'inactive-listings',
            label: 'Inactive Listings',
            icon: '📭',
            description: 'View and manage inactive addresses',
            enabled: true,
            onClick: () => navigate(`/landing/${masjidID}/all`, { state: { isLoggedIn: true, showInactive: true } })
        },
        {
            id: 'unvisited',
            label: 'Unvisited Addresses',
            icon: '📍',
            description: 'Addresses that have never been visited',
            enabled: false,
            onClick: null
        },
        {
            id: 'high-priority',
            label: 'High Priority',
            icon: '🚨',
            description: 'Long overdue visits needed',
            enabled: false,
            onClick: null
        },
        {
            id: 'visit-stats',
            label: 'Visit Statistics',
            icon: '📈',
            description: 'Overall visitation statistics and trends',
            enabled: false,
            onClick: null
        },
        {
            id: 'area-summary',
            label: 'Area Summary',
            icon: '🏘️',
            description: 'Summary by neighborhood',
            enabled: false,
            onClick: null
        },
        {
            id: 'export',
            label: 'Export Data',
            icon: '📥',
            description: 'Export reports to Excel',
            enabled: false,
            onClick: null
        }
    ];

    return (
        <div id="report-container" style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: '#f5f5f5' }}>
            {/* Header */}
            <div style={{ padding: '1.5rem 2rem', background: '#fff', borderBottom: '1px solid #ddd', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
                <button 
                    onClick={() => navigate(-1)}
                    style={{ background: 'none', border: 'none', color: '#1976d2', cursor: 'pointer', fontSize: '1rem', fontWeight: 600, marginBottom: '0.5rem' }}
                >
                    ← Back
                </button>
                <h1 style={{ margin: '0.5rem 0 0 0', fontSize: '2rem', fontWeight: 700, color: '#333' }}>Reports</h1>
                <p style={{ margin: '0.5rem 0 0 0', color: '#666', fontSize: '0.95rem' }}>View detailed reports and analytics</p>
            </div>

            {/* Grid of Reports */}
            <div style={{ 
                flex: 1, 
                overflow: 'auto', 
                padding: '2rem',
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                gap: '1.5rem'
            }}>
                {reports.map(report => (
                    <div
                        key={report.id}
                        onClick={report.enabled ? report.onClick : null}
                        style={{
                            padding: '1.5rem',
                            background: report.enabled ? '#fff' : '#f0f0f0',
                            border: report.enabled ? '1px solid #ddd' : '1px solid #ccc',
                            borderRadius: '8px',
                            cursor: report.enabled ? 'pointer' : 'not-allowed',
                            transition: 'all 0.2s',
                            boxShadow: report.enabled ? '0 2px 6px rgba(0,0,0,0.08)' : 'none',
                            opacity: report.enabled ? 1 : 0.6,
                            pointerEvents: report.enabled ? 'auto' : 'none'
                        }}
                        onMouseEnter={(e) => {
                            if (report.enabled) {
                                e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.12)';
                                e.currentTarget.style.transform = 'translateY(-2px)';
                            }
                        }}
                        onMouseLeave={(e) => {
                            if (report.enabled) {
                                e.currentTarget.style.boxShadow = '0 2px 6px rgba(0,0,0,0.08)';
                                e.currentTarget.style.transform = 'translateY(0)';
                            }
                        }}
                    >
                        <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>{report.icon}</div>
                        <h2 style={{ margin: '0 0 0.5rem 0', fontSize: '1.3rem', fontWeight: 600, color: report.enabled ? '#1976d2' : '#999' }}>
                            {report.label}
                            {!report.enabled && <span style={{ fontSize: '0.75rem', marginLeft: '0.5rem', color: '#bbb', fontWeight: 400 }}>Coming Soon</span>}
                        </h2>
                        <p style={{ margin: '0', fontSize: '0.9rem', color: report.enabled ? '#666' : '#aaa', lineHeight: 1.5 }}>
                            {report.description}
                        </p>
                    </div>
                ))}
            </div>
        </div>
    );
}

export default Report;
