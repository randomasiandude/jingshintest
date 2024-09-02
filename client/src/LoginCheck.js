import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import axios from 'axios';

const LoginCheck = ({ element }) => {
    const [authStatus, setAuthStatus] = useState(null);

    useEffect(() => {
        axios.get('http://192.168.50.59:5001/check-auth', { withCredentials: true })
            .then(response => {
                if (response.data.role === 'user' || response.data.role === 'admin') {
                    setAuthStatus(true);
                } else {
                    setAuthStatus(false);
                }
            })
            .catch(error => {
                setAuthStatus(false);
            });
    }, []);

    if (authStatus === null) {
        return <p>Loading...</p>; // Or a loading spinner
    }

    return authStatus ? element : <Navigate to="/login" />;
};

export default LoginCheck;
