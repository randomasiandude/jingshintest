import React, { useState } from 'react';
import axios from 'axios';
import './Login.css';

const Register = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [floor, setFloor] = useState(''); // New state for floor
    const [name, setName] = useState(''); // New state for name
    const [message, setMessage] = useState('');

    const handleRegister = async (e) => {
        e.preventDefault();
        try {
            await axios.post('http://192.168.50.59:5001/register', { username, password, floor, name });
            setMessage('User registered successfully!');
        } catch (error) {
            setMessage('Registration failed. Try again.');
        }
    };

    return (
        <div className='login-page-container'>
            <div className='login-page'>
                <h1>申請帳號</h1>
                <form onSubmit={handleRegister}>
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
                    <div className='custom-dropdown'>
                        <label>工作樓層: </label> {/* New Floor Selection */}
                        <select 
                            value={floor}
                            onChange={(e) => setFloor(e.target.value)}
                            required
                        >
                            <option value="">選擇樓層</option>
                            <option value="Floor 1">Floor 1</option>
                            <option value="Floor 2">Floor 2</option>
                            <option value="Floor 3">Floor 3</option>
                        </select>
                    </div>
                    <div>
                        <label>姓名: </label> {/* New Name Input */}
                        <input 
                            type="text" 
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            required 
                        />
                    </div>
                    <button className='button' type="submit">申請帳號</button>
                </form>
                {message && <p>{message}</p>}
            </div>
        </div>
    );
};

export default Register;
