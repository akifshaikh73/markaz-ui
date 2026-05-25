import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Login from './Components/Login';
import AdminLogin from './Components/AdminLogin';
import MasjidUthmanLogin from './Components/MasjidUthmanLogin';
import MasjidLanding from './Components/MasjidLanding';
import Home from './Components/Home';
import Landing from './Components/Landing';
import AddressDetail from './Components/AddressDetail';
import MapView from './Components/MapView';

function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/login" element={<Login />} />
                <Route path="/admin-login" element={<AdminLogin />} />
                <Route path="/masjid-uthman" element={<MasjidUthmanLogin />} />
                <Route path="/:masjidSlug" element={<MasjidLanding />} />
                <Route path="/landing/:masjidID/:unitID" element={<Landing />} />
                <Route path="/address/:id" element={<AddressDetail />} />
                <Route path="/map/:masjidID/:unitID" element={<MapView />} />
            </Routes>
        </BrowserRouter>
    );
}

export default App;
