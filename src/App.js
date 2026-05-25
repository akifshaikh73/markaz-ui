import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import MasjidLogin from './Components/MasjidLogin';
import AdminLogin from './Components/AdminLogin';
import MasjidLanding from './Components/MasjidLanding';
import All from './Components/All';
import Landing from './Components/Landing';
import AddressDetail from './Components/AddressDetail';
import MapView from './Components/MapView';

function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<Navigate to="/masjid-login" />} />
                <Route path="/all" element={<All />} />
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
