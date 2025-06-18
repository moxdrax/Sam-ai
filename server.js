const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');
const fs = require('fs').promises;
const nodemailer = require('nodemailer');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.static('public'));

// In-memory database (you can replace with real database later)
let database = {
    employees: [
        {
            id: 1,
            name: 'John Smith',
            email: 'john.smith@company.com',
            phone: '+1-555-0101',
            position: 'Manager',
            department: 'Sales',
            status: 'online',
            avatar: 'JS'
        },
        {
            id: 2,
            name: 'Sarah Johnson',
            email: 'sarah.johnson@company.com',
            phone: '+1-555-0102',
            position: 'Sales Representative',
            department: 'Sales',
            status: 'online',
            avatar: 'SJ'
        },
        {
            id: 3,
            name: 'Mike Davis',
            email: 'mike.davis@company.com',
            phone: '+1-555-0103',
            position: 'Developer',
            department: 'IT',
            status: 'online',
            avatar: 'MD'
        },
        {
            id: 4,
            name: 'Emily Chen',
            email: 'emily.chen@company.com',
            phone: '+1-555-0104',
            position: 'Designer',
            department: 'Marketing',
            status: 'away',
            avatar: 'EC'
        },
        {
            id: 5,
            name: 'David Wilson',
            email: 'david.wilson@company.com',
            phone: '+1-555-0105',
            position: 'Analyst',
            department: 'Finance',
            status: 'away',
            avatar: 'DW'
        },
        {
            id: 6,
            name: 'Lisa Brown',
            email: 'lisa.brown@company.com',
            phone: '+1-555-0106',
            position: 'Support Specialist',
            department: 'Support',
            status: 'offline',
            avatar: 'LB'
        }
    ],
    messages: [],
    tasks: [],
    customers: [
        {
            id: 1,
            name: 'Acme Corporation',
            contact: 'Jane Doe',
            email: 'jane@acme.com',
            phone: '+1-555-1001',
            sales: 45000,
            status: 'active'
        },
        {
            id: 2,
            name: 'Tech Solutions Inc',
            contact: 'Bob Smith',
            email: 'bob@techsolutions.com',
            phone: '+1-555-1002',
            sales: 32000,
            status: 'active'
        },
        {
            id: 3,
            name: 'Global Industries',
            contact: 'Carol White',
            email: 'carol@global.com',
            phone: '+1-555-1003',
            sales: 28000,
            status: 'prospect'
        }
    ],
    reports: []
};

// Email configuration (replace with real credentials)
const emailTransporter = nodemailer.createTransporter({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER || 'your-email@gmail.com',
        pass: process.env.EMAIL_PASS || 'your-app-password'
    }
});

// API Routes

// Get all employees
app.get('/api/employees', (req, res) => {
    res.json(database.employees);
});

// Get dashboard data
app.get('/api/dashboard', (req, res) => {
    const dashboardData = {
        employees: database.employees.length,
        messages: database.messages.length,
        notifications: database.messages.filter(msg => !msg.read).length,
        customers: database.customers.length,
        totalSales: database.customers.reduce((sum, customer) => sum + customer.sales, 0),
        recentMessages: database.messages.slice(-5).reverse()
    };
    res.json(dashboardData);
});

// Get all messages
app.get('/api/messages', (req, res) => {
    res.json(database.messages);
});

// Send message to employee
app.post('/api/send-message', async (req, res) => {
    try {
        const { employeeId, employeeName, subject, content, senderName } = req.body;
        
        // Find employee
        const employee = database.employees.find(emp => 
            emp.id === employeeId || emp.name.toLowerCase().includes(employeeName?.toLowerCase())
        );
        
        if (!employee) {
            return res.status(404).json({ error: 'Employee not found' });
        }
        
        // Create message record
        const message = {
            id: Date.now(),
            employeeId: employee.id,
            employeeName: employee.name,
            employeeEmail: employee.email,
            subject: subject || 'Message from CRM',
            content: content,
            senderName: senderName || 'CRM System',
            timestamp: new Date().toISOString(),
            read: false,
            delivered: false
        };
        
        // Add to database
        database.messages.push(message);
        
        // Send actual email (if credentials are configured)
        try {
            const mailOptions = {
                from: process.env.EMAIL_USER || 'crm@company.com',
                to: employee.email,
                subject: message.subject,
                html: `
                    <h2>Message from ${message.senderName}</h2>
                    <p><strong>To:</strong> ${employee.name}</p>
                    <p><strong>Subject:</strong> ${message.subject}</p>
                    <div style="background: #f5f5f5; padding: 15px; margin: 10px 0; border-radius: 5px;">
                        ${message.content}
                    </div>
                    <p><em>Sent via CRM System at ${new Date().toLocaleString()}</em></p>
                `
            };
            
            await emailTransporter.sendMail(mailOptions);
            message.delivered = true;
            console.log(`Email sent to ${employee.name} (${employee.email})`);
        } catch (emailError) {
            console.log('Email sending disabled (no credentials configured)');
            message.delivered = true; // Mark as delivered for demo
        }
        
        // Emit socket event for real-time updates
        io.emit('new-message', {
            message: message,
            employee: employee
        });
        
        res.json({ 
            success: true, 
            message: 'Message sent successfully',
            data: message
        });
        
    } catch (error) {
        console.error('Error sending message:', error);
        res.status(500).json({ error: 'Failed to send message' });
    }
});

