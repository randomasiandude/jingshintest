process.env.TZ = 'Asia/Taipei';

const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const mysql = require('mysql2');
const multer = require('multer');
const ExcelJS = require('exceljs');
const path = require('path');
const app = express();
const PORT = 5000;

/*function getFormattedTimeInTaipei() {
    const options = {
        timeZone: 'Asia/Taipei',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
    };
    const formatter = new Intl.DateTimeFormat('en-GB', options);
    const parts = formatter.formatToParts(new Date());

    return `${parts.find(p => p.type === 'year').value}/` +
           `${parts.find(p => p.type === 'month').value}/` +
           `${parts.find(p => p.type === 'day').value} ` +
           `${parts.find(p => p.type === 'hour').value}:` +
           `${parts.find(p => p.type === 'minute').value}:` +
           `${parts.find(p => p.type === 'second').value}`;
} */

// Set up Multer for file uploads
const upload = multer({ dest: 'uploads/' });


app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Create a MySQL connection
const db = mysql.createConnection({
    host: '192.168.50.133',
    user: 'alice', // replace with your MySQL username
    password: 'alice123', // replace with your MySQL password
    database: 'work_orders_db'
});

// Connect to the database
db.connect((err) => {
    if (err) {
        console.error('Error connecting to the database:', err);
        return;
    }
    console.log('Connected to the MySQL database');
});

// Function to update the status of the work order based on stages
const updateWorkOrderStatus = (orderId, orderType) => {
    const query = `
        SELECT status FROM stage_management 
        WHERE order_id = ? AND order_type = ?
    `;
    
    db.query(query, [orderId, orderType], (err, stages) => {
        if (err) {
            console.error('Error fetching stage statuses:', err);
            return;
        }

        // Determine the new status for the work order
        let newStatus = '暫停中';  // Default to 暫停中

        // If any stage is '生產中', set the status to '生產中'
        if (stages.some(stage => stage.status === '生產中')) {
            newStatus = '生產中';
        } else if (stages.every(stage => stage.status === '已結束')) {
            // If all stages are '已結束', check the work order status
            checkAndUpdateOrderCompletion(orderId, orderType, '暫停中');
            return; // Exit to avoid overwriting with a lower priority status
        }

        // Update the status to `已結束` if all stages are complete and 未完工數量 is 0
        checkAndUpdateOrderCompletion(orderId, orderType, newStatus);
    });
};
const checkAndUpdateOrderCompletion = (orderId, orderType, currentStatus) => {
    const orderQuery = `SELECT 未完工數量 FROM work_orders WHERE 單據編號 = ? AND 工單別 = ?`;
    
    db.query(orderQuery, [orderId, orderType], (err, result) => {
        if (err) {
            console.error('Error fetching work order:', err);
            return;
        }

        if (result.length > 0 && result[0].未完工數量 === 0) {
            // Update the work_orders table to 已結束
            const updateQuery = `
                UPDATE work_orders 
                SET 狀態 = '已結束' 
                WHERE 單據編號 = ? AND 工單別 = ?
            `;
            db.query(updateQuery, [orderId, orderType], (err) => {
                if (err) {
                    console.error('Error updating work order status to 已結束:', err);
                } else {
                    console.log(`Work order status updated to 已結束`);
                }
            });
        } else {
            // Otherwise, update to the current status passed from updateWorkOrderStatus
            const updateQuery = `
                UPDATE work_orders 
                SET 狀態 = ? 
                WHERE 單據編號 = ? AND 工單別 = ?
            `;
            db.query(updateQuery, [currentStatus, orderId, orderType], (err) => {
                if (err) {
                    console.error('Error updating work order status:', err);
                } else {
                    console.log(`Work order status updated to ${currentStatus}`);
                }
            });
        }
    });
};

// API to handle stage management

// Get all stages for a specific order
app.get('/stages/:orderId/:orderType', (req, res) => {
    const { orderId, orderType } = req.params;
    console.log(`Fetching stages for order ID: ${orderId}, order Type: ${orderType}`);
    const query = 'SELECT * FROM stage_management WHERE order_id = ? AND order_type = ?';

    db.query(query, [orderId, orderType], (err, results) => {
        if (err) {
            console.error('Error fetching stages:', err);
            return res.status(500).json({ error: err.message });
        }
        console.log('Fetched stages:', results);
        res.json(results);
    });
});


