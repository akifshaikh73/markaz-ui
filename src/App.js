import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './Components/Login';
import MasjidUthmanLogin from './Components/MasjidUthmanLogin';
import Landing from './Components/Landing';
import AddressDetail from './Components/AddressDetail';
import MapView from './Components/MapView';

function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<Navigate to="/login" />} />
                <Route path="/login" element={<Login />} />
                <Route path="/masjid-uthman" element={<MasjidUthmanLogin />} />
                <Route path="/landing/:masjidID/:unitID" element={<Landing />} />
                <Route path="/address/:id" element={<AddressDetail />} />
                <Route path="/map/:masjidID/:unitID" element={<MapView />} />
            </Routes>
        </BrowserRouter>
    );
}

export default App;