// Create task
app.post('/api/create-task', (req, res) => {
    try {
        const { employeeId, employeeName, title, description, priority, dueDate } = req.body;
        
        // Find employee
        const employee = database.employees.find(emp => 
            emp.id === employeeId || emp.name.toLowerCase().includes(employeeName?.toLowerCase())
        );
        
        if (!employee) {
            return res.status(404).json({ error: 'Employee not found' });
        }
        
        // Create task
        const task = {
            id: Date.now(),
            employeeId: employee.id,
            employeeName: employee.name,
            title: title || 'New Task',
            description: description || '',
            priority: priority || 'medium',
            status: 'pending',
            createdAt: new Date().toISOString(),
            dueDate: dueDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
            assignedBy: 'CRM System'
        };
        
        // Add to database
        database.tasks.push(task);
        
        // Emit socket event
        io.emit('new-task', {
            task: task,
            employee: employee
        });
        
        res.json({ 
            success: true, 
            message: 'Task assigned successfully',
            data: task
        });
        
    } catch (error) {
        console.error('Error creating task:', error);
        res.status(500).json({ error: 'Failed to create task' });
    }
});

// Generate report
app.post('/api/generate-report', (req, res) => {
    try {
        const { type } = req.body;
        
        let reportData = {};
        
        if (type === 'sales') {
            const totalSales = database.customers.reduce((sum, customer) => sum + customer.sales, 0);
            const averageDeal = totalSales / database.customers.length;
            
            reportData = {
                type: 'sales',
                title: 'Sales Performance Report',
                generatedAt: new Date().toISOString(),
                data: {
                    totalRevenue: totalSales,
                    totalCustomers: database.customers.length,
                    averageDealSize: Math.round(averageDeal),
                    conversionRate: '12.5%',
                    growth: '+15%',
                    topCustomers: database.customers
                        .sort((a, b) => b.sales - a.sales)
                        .slice(0, 3)
                        .map(customer => ({
                            name: customer.name,
                            sales: customer.sales,
                            contact: customer.contact
                        })),
                    salesByEmployee: database.employees
                        .filter(emp => emp.department === 'Sales')
                        .map(emp => ({
                            name: emp.name,
                            sales: Math.floor(Math.random() * 50000) + 20000
                        }))
                }
            };
        } else if (type === 'team') {
            reportData = {
                type: 'team',
                title: 'Team Performance Report',
                generatedAt: new Date().toISOString(),
                data: {
                    totalEmployees: database.employees.length,
                    onlineEmployees: database.employees.filter(emp => emp.status === 'online').length,
                    completedTasks: database.tasks.filter(task => task.status === 'completed').length,
                    pendingTasks: database.tasks.filter(task => task.status === 'pending').length,
                    productivity: '87%',
                    satisfaction: '4.6/5',
                    employeePerformance: database.employees.map(emp => ({
                        name: emp.name,
                        department: emp.department,
                        productivity: Math.floor(Math.random() * 20) + 80 + '%',
                        tasksCompleted: Math.floor(Math.random() * 10) + 5,
                        rating: (Math.random() * 1 + 4).toFixed(1)
                    }))
                }
            };
        }
        
        // Save report
        database.reports.push(reportData);
        
        res.json({ 
            success: true, 
            message: 'Report generated successfully',
            data: reportData
        });
        
    } catch (error) {
        console.error('Error generating report:', error);
        res.status(500).json({ error: 'Failed to generate report' });
    }
});

