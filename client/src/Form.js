import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import './Form.css'; // Import the CSS file
import OrderStatus from './OrderStatus'; // Import the OrderStatus component
import Navbar from './Navbar';

const Form = () => {
    const { order_id, order_type } = useParams();
    const [order, setOrder] = useState({});
    const [activeTab, setActiveTab] = useState('details'); // 'details' or 'status'
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        axios.get(`http://192.168.50.59:5000/form/${order_id}/${order_type}`)
            .then(response => {
                console.log("Fetched order data:", response.data);
                setOrder(response.data.order);  // Adjusted to access the `order` object in response data
                setLoading(false);
            })
            .catch(error => {
                console.error('Error fetching order details:', error);
                setLoading(false);
            });
    }, [order_id, order_type]);

    const formatDateToYYYYMMDD = (dateString) => {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        const year = date.getFullYear();
        const month = ('0' + (date.getMonth() + 1)).slice(-2);
        const day = ('0' + date.getDate()).slice(-2);
        return `${year}/${month}/${day}`;
    };

    const renderOrderDetails = () => (
        <div className="form-container">
            <h1>工單資訊</h1>
            {order ? (
                <>
                    <p>單據日期: {formatDateToYYYYMMDD(order.單據日期) || "N/A"}</p>
                    <p>單據編號: {order.單據編號 || "N/A"}</p>
                    <p>工單別: {order.工單別 || "N/A"}</p>
                    <p>客戶名稱: {order.客戶名稱 || "N/A"}</p>
                    <p>客戶訂單號: {order.客戶訂單號 || "N/A"}</p>
                    <p>產品編號: {order.產品編號 || "N/A"}</p>
                    <p>產品名稱: {order.產品名稱 || "N/A"}</p>
                    <p>製令數量: {order.製令數量 || "N/A"}</p>
                    <p>未完工數量: {order.未完工數量 || "N/A"}</p>
                    <p>預計完工日: {formatDateToYYYYMMDD(order.預計完工日) || "N/A"}</p>
                    <p>樓層: {order.樓層 || "N/A"}</p>
                    <p>標準工時: {order.標準工時 || "N/A"}</p>
                    <p>
                    <strong>狀態: </strong>
                    <span className={`status-dot ${getStatusClass(order.狀態)}`}></span>
                    {order.狀態 || "N/A"}
                    </p>
                    <p>總工時: {order.總工時 || "N/A"}</p>
                </>
            ) : (
                <>
                    <p>error404</p>
                    <p>請聯絡工程!!!</p>
                </>
            )}
        </div>
    );
    const getStatusClass = (status) => {
        switch (status) {
            case '未開工':
                return 'grey';
            case '生產中':
                return 'green';
            case '暫停中':
                return 'orange';
            case '已結束':
                return 'red';
            default:
                return 'grey';
        }
    };

    const renderStatus = () => (
        <OrderStatus orderId={order_id} orderType={order_type} />
//        <div className="order-status">
  //          <h1>工單狀態</h1>
    //        <p>工單狀態 will be implemented later.</p>
      //  </div>
    );

    return (
        <div className="form-container">
            <div className="tabs">
                <button
                    className={`tab-button ${activeTab === 'details' ? 'active' : ''}`}
                    onClick={() => setActiveTab('details')}
                >
                    訂單詳細
                </button>
                <button
                    className={`tab-button ${activeTab === 'status' ? 'active' : ''}`}
                    onClick={() => setActiveTab('status')}
                >
                    工單狀態
                </button>
            </div>

            <div className="tab-content">
                {loading ? <p>Loading order details...</p> : (
                    activeTab === 'details' ? renderOrderDetails() : renderStatus()
                )}
            </div>
        </div>
    );
};

export default Form;
