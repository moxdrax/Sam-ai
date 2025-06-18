const sqlite3 = require('sqlite3').verbose();
const { v4: uuidv4 } = require('uuid');
const path = require('path');

class Database {
    constructor() {
        this.db = null;
        this.dbPath = path.join(__dirname, 'crm_database.db');
    }

    initialize() {
        return new Promise((resolve, reject) => {
            this.db = new sqlite3.Database(this.dbPath, (err) => {
                if (err) {
                    console.error('Error opening database:', err);
                    reject(err);
                    return;
                }
                console.log('📁 Connected to SQLite database');
                this.createTables().then(resolve).catch(reject);
            });
        });
    }

    createTables() {
        return new Promise((resolve, reject) => {
            const tables = [
                // Employees table
                `CREATE TABLE IF NOT EXISTS employees (
                    id TEXT PRIMARY KEY,
                    name TEXT NOT NULL,
                    email TEXT UNIQUE NOT NULL,
                    department TEXT,
                    position TEXT,
                    phone TEXT,
                    status TEXT DEFAULT 'active',
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
                )`,

                // Messages table
                `CREATE TABLE IF NOT EXISTS messages (
                    id TEXT PRIMARY KEY,
                    sender_id TEXT,
                    recipient_id TEXT NOT NULL,
                    subject TEXT NOT NULL,
                    content TEXT NOT NULL,
                    priority TEXT DEFAULT 'normal',
                    status TEXT DEFAULT 'sent',
                    message_type TEXT DEFAULT 'internal',
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    read_at DATETIME,
                    FOREIGN KEY (sender_id) REFERENCES employees (id),
                    FOREIGN KEY (recipient_id) REFERENCES employees (id)
                )`,

                // Notifications table
                `CREATE TABLE IF NOT EXISTS notifications (
                    id TEXT PRIMARY KEY,
                    user_id TEXT NOT NULL,
                    title TEXT NOT NULL,
                    message TEXT NOT NULL,
                    type TEXT DEFAULT 'info',
                    is_read BOOLEAN DEFAULT FALSE,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (user_id) REFERENCES employees (id)
                )`,

                // Sam AI conversations table
                `CREATE TABLE IF NOT EXISTS sam_conversations (
                    id TEXT PRIMARY KEY,
                    user_id TEXT,
                    user_message TEXT NOT NULL,
                    sam_response TEXT NOT NULL,
                    action_taken TEXT,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (user_id) REFERENCES employees (id)
                )`
            ];

            let completed = 0;
            tables.forEach((sql, index) => {
                this.db.run(sql, (err) => {
                    if (err) {
                        console.error(`Error creating table ${index}:`, err);
                        reject(err);
                        return;
                    }
                    completed++;
                    if (completed === tables.length) {
                        console.log('📋 Database tables created successfully');
                        this.seedSampleData().then(resolve).catch(reject);
                    }
                });
            });
        });
    }

    seedSampleData() {
        return new Promise((resolve, reject) => {
            // Check if employees already exist
            this.db.get('SELECT COUNT(*) as count FROM employees', (err, row) => {
                if (err) {
                    reject(err);
                    return;
                }

                if (row.count > 0) {
                    console.log('📝 Sample data already exists');
                    resolve();
                    return;
                }

                // Insert sample employees
                const sampleEmployees = [
                    {
                        id: uuidv4(),
                        name: 'John Smith',
                        email: 'john.smith@company.com',
                        department: 'Engineering',
                        position: 'Senior Developer',
                        phone: '+1-555-0101'
                    },
                    {
                        id: uuidv4(),
                        name: 'Sarah Johnson',
                        email: 'sarah.johnson@company.com',
                        department: 'Marketing',
                        position: 'Marketing Manager',
                        phone: '+1-555-0102'
                    },
                    {
                        id: uuidv4(),
                        name: 'Mike Davis',
                        email: 'mike.davis@company.com',
                        department: 'Sales',
                        position: 'Sales Representative',
                        phone: '+1-555-0103'
                    },
                    {
                        id: uuidv4(),
                        name: 'Emily Chen',
                        email: 'emily.chen@company.com',
                        department: 'HR',
                        position: 'HR Specialist',
                        phone: '+1-555-0104'
                    },
                    {
                        id: uuidv4(),
                        name: 'David Wilson',
                        email: 'david.wilson@company.com',
                        department: 'Finance',
                        position: 'Financial Analyst',
                        phone: '+1-555-0105'
                    }
                ];

                let completed = 0;
                sampleEmployees.forEach((employee) => {
                    this.addEmployee(employee).then(() => {
                        completed++;
                        if (completed === sampleEmployees.length) {
                            console.log('👥 Sample employees added successfully');
                            resolve();
                        }
                    }).catch(reject);
                });
            });
        });
    }

