import React, { useEffect, useState } from 'react';
import axios from 'axios';

const RoleCheck = () => {
    const [role, setRole] = useState(null);

    useEffect(() => {
        axios.get('http://192.168.50.59:5001/check-auth', { withCredentials: true })
            .then(response => {
                setRole('admin');
            })
            .catch(error => {
                setRole('user');
            });
    }, []);

    return (
        <div>
            <h1>User Role: {role}</h1>
        </div>
    );
};

export default RoleCheck;
