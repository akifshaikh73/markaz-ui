import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './Components/Login';
import Landing from './Components/Landing';
import AddressDetail from './Components/AddressDetail';

function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/login" element={<Login />} />
                <Route path="/landing/:masjidID/:unitID" element={<Landing />} />
                <Route path="/address/:id" element={<AddressDetail />} />
                <Route path="*" element={<Navigate to="/login" replace />} />
            </Routes>
        </BrowserRouter>
    );
}

export default App;