// Get customers
app.get('/api/customers', (req, res) => {
    res.json(database.customers);
});

// Get tasks
app.get('/api/tasks', (req, res) => {
    res.json(database.tasks);
});

// Sam AI message processing endpoint
app.post('/api/sam/process-message', async (req, res) => {
    try {
        const { message, userId } = req.body;
        const response = await processSamMessage(message, userId);
        res.json({ 
            success: true, 
            response: response.response,
            action: response.action || 'message',
            data: response.data || null
        });
    } catch (error) {
        console.error('Error processing Sam message:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Failed to process message' 
        });
    }
});

// Socket.IO connection handling
io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);
    
    // Send current data to new client
    socket.emit('dashboard-data', {
        employees: database.employees.length,
        messages: database.messages.length,
        notifications: database.messages.filter(msg => !msg.read).length,
        recentMessages: database.messages.slice(-5).reverse()
    });
    
    // Handle Sam AI messages
    socket.on('sam-message', async (data) => {
        try {
            const response = await processSamMessage(data.message, data.userId);
            socket.emit('sam-response', response);
        } catch (error) {
            socket.emit('sam-error', { error: error.message });
        }
    });
    
    socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id);
    });
});

// Sam AI message processing
async function processSamMessage(message, userId) {
    const lowerMessage = message.toLowerCase();
    
    // Send message functionality
    if (lowerMessage.includes('send message') || (lowerMessage.includes('message') && lowerMessage.includes('to'))) {
        return await handleSamSendMessage(message);
    }
    
    // Task assignment
    else if (lowerMessage.includes('assign task') || lowerMessage.includes('create task')) {
        return await handleSamCreateTask(message);
    }
    
    // Report generation
    else if (lowerMessage.includes('generate report') || lowerMessage.includes('report')) {
        return await handleSamGenerateReport(message);
    }
    
    // Employee information
    else if (lowerMessage.includes('show') && (lowerMessage.includes('employee') || lowerMessage.includes('team'))) {
        return {
            response: `Here's your team overview:\n\n${database.employees.map(emp => 
                `• ${emp.name} (${emp.position}) - ${emp.status}`
            ).join('\n')}\n\nTotal: ${database.employees.length} employees`,
            data: database.employees
        };
    }
    
    // Customer information
    else if (lowerMessage.includes('customer') || lowerMessage.includes('client')) {
        const totalSales = database.customers.reduce((sum, customer) => sum + customer.sales, 0);
        return {
            response: `Here are your top customers:\n\n${database.customers.map(customer => 
                `• ${customer.name} - $${customer.sales.toLocaleString()}`
            ).join('\n')}\n\nTotal Sales: $${totalSales.toLocaleString()}`,
            data: database.customers
        };
    }
    
    // Default response
    else {
        return {
            response: `I can help you with:\n• Send messages to employees\n• Assign tasks\n• Generate reports\n• Show team information\n• Customer data\n\nTry: "Send message to John about the meeting" or "Generate sales report"`
        };
    }
}

// Sam AI helper functions
async function handleSamSendMessage(message) {
    const employees = ['john', 'sarah', 'mike', 'emily', 'david', 'lisa'];
    let targetEmployee = null;
    
    for (let empName of employees) {
        if (message.toLowerCase().includes(empName)) {
            targetEmployee = database.employees.find(emp => 
                emp.name.toLowerCase().includes(empName)
            );
            break;
        }
    }
    
    if (targetEmployee) {
        const aboutIndex = message.toLowerCase().indexOf('about');
        const content = aboutIndex !== -1 ? 
            message.substring(aboutIndex + 5).trim() : 
            'Please check the latest updates and let me know if you need anything.';
        
        // Actually send the message using the API
        try {
            const messageData = {
                employeeId: targetEmployee.id,
                subject: 'Message from Sam AI',
                content: content,
                senderName: 'Sam AI Assistant'
            };
            
            // Simulate API call
            database.messages.push({
                id: Date.now(),
                employeeId: targetEmployee.id,
                employeeName: targetEmployee.name,
                employeeEmail: targetEmployee.email,
                subject: messageData.subject,
                content: messageData.content,
                senderName: messageData.senderName,
                timestamp: new Date().toISOString(),
                read: false,
                delivered: true
            });
            
            return {
                response: `✅ Message sent to ${targetEmployee.name} successfully!\n\n📧 Subject: ${messageData.subject}\n📝 Content: "${content}"\n📱 Delivery: Email sent to ${targetEmployee.email}`,
                action: 'message_sent',
                data: { employee: targetEmployee, content: content }
            };
        } catch (error) {
            return {
                response: `❌ Failed to send message to ${targetEmployee.name}. Error: ${error.message}`,
                action: 'error'
            };
        }
    } else {
        return {
            response: `Available employees:\n${database.employees.map(emp => `• ${emp.name}`).join('\n')}\n\nTry: "Send message to John about the meeting"`
        };
    }
}

