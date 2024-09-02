import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './Login.css';

const Login = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [errorMessage, setErrorMessage] = useState('');
    const navigate = useNavigate(); // Initialize the navigate hook

    const handleLogin = (e) => {
        e.preventDefault();

        axios.post('http://192.168.50.59:5001/login', {
            identifier: username,
            password: password
        }, { withCredentials: true })
        .then(response => {
            if (response.data.role === 'admin') {
                navigate('/admin'); // Redirect to admin page if admin
            } else {
                navigate('/'); // Redirect to home or another page if not admin
            }
            console.log('Login successful');
            window.location.reload(); // Reload the page after successful login
            // Redirect to the desired page, e.g., admin dashboard
        })
        .catch(error => {
            console.error('There was an error!', error);
            setErrorMessage('Login failed. Please check your credentials.');
        });
    };
    return (
        <div className="login-page-container"> 
            <div className="login-page">
                <div className="login-container">
                    <h1>登入系統</h1>
                    <form onSubmit={handleLogin}>
                        <div>
                            <label>帳號: </label>
                            <input 
                                type="text" 
                                value={username}
                                onChange={(e) => setUsername(e.target.value)} 
                                required 
                            />
                        </div>
                        <div>
                            <label>密碼: </label>
                            <input 
                                type="password" 
                                value={password}
                                onChange={(e) => setPassword(e.target.value)} 
                                required 
                            />
                        </div>
                        <button type="submit">登入</button>
                    </form>
                    {errorMessage && <p>{errorMessage}</p>}
                </div>
            </div>
            </div>
    );
};

export default Login;
