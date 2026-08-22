import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet, useLocation } from 'react-router-dom';
import MasjidLogin from './Components/MasjidLogin';
import AdminLogin from './Components/AdminLogin';
import AdminPasswordLogin from './Components/AdminPasswordLogin';
import UserLogin from './Components/UserLogin';
import MasjidLanding from './Components/MasjidLanding';
import MasjidManagement from './Components/MasjidManagement';
import AddressDetail from './Components/AddressDetail';
import MapView from './Components/MapView';
import Landing from './Components/Landing';
import MasjidDetail from './Components/MasjidDetail';
import UserManagement from './Components/UserManagement';
import UserDetail from './Components/UserDetail';
import { getAdmin } from './config';
import Home from './Components/Home';
import { MasjidProvider } from './hooks/useMasjids';

const ProtectedMarkazAdminRoute = () => {
    const location = useLocation();
    const userRole = localStorage.getItem('userRole');
    if (userRole !== 'MarkazAdmin') {
        return <Navigate to="/admin-login" state={{ from: location }} replace />;
    }
    return <Outlet />;
};

const ProtectedMasjidAdminRoute = () => {
    const location = useLocation();
    const userRole = localStorage.getItem('userRole');
    if (!['MasjidAdmin', 'MarkazAdmin'].includes(userRole)) {
        return <Navigate to="/user-login" state={{ from: location }} replace />;
    }
    return <Outlet />;
};

const ProtectedUserRoute = () => {
    const location = useLocation();
    const userRole = localStorage.getItem('userRole');
    if (!['GeneralUser', 'MasjidAdmin', 'MarkazAdmin'].includes(userRole)) {
        return <Navigate to="/user-login" state={{ from: location }} replace />;
    }
    return <Outlet />;
};

function App() {
    return (
        <MasjidProvider>
            <BrowserRouter>
                <Routes>
                    <Route path="/" element={<UserLogin />} />
                    <Route path="/admin-home" element={<Home />} />
                    <Route path="/user-login" element={<UserLogin />} />
                    <Route path="/masjid-login" element={<MasjidLogin />} />
                    <Route path="/:masjidSlug" element={<MasjidLanding />} />
                    <Route path="/admin-login" element={<AdminPasswordLogin />} />
                    <Route path="/admin/login" element={<AdminLogin />} />
                    <Route element={<ProtectedUserRoute />}>
                        <Route path="/landing/:masjidID/:unitID" element={<Landing />} />
                        <Route path="/address/:id" element={<AddressDetail />} />
                        <Route path="/map/:masjidID/:unitID" element={<MapView />} />
                    </Route>
                    <Route element={<ProtectedMarkazAdminRoute />}>
                        <Route path="/admin/masjids" element={<MasjidManagement />} />
                        <Route path="/admin/masjids/:id" element={<MasjidDetail />} />
                        <Route path="/admin/users" element={<UserManagement />} />
                        <Route path="/admin/users/:id" element={<UserDetail />} />
                    </Route>
                </Routes>
            </BrowserRouter>
        </MasjidProvider>
    );
}

export default App;