// Create a new stage
app.post('/stages', (req, res) => {
    const { order_id, order_type, floor, stage, people_count, production_quantity, person_in_charge, start_time, end_time, total_working_time, status } = req.body;
    
    const query = `
        INSERT INTO stage_management 
        (order_id, order_type, floor, stage, people_count, production_quantity, person_in_charge, start_time, end_time, total_working_time, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    
    db.query(query, [order_id, order_type, floor, stage, people_count, production_quantity, person_in_charge, start_time, end_time, total_working_time, status], (err, results) => {
        if (err) {
            console.error('Error inserting data:', err);
            return res.status(500).json({ error: err.message });
        }
        res.json({ message: 'Stage added successfully!', stageId: results.insertId });
    });
});


// Update a stage's start time and end time
app.put('/stages/:id/start', (req, res) => {
    const { id } = req.params;
    const { start_time, status, order_id, order_type } = req.body;

    console.log("Received data for start:", { start_time, status });

    const sql = `
        UPDATE stage_management
        SET start_time = ?, status = ?
        WHERE id = ?
    `;

    db.query(sql, [start_time, status, id], (err, result) => {
        if (err) {
            console.error('Error updating stage start time:', err);
            res.status(500).send('Error updating stage start time');
        } else {
            updateWorkOrderStatus(order_id, order_type);  // Update the work order status
            checkAndUpdateOrderCompletion(order_id, order_type);  // Check if the order is completed
            res.send('Stage start time updated successfully');
        }
    });
});


app.put('/stages/:id/end', (req, res) => {
    const { id } = req.params;
    const { end_time, total_working_time, status, order_id, order_type, production_quantity, stage } = req.body;

    console.log("Received data for end:", { end_time, total_working_time, status, production_quantity });

    const sql = `
        UPDATE stage_management
        SET end_time = ?, total_working_time = ?, status = ?, production_quantity = ?
        WHERE id = ?
    `;

    db.query(sql, [end_time, total_working_time, status, production_quantity, id], (err, result) => {
        if (err) {
            console.error('Error updating stage end time:', err);
            res.status(500).send('Error updating stage end time');
        } else {
            if (stage === '後段作業') {
                // Update the 未完工數量 in work_orders
                const updateOrderQuantitySql = `
                    UPDATE work_orders
                    SET 未完工數量 = GREATEST(0, 未完工數量 - ?)
                    WHERE 單據編號 = ? AND 工單別 = ?
                `;
                db.query(updateOrderQuantitySql, [production_quantity, order_id, order_type], (err) => {
                    if (err) {
                        console.error('Error updating 未完工數量:', err);
                        res.status(500).send('Error updating 未完工數量');
                    } else {
                        console.log('未完工數量 updated successfully');
                        
                        // Update 總工時 in work_orders
                        const updateTotalWorkHoursSql = `
                            UPDATE work_orders
                            SET 總工時 = SEC_TO_TIME(TIME_TO_SEC(總工時) + TIME_TO_SEC(?))
                            WHERE 單據編號 = ? AND 工單別 = ?
                        `;
                        db.query(updateTotalWorkHoursSql, [total_working_time, order_id, order_type], (err) => {
                            if (err) {
                                console.error('Error updating 總工時:', err);
                                res.status(500).send('Error updating 總工時');
                            } else {
                                console.log(`總工時 updated successfully for order ${order_id}`);
                                updateWorkOrderStatus(order_id, order_type);  // Update the work order status
                                res.send('Stage end time, 未完工數量, and 總工時 updated successfully');
                            }
                        });
                    }
                });
            } else {
                // Update 總工時 in work_orders
                const updateTotalWorkHoursSql = `
                    UPDATE work_orders
                    SET 總工時 = SEC_TO_TIME(TIME_TO_SEC(總工時) + TIME_TO_SEC(?))
                    WHERE 單據編號 = ? AND 工單別 = ?
                `;
                db.query(updateTotalWorkHoursSql, [total_working_time, order_id, order_type], (err) => {
                    if (err) {
                        console.error('Error updating 總工時:', err);
                        res.status(500).send('Error updating 總工時');
                    } else {
                        console.log(`總工時 updated successfully for order ${order_id}`);
                        updateWorkOrderStatus(order_id, order_type);  // Update the work order status
                        res.send('Stage end time and 總工時 updated successfully');
                    }
                });
            }
        }
    });
});

// Serve the index page
app.get('/', (req, res) => {
    res.render('index');
});

// Serve the upload page
app.get('/upload', (req, res) => {
    res.render('upload');
});

// Serve the display page
app.get('/display', (req, res) => {
    const query = `
        SELECT 狀態, 單據編號, 工單別, 客戶名稱, 客戶訂單號, 產品編號, 製令數量, 預計完工日, 樓層
        FROM work_orders
    `;

    db.query(query, (err, results) => {
        if (err) {
            console.error('Error fetching work orders:', err);
            res.status(500).send('Error fetching data');
        } else {
            results.forEach(order => {
                order.預計完工日 = formatDateToYYYYMMDD(order.預計完工日);
            });
            res.json(results);
        }
    });
});
function formatDate(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = ('0' + (date.getMonth() + 1)).slice(-2);
    const day = ('0' + date.getDate()).slice(-2);
    return `${year}/${month}/${day}`;
}
//DISPLAY SEARCH ENGINE
app.get('/search-orders', (req, res) => {
    const { 單據編號, 狀態, 客戶訂單號, page = 1, limit = 50 } = req.query;
    const offset = (page - 1) * limit;

    let query = `
        SELECT SQL_CALC_FOUND_ROWS 狀態, 單據編號, 工單別, 客戶名稱, 客戶訂單號, 產品編號, 製令數量, 預計完工日, 樓層
        FROM work_orders
        WHERE 1=1
    `;
    const queryParams = [];

    if (單據編號) {
        query += ` AND 單據編號 LIKE ?`;
        queryParams.push(`%${單據編號}%`);
    }

    if (狀態 && 狀態 !== '所有') {
        query += ` AND 狀態 = ?`;
        queryParams.push(狀態);
    }

    if (客戶訂單號) {
        query += ` AND 客戶訂單號 LIKE ?`;
        queryParams.push(`%${客戶訂單號}%`);
    }

    query += ` LIMIT ? OFFSET ?`;
    queryParams.push(parseInt(limit), offset);

    db.query(query, queryParams, (err, results) => {
        if (err) {
            console.error('Error fetching work orders:', err);
            res.status(500).send('Error fetching data');
        } else {
            db.query('SELECT FOUND_ROWS() as total', (err, result) => {
                if (err) {
                    console.error('Error fetching total records:', err);
                    res.status(500).send('Error fetching data');
                } else {
                    const totalPages = Math.ceil(result[0].total / limit);
                    res.json({ orders: results, totalPages });
                }
            });
        }
    });
});


// Serve the form page
function formatDateToYYYYMMDD(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = ('0' + (date.getMonth() + 1)).slice(-2);
    const day = ('0' + date.getDate()).slice(-2);
    return `${year}/${month}/${day}`;
}

app.get('/form/:order_id/:order_type', (req, res) => {
    const { order_id, order_type } = req.params;

    // Example SQL query to fetch data based on order_id and order_type
    let sql = `SELECT * FROM work_orders WHERE 單據編號 = ? AND 工單別 = ?`;

    // Execute the query
    db.query(sql, [order_id, order_type], (err, result) => {
        if (err) {
            console.error('Error fetching order details:', err);
            res.status(500).json({ error: 'Failed to fetch order details' });
        } else {
            if (result.length === 0) {
                res.status(404).json({ message: 'Order not found' });
            } else {
                const order = result[0];
                order.單據日期 = formatDateToYYYYMMDD(order.單據日期);
                order.預計完工日 = formatDateToYYYYMMDD(order.預計完工日);
                res.json({ order });
            }
        }
    });
});

// Handle file upload and Excel processing
app.post('/upload', upload.single('file'), async (req, res) => {
    console.log("File received:", req.file);

    const filePath = req.file.path;
    const workbook = new ExcelJS.Workbook();

    try {
        console.log("Reading Excel file:", filePath);
        await workbook.xlsx.readFile(filePath);
        console.log("Excel file read successfully");

        const worksheet = workbook.getWorksheet(1);
        console.log("Processing worksheet:", worksheet.name);

        // Get the column headers
        const headers = {};
        worksheet.getRow(1).eachCell((cell, colNumber) => {
            headers[cell.value] = colNumber;
        });

        console.log("Column headers:", headers);

        for (let rowNumber = 2; rowNumber <= worksheet.rowCount; rowNumber++) {
            const row = worksheet.getRow(rowNumber);

            if (!row.hasValues) continue; // Skip rows without values

            console.log("Processing row:", rowNumber);

            const workOrder = {
                單據日期: headers['單據日期'] ? (row.getCell(headers['單據日期']).value ? new Date(row.getCell(headers['單據日期']).value) : null) : null,
                單據編號: headers['單據編號'] ? row.getCell(headers['單據編號']).value || null : null,
                客戶名稱: headers['客戶名稱'] ? row.getCell(headers['客戶名稱']).value || null : null,
                客戶訂單號: headers['客戶訂單號'] ? row.getCell(headers['客戶訂單號']).value || null : null,
                產品編號: headers['產品編號'] ? row.getCell(headers['產品編號']).value || null : null,
                產品名稱: headers['產品名稱'] ? row.getCell(headers['產品名稱']).value || null : null,
                製令數量: headers['製令數量'] ? row.getCell(headers['製令數量']).value || 0 : 0,
                未完工數量: headers['未完工數量'] ? row.getCell(headers['未完工數量']).value || 0 : 0,
                預計完工日: headers['預計完工日'] ? (row.getCell(headers['預計完工日']).value ? new Date(row.getCell(headers['預計完工日']).value) : null) : null,
                標準工時: headers['標準工時'] ? row.getCell(headers['標準工時']).value || null : null,
                樓層: headers['樓層'] ? row.getCell(headers['樓層']).value || null : null,
                工單別: headers['工單別'] ? row.getCell(headers['工單別']).value || null : null,
                狀態: headers['狀態'] ? row.getCell(headers['狀態']).value || '未開工' : '未開工',
                總工時: headers['總工時'] ? row.getCell(headers['總工時']).value || '00:00:00' : '00:00:00',
            };

            // Check if the work order already exists
            const checkQuery = `SELECT 單據編號, 工單別 FROM work_orders WHERE 單據編號 = ? AND 工單別 = ?`;
            const [existingOrders] = await db.promise().query(checkQuery, [workOrder.單據編號, workOrder.工單別]);

            if (existingOrders.length === 0) {
                const insertQuery = `
                    INSERT INTO work_orders (
                        單據日期, 單據編號, 客戶名稱, 客戶訂單號, 產品編號, 產品名稱, 製令數量,
                        未完工數量, 預計完工日, 標準工時, 樓層, 工單別, 狀態, 總工時
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                `;

                await db.promise().query(insertQuery, [
                    workOrder.單據日期,
                    workOrder.單據編號,
                    workOrder.客戶名稱,
                    workOrder.客戶訂單號,
                    workOrder.產品編號,
                    workOrder.產品名稱,
                    workOrder.製令數量,
                    workOrder.未完工數量,
                    workOrder.預計完工日,
                    workOrder.標準工時,
                    workOrder.樓層,
                    workOrder.工單別,
                    workOrder.狀態,
                    workOrder.總工時
                ]);

                console.log(`Inserted new work order with 單據編號: ${workOrder.單據編號} and 工單別: ${workOrder.工單別}`);

                // Check if the 未完工數量 is 0 and update status to 已結束
                if (workOrder.未完工數量 === 0) {
                    const updateStatusQuery = `
                        UPDATE work_orders 
                        SET 狀態 = '已結束'
                        WHERE 單據編號 = ? AND 工單別 = ?
                    `;
                    await db.promise().query(updateStatusQuery, [workOrder.單據編號, workOrder.工單別]);
                    console.log(`Updated status to 已結束 for work order with 單據編號: ${workOrder.單據編號}`);
                }
            } else {
                console.log(`Work order with 單據編號: ${workOrder.單據編號} and 工單別: ${workOrder.工單別} already exists. Skipping insert.`);
            }
        }

        res.send('File processed and data inserted successfully.');
    } catch (error) {
        console.error('Error processing the file:', error);
        res.status(500).send('Error processing file');
    }
});


 //Serve the index page (React app)
 app.use(express.static(path.join(__dirname, 'client', 'build')));
 app.get('*', (req, res) => {
     res.sendFile(path.resolve(__dirname, 'client', 'build', 'index.html'));
 });
 


app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
