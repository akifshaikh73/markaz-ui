import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const Login = () => {
    const [masjidID, setMasjidID] = useState(156);
    const [unitID, setUnitID] = useState(1);

    const navigate = useNavigate();
    const handleMasjidIDChange = (event) => {
        setMasjidID(event.target.value);
    };

    const handleUnitIDChange = (event) => {
        setUnitID(event.target.value);
    };

    const handleLogin = () => {
        // Handle login logic here
            // get value from input field
        console.log(`masjidID: ${masjidID}, unitID: ${unitID}`);
    
        setMasjidID(masjidID);
        setUnitID(unitID);
        //onLogin(masjidID,unitID);

        navigate(`/landing/${masjidID}/${unitID}` , { state : { 
            isLoggedIn: true 
        } });
      };
      
    return (
        <div>
            <label>
                Masjid ID:
                <input type="number" value={masjidID} onChange={handleMasjidIDChange} />
            </label>
            <label>
                Unit ID:
                <input type="number" value={unitID} onChange={handleUnitIDChange} />
            </label>
            <button onClick={handleLogin} disabled={!masjidID || !unitID}>
                Login
            </button>
        </div>
    );
};

export default Login;