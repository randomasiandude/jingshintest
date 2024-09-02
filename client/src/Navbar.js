import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import './Navbar.css'; // Import the CSS file for styling

const Navbar = () => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [isAdmin, setIsAdmin] = useState(false);
    const navbarRef = useRef(null);

    useEffect(() => {
        // Check authentication status and role
        axios.get('http://192.168.50.59:5001/check-auth', { withCredentials: true })
            .then(response => {
                setIsLoggedIn(true);
                if (response.data.role === 'admin') {
                    setIsAdmin(true);
                }
            })
            .catch(error => {
                setIsLoggedIn(false);
                setIsAdmin(false);
            });
    }, []);

    const toggleMenu = () => {
        setIsMenuOpen(!isMenuOpen);
    };

    const handleClickOutside = (event) => {
        if (navbarRef.current && !navbarRef.current.contains(event.target)) {
            setIsMenuOpen(false);
        }
    };

    useEffect(() => {
        if (isMenuOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        } else {
            document.removeEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isMenuOpen]);

    const handleLogout = () => {
        axios.post('http://192.168.50.133:5001/logout', {}, { withCredentials: true })
            .then(response => {
                setIsLoggedIn(false);
                setIsAdmin(false);
                window.location.href = '/login';
            })
            .catch(error => {
                console.error('Logout failed:', error);
            });
    };

    return (
        <nav className="navbar" ref={navbarRef}>
            <div className="navbar-container">
                <div className="navbar-logo" onClick={toggleMenu}>
                    <img src={`${process.env.PUBLIC_URL}/logo.png`} alt="Logo" />
                </div>
                <ul className={`navbar-menu ${isMenuOpen ? 'open' : ''}`}>
                    {isLoggedIn && <li><Link to="/">主頁</Link></li> }
                    {isLoggedIn && <li><Link to="/display">工單查詢</Link></li> }
                    {isLoggedIn && isAdmin && <li><Link to="/upload">工單上傳</Link></li>}
                    {isLoggedIn && isAdmin && <li><Link to="/admin">Admin Page</Link></li>}
                    {!isLoggedIn && <li><Link to="/login">Login</Link></li>}
                    {!isLoggedIn && <li><Link to="/register">Register</Link></li>}
                    {isLoggedIn && <li><button onClick={handleLogout}>Logout</button></li>}
                </ul>
            </div>
        </nav>
    );
};

export default Navbar;