    // Employee methods
    getEmployees() {
        return new Promise((resolve, reject) => {
            this.db.all('SELECT * FROM employees ORDER BY name', (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });
    }

    getEmployeeById(id) {
        return new Promise((resolve, reject) => {
            this.db.get('SELECT * FROM employees WHERE id = ?', [id], (err, row) => {
                if (err) reject(err);
                else resolve(row);
            });
        });
    }

    getEmployeeByName(name) {
        return new Promise((resolve, reject) => {
            this.db.get('SELECT * FROM employees WHERE name LIKE ?', [`%${name}%`], (err, row) => {
                if (err) reject(err);
                else resolve(row);
            });
        });
    }

    addEmployee(employee) {
        return new Promise((resolve, reject) => {
            const id = employee.id || uuidv4();
            const sql = `INSERT INTO employees (id, name, email, department, position, phone) 
                         VALUES (?, ?, ?, ?, ?, ?)`;
            const params = [id, employee.name, employee.email, employee.department, employee.position, employee.phone];
            
            this.db.run(sql, params, function(err) {
                if (err) reject(err);
                else resolve({ id, ...employee });
            });
        });
    }

    // Message methods
    getMessages() {
        return new Promise((resolve, reject) => {
            const sql = `
                SELECT m.*, 
                       s.name as sender_name, s.email as sender_email,
                       r.name as recipient_name, r.email as recipient_email
                FROM messages m
                LEFT JOIN employees s ON m.sender_id = s.id
                JOIN employees r ON m.recipient_id = r.id
                ORDER BY m.created_at DESC
            `;
            this.db.all(sql, (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });
    }

    addMessage(message) {
        return new Promise((resolve, reject) => {
            const id = uuidv4();
            const sql = `INSERT INTO messages (id, sender_id, recipient_id, subject, content, priority, message_type) 
                         VALUES (?, ?, ?, ?, ?, ?, ?)`;
            const params = [
                id, 
                message.senderId || null, 
                message.recipientId, 
                message.subject, 
                message.content, 
                message.priority || 'normal',
                message.messageType || 'internal'
            ];
            
            this.db.run(sql, params, (err) => {
                if (err) reject(err);
                else {
                    // Also create a notification
                    this.addNotification({
                        userId: message.recipientId,
                        title: 'New Message',
                        message: `You have a new message: ${message.subject}`,
                        type: 'message'
                    }).then(() => {
                        resolve({ id, ...message });
                    }).catch(reject);
                }
            });
        });
    }

    // Notification methods
    getNotifications(userId) {
        return new Promise((resolve, reject) => {
            this.db.all(
                'SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC',
                [userId],
                (err, rows) => {
                    if (err) reject(err);
                    else resolve(rows);
                }
            );
        });
    }

    addNotification(notification) {
        return new Promise((resolve, reject) => {
            const id = uuidv4();
            const sql = `INSERT INTO notifications (id, user_id, title, message, type) 
                         VALUES (?, ?, ?, ?, ?)`;
            const params = [id, notification.userId, notification.title, notification.message, notification.type || 'info'];
            
            this.db.run(sql, params, (err) => {
                if (err) reject(err);
                else resolve({ id, ...notification });
            });
        });
    }

    markNotificationAsRead(notificationId) {
        return new Promise((resolve, reject) => {
            this.db.run(
                'UPDATE notifications SET is_read = TRUE WHERE id = ?',
                [notificationId],
                (err) => {
                    if (err) reject(err);
                    else resolve();
                }
            );
        });
    }

    // Sam AI conversation methods
    addConversation(conversation) {
        return new Promise((resolve, reject) => {
            const id = uuidv4();
            const sql = `INSERT INTO sam_conversations (id, user_id, user_message, sam_response, action_taken) 
                         VALUES (?, ?, ?, ?, ?)`;
            const params = [id, conversation.userId, conversation.userMessage, conversation.samResponse, conversation.actionTaken];
            
            this.db.run(sql, params, (err) => {
                if (err) reject(err);
                else resolve({ id, ...conversation });
            });
        });
    }

    close() {
        if (this.db) {
            this.db.close((err) => {
                if (err) console.error('Error closing database:', err);
                else console.log('📁 Database connection closed');
            });
        }
    }
}

module.exports = Database;