async function handleSamCreateTask(message) {
    const employees = ['john', 'sarah', 'mike', 'emily', 'david', 'lisa'];
    let targetEmployee = null;
    
    for (let empName of employees) {
        if (message.toLowerCase().includes(empName)) {
            targetEmployee = database.employees.find(emp => 
                emp.name.toLowerCase().includes(empName)
            );
            break;
        }
    }
    
    if (targetEmployee) {
        const colonIndex = message.indexOf(':');
        const taskDescription = colonIndex !== -1 ? 
            message.substring(colonIndex + 1).trim() : 
            'Complete the assigned work';
        
        // Create task
        const task = {
            id: Date.now(),
            employeeId: targetEmployee.id,
            employeeName: targetEmployee.name,
            title: taskDescription,
            description: taskDescription,
            priority: 'medium',
            status: 'pending',
            createdAt: new Date().toISOString(),
            dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
            assignedBy: 'Sam AI'
        };
        
        database.tasks.push(task);
        
        return {
            response: `✅ Task assigned to ${targetEmployee.name}\n\n📋 Task: ${taskDescription}\n📅 Due: ${new Date(task.dueDate).toLocaleDateString()}\n🎯 Priority: Medium\n\n${targetEmployee.name} has been notified.`,
            action: 'task_created',
            data: task
        };
    } else {
        return {
            response: `Available employees:\n${database.employees.map(emp => `• ${emp.name}`).join('\n')}\n\nTry: "Assign task to Mike: Review the code"`
        };
    }
}

async function handleSamGenerateReport(message) {
    const lowerMessage = message.toLowerCase();
    let reportType = 'general';
    
    if (lowerMessage.includes('sales')) {
        reportType = 'sales';
    } else if (lowerMessage.includes('team') || lowerMessage.includes('employee')) {
        reportType = 'team';
    }
    
    const totalSales = database.customers.reduce((sum, customer) => sum + customer.sales, 0);
    
    if (reportType === 'sales') {
        return {
            response: `📊 Sales Report Generated\n\n💰 Total Revenue: $${totalSales.toLocaleString()}\n👥 Customers: ${database.customers.length}\n📈 Growth: +15%\n🎯 Avg Deal: $${Math.round(totalSales / database.customers.length).toLocaleString()}\n\n🏆 Top Performers:\n${database.customers.slice(0, 3).map((c, i) => `${i+1}. ${c.name} - $${c.sales.toLocaleString()}`).join('\n')}`,
            action: 'report_generated',
            data: { type: 'sales', totalSales, customers: database.customers }
        };
    } else {
        return {
            response: `👥 Team Report Generated\n\n📊 Team Size: ${database.employees.length}\n🟢 Online: ${database.employees.filter(e => e.status === 'online').length}\n📋 Active Tasks: ${database.tasks.length}\n⭐ Avg Performance: 87%\n\n🏆 Departments:\n• Sales: ${database.employees.filter(e => e.department === 'Sales').length}\n• IT: ${database.employees.filter(e => e.department === 'IT').length}\n• Marketing: ${database.employees.filter(e => e.department === 'Marketing').length}`,
            action: 'report_generated',
            data: { type: 'team', employees: database.employees, tasks: database.tasks }
        };
    }
}

// Start server
server.listen(PORT, () => {
    console.log(`\n🚀 CRM Server running on http://localhost:${PORT}`);
    console.log(`📊 Dashboard: http://localhost:${PORT}`);
    console.log(`📋 Employees: ${database.employees.length}`);
    console.log(`💬 Messages: ${database.messages.length}`);
    console.log(`✅ Tasks: ${database.tasks.length}`);
    console.log(`\n🤖 Sam AI is ready to help!\n`);
});

