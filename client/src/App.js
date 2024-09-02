//import React, { useState } from 'react';
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Main from './Main';
import Display from './Display';
import Form from './Form';
import Upload from './Upload';
import Login from './Login';
import Register from './Register';
import Navbar from './Navbar';
import AdminPage from './AdminPage';
import AdminRoute from './AdminRoute';
import RoleCheck from './RoleCheck';
import LoginCheck from './LoginCheck';
/*function App() {
  const [activeTab, setActiveTab] = useState('login');

  return (
    <div>
      <div className="tabs">
        <button onClick={() => setActiveTab('login')} className={activeTab === 'login' ? 'active' : ''}>
          登入
        </button>
        <button onClick={() => setActiveTab('register')} className={activeTab === 'register' ? 'active' : ''}>
          登記
        </button>
      </div>

      <div className="tab-content">
        {activeTab === 'login' && <Login />}
        {activeTab === 'register' && <Register />}
      </div>
    </div>
  );
} */

  function App() {
    return (
        <Router>
          <Navbar/>
            <Routes>
                <Route path="/" element={<LoginCheck element={<Main />}/>} />
                <Route path="/display" element={<LoginCheck element={<Display />}/>} />
                <Route path="/form/:order_id/:order_type" element={<LoginCheck element={<Form />}/>} />
                <Route path="/upload" element={<AdminRoute element={<Upload />} />} />
                <Route path="/login"  element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/admin" element={<AdminRoute element={<AdminPage />} />} />
                <Route path="/check" element={<RoleCheck/>}/>
            </Routes>
        </Router>
    );
}



export default App;