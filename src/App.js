import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet, useLocation } from 'react-router-dom';
import MasjidLogin from './Components/MasjidLogin';
import AdminLogin from './Components/AdminLogin';
import MasjidLanding from './Components/MasjidLanding';
import All from './Components/All';
import Landing from './Components/Landing';
import AddressDetail from './Components/AddressDetail';
import MapView from './Components/MapView';
import MasjidManagement from './Components/MasjidManagement';
import MasjidDetail from './Components/MasjidDetail';
import { getAdmin } from './config';
import Home from './Components/Home';

const ProtectedAdminRoute = () => {
    const location = useLocation();
    if (!getAdmin()) {
        return <Navigate to="/admin/login" state={{ from: location }} replace />;
    }
    return <Outlet />;
};

function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/masjid-login" element={<MasjidLogin />} />
                <Route path="/:masjidSlug" element={<MasjidLanding />} />
                <Route path="/landing/:masjidID/:unitID" element={<Landing />} />
                <Route path="/address/:id" element={<AddressDetail />} />
                <Route path="/map/:masjidID/:unitID" element={<MapView />} />
                <Route path="/admin/login" element={<AdminLogin />} />
                <Route element={<ProtectedAdminRoute />}>
                    <Route path="/admin/all" element={<All />} />
                    <Route path="/admin/masjids" element={<MasjidManagement />} />
                    <Route path="/admin/masjids/:id" element={<MasjidDetail />} />
                </Route>
            </Routes>
        </BrowserRouter>
    );
}

export default App;
