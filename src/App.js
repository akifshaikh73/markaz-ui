import React, { useState } from 'react';
import Login from './Components/Login';

function App() {
    const DEFAULT_MASJID_ID = 156;
    const DEFAULT_UNIT_ID = 1;

    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [masjidID, setMasjidID] = useState(DEFAULT_MASJID_ID);
    const [unitID, setUnitID] = useState(DEFAULT_UNIT_ID);

    const handleLogin = (masjidID = DEFAULT_MASJID_ID, unitID = DEFAULT_UNIT_ID) => {
        // Handle login logic here
        setIsLoggedIn(true);
        console.log(`masjidID: ${masjidID}, unitID: ${unitID}`);
        setMasjidID(masjidID);
        setUnitID(unitID);
    };

    return (
                <Login onLogin={handleLogin} />

    );
}

export default App;