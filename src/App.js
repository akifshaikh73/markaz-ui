import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import MasjidLogin from './Components/MasjidLogin';
import AdminLogin from './Components/AdminLogin';
import MasjidLanding from './Components/MasjidLanding';
import All from './Components/All';
import Landing from './Components/Landing';
import AddressDetail from './Components/AddressDetail';
import MapView from './Components/MapView';
import { getAdmin } from './config';

const ProtectedAdminRoute = ({ children }) => {
    const location = useLocation();

    if (!getAdmin()) {
        return <Navigate to="/admin-login" state={{ from: location }} replace />;
    }

    return children;
};

function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<Navigate to="/masjid-login" />} />
                <Route
                    path="/all"
                    element={
                        <ProtectedAdminRoute>
                            <All />
                        </ProtectedAdminRoute>
                    }
                />
                <Route path="/masjid-login" element={<MasjidLogin />} />
                <Route path="/admin-login" element={<AdminLogin />} />
                <Route path="/:masjidSlug" element={<MasjidLanding />} />
                <Route path="/landing/:masjidID/:unitID" element={<Landing />} />
                <Route path="/address/:id" element={<AddressDetail />} />
                <Route path="/map/:masjidID/:unitID" element={<MapView />} />
            </Routes>
        </BrowserRouter>
    );
}

export default App;
