import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './Display.css'; // Importing Display styles for cards
import './OrderStatus.css';

const OrderStatus = ({ orderId, orderType }) => {
    const [stages, setStages] = useState([]);
    const [selectedStage, setSelectedStage] = useState(null);
    const [newStage, setNewStage] = useState({
        floor: '',
        stage: '',
        personInCharge: '',
        productionQuantity: 0,
        peopleCount: 0,
        startTime: null,
        endTime: null,
        totalWorkingTime: 0
    });
    const [isAddingStage, setIsAddingStage] = useState(false);

    const secondsToHHMMSS = (totalSeconds) => {
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const seconds = totalSeconds % 60;
    
        return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    };
    

    useEffect(() => {
        fetchStages();
    }, [orderId, orderType]);

    const fetchStages = async () => {
        try {
            const response = await axios.get(`http://192.168.50.59:5000/stages/${orderId}/${orderType}`);
            console.log('Fetched stages:', response.data); // Log the fetched data
            if (Array.isArray(response.data) && response.data.length > 0) {
                setStages(response.data);
            } else {
                console.warn('No stages found or data is not an array:', response.data);
                setStages([]);
            }
        } catch (error) {
            console.error('Error fetching stages:', error);
            setStages([]);
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setNewStage(prevState => ({ ...prevState, [name]: value }));
    };

    const handleAddStage = async () => {
        if (!newStage.floor || !newStage.stage || !newStage.personInCharge || !newStage.peopleCount) {
            alert('資訊不足無法新增製程.');
            return;
        }

        setIsAddingStage(true);
        try {
            const response = await axios.post(`http://192.168.50.59:5000/stages`, {
                order_id: orderId,
                order_type: orderType,
                floor: newStage.floor,
                stage: newStage.stage,
                person_in_charge: newStage.personInCharge,
                people_count: newStage.peopleCount,
                production_quantity: newStage.productionQuantity,
                status: '未開工',
            });
            const newStageWithId = { ...newStage, id: response.data.stageId };
            setStages([...stages, newStageWithId]);
            setSelectedStage(newStageWithId);
            resetNewStage();
        } catch (error) {
            console.error('Error adding stage:', error);
        } finally {
            setIsAddingStage(false);
        }
    };

    const formatDateForMySQL = (date) => {
        const offset = date.getTimezoneOffset() * 60000; // Offset in milliseconds
        const localISOTime = new Date(date - offset).toISOString().slice(0, 19).replace('T', ' ');
        return localISOTime;
    };    

    const handleStart = async (stageId) => {
        const currentTime = formatDateForMySQL(new Date());
    
        try {
            // First update the database with the new start time
            const response = await axios.put(`http://192.168.50.59:5000/stages/${stageId}/start`, { 
                start_time: currentTime,
                status: '生產中',
                order_id: orderId, // Pass the order ID
                order_type: orderType // Pass the order type
            });
            console.log("API Response:", response.data);
    
            // Then update the local state to reflect this change
            const updatedStages = stages.map(stage => {
                if (stage.id === stageId) {
                    return { ...stage, start_time: currentTime, status: '生產中', productionQuantity: 0 };
                }
                return stage;
            });
    
            setStages(updatedStages);
            setSelectedStage(updatedStages.find(stage => stage.id === stageId)); // Select the started stage
        } catch (error) {
            console.error('Error updating start time:', error);
        }
    };
    

    const handleEnd = async (stageId) => {
        const selectedStage = stages.find(stage => stage.id === stageId);

        if (!selectedStage.productionQuantity || selectedStage.productionQuantity <= 0) {
            alert('數量無法為0;請輸入正確數量!');
            return;
        }
    
        const currentTime = formatDateForMySQL(new Date());
        const totalWorkingTime = (new Date(currentTime) - new Date(selectedStage.start_time)) / 1000;
        const totalWorkingTimeFormatted = secondsToHHMMSS(totalWorkingTime);
    
        const updatedStages = stages.map(stage => {
            if (stage.id === stageId) {
                return { 
                    ...stage, 
                    end_time: currentTime, 
                    total_working_time: totalWorkingTimeFormatted,
                    status: '已結束',
                    productionQuantity: selectedStage.productionQuantity
                };
            }
            return stage;
        });
    
        setStages(updatedStages);
    
        try {
            await axios.put(`http://192.168.50.59:5000/stages/${stageId}/end`, {
                end_time: currentTime,
                total_working_time: totalWorkingTimeFormatted,
                status: '已結束',
                order_id: orderId,
                order_type: orderType,
                production_quantity: selectedStage.productionQuantity,
                stage: selectedStage.stage
            });
            console.log("API Response: Stage updated successfully");
        } catch (error) {
            console.error('Error updating stage:', error);
        }
    };

    const formatDateForDisplay = (datetime) => {
        return datetime ? new Date(datetime).toLocaleString('en-US', { timeZone: 'Asia/Taipei', hour12: false }).replace(',', '') : '';
    };

    const resetNewStage = () => {
        setNewStage({
            floor: '',
            stage: '',
            personInCharge: '',
            productionQuantity: 0,
            peopleCount: 0,
            startTime: null,
            endTime: null,
            totalWorkingTime: 0
        });
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
    

    return (
        <div className="order-status">
            <h2>工單作業狀態</h2>

            <div>
                <label>樓層:</label>
                <select name="floor" value={newStage.floor} onChange={handleInputChange} disabled={isAddingStage}>
                    <option value="">請選擇樓層</option>
                    <option value="1F">1F</option>
                    <option value="2F">2F</option>
                    <option value="3F">3F</option>
                    <option value="4F">4F</option>
                    <option value="5F">5F</option>
                </select>
            </div>
            <div>
                <label>作業製程:</label>
                <select name="stage" value={newStage.stage} onChange={handleInputChange} disabled={isAddingStage}>
                    <option value="">請選擇製程</option>
                    <option value="前段作業">前段作業</option>
                    <option value="後段作業">後段作業</option>
                </select>
            </div>
            <div>
                <label>班長/代線人員:</label>
                <select name="personInCharge" value={newStage.personInCharge} onChange={handleInputChange} disabled={isAddingStage}>
                    <option value="">請選擇代線人員</option>
                    <option value="建逢">建逢</option>
                    <option value="朝東">朝東</option>
                    <option value="家轉">家轉</option>
                    <option value="小范">小范</option>
                    <option value="班長">班長</option>
                </select>
            </div>
            <div>
                <label>人數:</label>
                <input type="number" name="peopleCount" value={newStage.peopleCount} onChange={handleInputChange} disabled={isAddingStage} />
            </div>
            <button onClick={handleAddStage} disabled={isAddingStage}>新增</button>

            <div className="cards-container">
                {stages.length > 0 ? (
                    stages.map((stage) => (
                        <div
                            key={stage.id}
                            className={`order-card ${selectedStage?.id === stage.id ? 'selected' : ''} ${stage.stage === '前段作業' ? 'qianduanzuoye' : 'houduanzuoye'}`}
                        >
                            <p><strong>作業製程:</strong> {stage.stage}</p>
                            <p><strong>樓層:</strong> {stage.floor}</p>
                            <p><strong>班長/代線人員:</strong> {stage.person_in_charge}</p>
                            <p><strong>人數:</strong> {stage.people_count}</p>
                            <p><strong>開始作業時間:</strong> {formatDateForDisplay(stage.start_time)}</p>
                            <p><strong>結束作業時間:</strong> {formatDateForDisplay(stage.end_time)}</p>
                            <p><strong>總工時:</strong> {stage.total_working_time || '00:00:00'}</p>
                            <p>
                                <strong>狀態: </strong>
                                <span className={`status-dot ${getStatusClass(stage.status)}`}></span>
                                {stage.status}
                            </p>

                            {stage.end_time ? (
                                        <p><strong>數量:</strong> {stage.production_quantity}</p> // Display only when the stage has ended
                                    ) : (
                                        <div>
                                            <label>數量:</label>
                                            <input 
                                                type="number" 
                                                name="productionQuantity" 
                                                value={stage.productionQuantity || 0} 
                                                onChange={(e) => {
                                                    const value = e.target.value;
                                                    const updatedStages = stages.map(s => 
                                                        s.id === stage.id 
                                                            ? { ...s, productionQuantity: value > 0 ? Number(value) : 0 } 
                                                            : s
                                                    );
                                                    setStages(updatedStages);
                                                }} 
                                                disabled={!stage.start_time || stage.end_time} // Enable only when started and not ended
                                            />
                                        </div>
                                    )}                            
                            {!stage.start_time && (
                                <button onClick={() => handleStart(stage.id)}>開始</button>
                            )}
                            {stage.start_time && !stage.end_time && (
                                <button onClick={() => handleEnd(stage.id)}>結束</button>
                            )}
                        </div>
                    ))
                ) : (
                    <p>無製程顯示.</p>
                )}
            </div>
        </div>
    );
};

export default OrderStatus;
