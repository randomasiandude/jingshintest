import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './Display.css'; // Import the CSS file

const Display = () => {
    const [orders, setOrders] = useState([]);
    const [filters, setFilters] = useState({
        狀態: '所有',
        單據編號: '',
        客戶訂單號: ''
    });
    const [searchExecuted, setSearchExecuted] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    const ordersPerPage = 50;

    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilters(prevFilters => ({
            ...prevFilters,
            [name]: value
        }));
    };

    const handleSearch = (page = 1) => {
        axios.get('http://192.168.50.59:5000/search-orders', {
            params: {
                ...filters,
                page,
                limit: ordersPerPage
            }
        })
        .then(response => {
            console.log('Filtered Data from server:', response.data.orders);
            setOrders(response.data.orders);
            setTotalPages(response.data.totalPages);
            setCurrentPage(page);
            setSearchExecuted(true); // Set to true after search is executed
        })
        .catch(error => {
            console.error('Error fetching work orders:', error);
        });
    };

    const handleReset = () => {
        setFilters({
            狀態: '所有',
            單據編號: '',
            客戶訂單號: ''
        });
        setOrders([]);
        setSearchExecuted(false); // Reset the state to indicate no search has been executed
        setCurrentPage(1);
        setTotalPages(1);
    };

    const handlePageChange = (page) => {
        handleSearch(page);
    };
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
    const formatDateToYYYYMMDD = (dateString) => {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        const year = date.getFullYear();
        const month = ('0' + (date.getMonth() + 1)).slice(-2);
        const day = ('0' + date.getDate()).slice(-2);
        return `${year}/${month}/${day}`;
    }; 

    return (
        <div className="display-container">
            <h1>現有工單查詢</h1>
            <div className="filter-container">
                <select
                    name="狀態"
                    value={filters.狀態}
                    onChange={handleFilterChange}
                    className="filter-select"
                >
                    <option value="所有">所有</option>
                    <option value="生產中">生產中</option>
                    <option value="暫停中">暫停中</option>
                    <option value="已結束">已結束</option>
                </select>
                
                <input
                    type="text"
                    name="單據編號"
                    placeholder="單據編號"
                    value={filters.單據編號}
                    onChange={handleFilterChange}
                    className="filter-input"
                />
                
                <input
                    type="text"
                    name="客戶訂單號"
                    placeholder="客戶訂單號"
                    value={filters.客戶訂單號}
                    onChange={handleFilterChange}
                    className="filter-input"
                />
                <div className="button-row">
                    <button onClick={() => handleSearch(1)} className="search-button">查詢</button>
                    <button onClick={handleReset} className="reset-button">還原</button>
                </div>
            </div>
            <div className="cards-container">
                {searchExecuted && orders.length > 0 ? (
                    orders.map(order => (
                        <div key={`${order.單據編號}-${order.工單別}`} className="order-card" onClick={() => window.location.href = `/form/${order.單據編號}/${encodeURIComponent(order.工單別)}`}>
                            <p><strong>單據編號: </strong>{order.單據編號}</p>
                            <p>
                                <strong>狀態: </strong>
                                <span className={`status-dot ${getStatusClass(order.狀態)}`}></span>
                                {order.狀態}
                            </p>
                            <p><strong>客戶名稱: </strong>{order.客戶名稱}</p>
                            <p><strong>客戶訂單號: </strong>{order.客戶訂單號}</p>
                            <p><strong>產品編號: </strong>{order.產品編號}</p>
                            <p><strong>製令數量: </strong>{order.製令數量}</p>
                            <p><strong>預計完工日: </strong>{formatDateToYYYYMMDD(order.預計完工日) || "N/A"}</p>
                            <p><strong>樓層: </strong>{order.樓層}</p>
                        </div>
                    ))
                ) : (
                    searchExecuted ? <p>不好意思, 此單無存在.</p> : <p>請輸入條件,則按查詢.</p>
                )}
            </div>

            {searchExecuted && totalPages > 1 && (
                <div className="pagination-container">
                    <button
                        className="pagination-button"
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage === 1}
                    >
                        Previous
                    </button>
                    <span>Page {currentPage} of {totalPages}</span>
                    <button
                        className="pagination-button"
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={currentPage === totalPages}
                    >
                        Next
                    </button>
                </div>
            )}
        </div>
    );
};

export default Display;
