import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './AdminPage.css';  // Add a new CSS file for styling

const AdminPage = () => {
    const [pendingRegistrations, setPendingRegistrations] = useState([]);
    const [message, setMessage] = useState('');

    useEffect(() => {
        // Fetch pending registrations when the component loads
        axios.get('http://192.168.50.59:5001/pending-registrations', { withCredentials: true })
            .then(response => {
                setPendingRegistrations(response.data);
            })
            .catch(error => {
                console.error('There was an error fetching pending registrations!', error);
            });
    }, []);
    

    const handleApprove = (user_id) => {
        axios.post('http://192.168.50.59:5001/approve-user', { user_id })
            .then(response => {
                setMessage(response.data.message);
                setPendingRegistrations(prev => prev.filter(user => user.user_id !== user_id));
            })
            .catch(error => {
                console.error('There was an error approving the user!', error);
                setMessage('Failed to approve user. Try again.');
            });
    };

    return (
        <div>
            <h1>帳號待審核中</h1>
            {message && <p>{message}</p>}
            <div className="card-container">
                {pendingRegistrations.map(user => (
                    <div key={user.user_id} className="user-card">
                        <p><strong>帳號:</strong> {user.username}</p>
                        <p><strong>姓名:</strong> {user.name}</p>
                        <p><strong>權限:</strong> {user.role}</p>
                        <p><strong>樓層:</strong> {user.floor}</p>
                        <p><strong>申請日期:</strong> {new Date(user.created_at).toLocaleDateString()}</p>
                        <button onClick={() => handleApprove(user.user_id)} className="approve-button">Approve</button>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default AdminPage;
