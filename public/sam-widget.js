// Sam AI Chat Widget JavaScript
document.addEventListener('DOMContentLoaded', function() {
    initializeSamWidget();
});

let isWidgetOpen = false;
let isListening = false;
let recognition = null;

function initializeSamWidget() {
    console.log('Initializing Sam AI Chat Widget');
    
    // Get elements
    const chatButton = document.getElementById('samChatButton');
    const chatWindow = document.getElementById('samChatWindow');
    const closeBtn = document.getElementById('chatCloseBtn');
    const sendBtn = document.getElementById('chatSendBtn');
    const voiceBtn = document.getElementById('chatVoiceBtn');
    const chatInput = document.getElementById('chatInput');
    
    // Event listeners
    chatButton.addEventListener('click', toggleChatWidget);
    closeBtn.addEventListener('click', closeChatWidget);
    sendBtn.addEventListener('click', sendMessage);
    voiceBtn.addEventListener('click', toggleVoice);
    chatInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            sendMessage();
        }
    });
    
    // Initialize speech recognition
    initializeSpeechRecognition();
    
    // Simulate some initial notifications
    setTimeout(() => {
        updateNotificationCount(3);
    }, 2000);
}

function toggleChatWidget() {
    const chatWindow = document.getElementById('samChatWindow');
    const notificationDot = document.getElementById('chatNotificationDot');
    
    if (isWidgetOpen) {
        closeChatWidget();
    } else {
        openChatWidget();
        // Clear notifications when opening
        notificationDot.style.display = 'none';
    }
}

function openChatWidget() {
    const chatWindow = document.getElementById('samChatWindow');
    const chatInput = document.getElementById('chatInput');
    
    chatWindow.style.display = 'flex';
    setTimeout(() => {
        chatWindow.classList.add('open');
    }, 10);
    
    isWidgetOpen = true;
    
    // Focus on input
    setTimeout(() => {
        chatInput.focus();
    }, 300);
}

function closeChatWidget() {
    const chatWindow = document.getElementById('samChatWindow');
    
    chatWindow.classList.remove('open');
    setTimeout(() => {
        chatWindow.style.display = 'none';
    }, 300);
    
    isWidgetOpen = false;
}

function sendMessage() {
    const chatInput = document.getElementById('chatInput');
    const message = chatInput.value.trim();
    
    if (message) {
        addMessageToChat(message, 'user');
        chatInput.value = '';
        
        // Simulate Sam's response
        setTimeout(() => {
            const response = generateSamResponse(message);
            addMessageToChat(response, 'assistant');
        }, 1000);
    }
}

function sendQuickMessage(message) {
    const chatInput = document.getElementById('chatInput');
    chatInput.value = message;
    sendMessage();
}

function addMessageToChat(content, sender) {
    const chatMessages = document.getElementById('chatMessages');
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${sender}`;
    
    const currentTime = new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
    
    messageDiv.innerHTML = `
        <div class="message-avatar">${sender === 'user' ? '👤' : '🤖'}</div>
        <div class="message-content">
            <div class="message-text">${content}</div>
            <div class="message-time">${currentTime}</div>
        </div>
    `;
    
    chatMessages.appendChild(messageDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
    
    // Add animation
    messageDiv.style.opacity = '0';
    messageDiv.style.transform = 'translateY(20px)';
    setTimeout(() => {
        messageDiv.style.transition = 'all 0.3s ease';
        messageDiv.style.opacity = '1';
        messageDiv.style.transform = 'translateY(0)';
    }, 100);
}

function generateSamResponse(userMessage) {
    // Send message to server for processing
    fetch('/api/sam/process-message', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            message: userMessage,
            userId: 'user_1' // You can implement user authentication later
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            // If server response is successful, add it to chat
            setTimeout(() => {
                addMessageToChat(data.response, 'assistant');
            }, 1000);
        } else {
            // Fallback to local processing
            return generateLocalResponse(userMessage);
        }
    })
    .catch(error => {
        console.error('Server error, using local processing:', error);
        return generateLocalResponse(userMessage);
    });
    
    // Return immediate response
    return "🔄 Processing your request...";
}

// Fallback local response function
function generateLocalResponse(userMessage) {
    const lowerMessage = userMessage.toLowerCase();
    
    // Enhanced message sending functionality
    if (lowerMessage.includes('send message') || lowerMessage.includes('message') && (lowerMessage.includes('employee') || lowerMessage.includes('team') || lowerMessage.includes('staff'))) {
        return handleMessageRequest(userMessage);
    }
    
    // Enhanced report generation
    else if (lowerMessage.includes('report') || lowerMessage.includes('generate report') || lowerMessage.includes('analytics')) {
        return handleReportRequest(userMessage);
    }
    
    // Enhanced task assignment
    else if (lowerMessage.includes('assign task') || lowerMessage.includes('create task') || lowerMessage.includes('new task')) {
        return handleTaskAssignment(userMessage);
    }
    
    // Employee management
    else if (lowerMessage.includes('employee') || lowerMessage.includes('staff') || lowerMessage.includes('team')) {
        return handleEmployeeRequest(userMessage);
    }
    
    // Customer/client information
    else if (lowerMessage.includes('customer') || lowerMessage.includes('client')) {
        return "I can help you with customer information! Here are your top customers:\n\n• Acme Corp - $45,000 in sales\n• Tech Solutions - $32,000 in sales\n• Global Industries - $28,000 in sales\n\nWould you like more details about any specific customer?";
    }
    
    // Sales summary
    else if (lowerMessage.includes('sales') || lowerMessage.includes('revenue')) {
        return "📊 Here's your sales summary:\n\n💰 Total Sales: $125,000\n📈 This Month: $35,000\n📊 Growth: +15%\n🎯 Active Deals: 15\n💼 Pipeline Value: $500k\n\nWould you like me to generate a detailed report?";
    }
    
    // Task management
    else if (lowerMessage.includes('task') || lowerMessage.includes('todo')) {
        return "✅ Here are your current tasks:\n\n• Follow up with leads (Due today)\n• Prepare quarterly report (Due tomorrow)\n• Schedule team meeting (This week)\n• Review new proposals (Next week)\n\nWould you like me to help you manage any of these tasks?";
    }
    
    // Greetings
    else if (lowerMessage.includes('hello') || lowerMessage.includes('hi')) {
        return "Hello! I'm Sam, your CRM AI assistant. I can help you:\n\n📧 Send messages to employees\n📊 Generate reports\n✅ Assign tasks\n👥 Manage team\n📈 Track performance\n\nTry saying: 'Send message to John about the meeting' or 'Generate sales report'";
    }
    
    // Help command
    else if (lowerMessage.includes('help')) {
        return "I can assist you with:\n\n📧 **Messaging**: 'Send message to [employee] about [topic]'\n📊 **Reports**: 'Generate [type] report'\n✅ **Tasks**: 'Assign task to [employee]'\n👥 **Employees**: 'Show me team members'\n📈 **Analytics**: 'Show performance data'\n🏢 **Customers**: 'Show top customers'\n\nJust tell me what you need help with!";
    }
    
    // Default response
    else {
        return `I understand you're asking about: "${userMessage}".\n\nI can help you with:\n• 📧 Send messages to employees\n• 📊 Generate reports\n• ✅ Assign tasks\n• 👥 Manage team members\n\nTry being more specific, like:\n'Send message to Sarah about the project update'\n'Generate monthly sales report'\n'Assign task to Mike'`;
    }
}

// Handle message sending requests
function handleMessageRequest(userMessage) {
    const employees = ['John Smith', 'Sarah Johnson', 'Mike Davis', 'Emily Chen', 'David Wilson', 'Lisa Brown'];
    
    // Extract employee name from message
    let targetEmployee = null;
    for (let employee of employees) {
        const firstName = employee.split(' ')[0].toLowerCase();
        if (userMessage.toLowerCase().includes(firstName)) {
            targetEmployee = employee;
            break;
        }
    }
    
    if (targetEmployee) {
        // Simulate sending message
        setTimeout(() => {
            addMessageToChat(`✅ Message sent to ${targetEmployee} successfully!\n\n📧 **Message Preview:**\n\"${extractMessageContent(userMessage)}\"\n\n📱 **Delivery Status:**\n• Email: Delivered\n• SMS: Delivered\n• In-app notification: Read\n\nWould you like to send another message or set up a follow-up reminder?`, 'assistant');
        }, 2000);
        
        return `📧 Preparing to send message to **${targetEmployee}**...\n\n📝 **Message Content:**\n\"${extractMessageContent(userMessage)}\"\n\n🔄 Sending via email, SMS, and in-app notification...`;
    } else {
        return `📧 **Message Center**\n\nAvailable team members:\n• John Smith (Manager)\n• Sarah Johnson (Sales Rep)\n• Mike Davis (Developer)\n• Emily Chen (Designer)\n• David Wilson (Analyst)\n• Lisa Brown (Support)\n\nTry: \"Send message to John about the quarterly review\" or \"Message Sarah about the client meeting\"`;
    }
}

// Handle report generation requests
function handleReportRequest(userMessage) {
    const lowerMessage = userMessage.toLowerCase();
    
    if (lowerMessage.includes('sales')) {
        setTimeout(() => {
            addMessageToChat(`📊 **Sales Report Generated!**\n\n📈 **Monthly Performance:**\n• Revenue: $125,000 (+15%)\n• New Customers: 23\n• Conversion Rate: 12.5%\n• Average Deal Size: $5,430\n\n🏆 **Top Performers:**\n1. Sarah Johnson - $45K\n2. Mike Davis - $32K\n3. Emily Chen - $28K\n\n📋 **Action Items:**\n• Follow up with 15 warm leads\n• Schedule Q2 strategy meeting\n• Review pricing strategy\n\n📄 Full report has been saved to your dashboard. Would you like me to email it to anyone?`, 'assistant');
        }, 3000);
        
        return `📊 **Generating Sales Report...**\n\n🔄 Analyzing data:\n• ✅ Revenue metrics\n• ✅ Customer acquisition\n• ✅ Team performance\n• ✅ Pipeline analysis\n\n📈 Report will be ready in a few seconds...`;
    } else if (lowerMessage.includes('team') || lowerMessage.includes('employee')) {
        setTimeout(() => {
            addMessageToChat(`👥 **Team Performance Report**\n\n📊 **Overall Metrics:**\n• Team Productivity: 87%\n• Customer Satisfaction: 4.6/5\n• Task Completion Rate: 92%\n• Average Response Time: 2.3 hours\n\n🏆 **Individual Performance:**\n• John Smith: 95% (Excellent)\n• Sarah Johnson: 88% (Good)\n• Mike Davis: 91% (Very Good)\n• Emily Chen: 89% (Good)\n• David Wilson: 93% (Very Good)\n\n📋 **Recommendations:**\n• Provide additional training for customer service\n• Implement new project management tools\n• Schedule team building activities\n\nWould you like to drill down into any specific metrics?`, 'assistant');
        }, 3000);
        
        return `👥 **Generating Team Performance Report...**\n\n🔄 Collecting data:\n• ✅ Productivity metrics\n• ✅ Task completion rates\n• ✅ Customer feedback\n• ✅ Response times\n\n📈 Analyzing team performance...`;
    } else {
        return `📊 **Report Generator**\n\nI can generate these reports for you:\n\n📈 **Sales Reports:**\n• Monthly/Quarterly sales\n• Revenue analysis\n• Performance metrics\n\n👥 **Team Reports:**\n• Employee performance\n• Productivity analysis\n• Task completion rates\n\n📋 **Custom Reports:**\n• Customer satisfaction\n• Project status\n• Financial summaries\n\nWhat type of report would you like me to generate?`;
    }
}

// Handle task assignment requests
function handleTaskAssignment(userMessage) {
    const employees = ['John Smith', 'Sarah Johnson', 'Mike Davis', 'Emily Chen', 'David Wilson', 'Lisa Brown'];
    
    // Extract employee name from message
    let targetEmployee = null;
    for (let employee of employees) {
        const firstName = employee.split(' ')[0].toLowerCase();
        if (userMessage.toLowerCase().includes(firstName)) {
            targetEmployee = employee;
            break;
        }
    }
    
    if (targetEmployee) {
        const taskContent = extractTaskContent(userMessage);
        
        setTimeout(() => {
            addMessageToChat(`✅ **Task Assigned Successfully!**\n\n👤 **Assigned to:** ${targetEmployee}\n📋 **Task:** ${taskContent}\n📅 **Due Date:** ${getNextWeekDate()}\n🎯 **Priority:** Medium\n📱 **Status:** Pending\n\n🔔 **Notifications Sent:**\n• Email notification\n• In-app alert\n• Calendar reminder\n\n${targetEmployee} has been notified and will receive reminders. Would you like to set up additional follow-ups?`, 'assistant');
        }, 2000);
        
        return `✅ **Creating Task Assignment...**\n\n👤 **Assignee:** ${targetEmployee}\n📋 **Task:** ${taskContent}\n📅 **Due Date:** ${getNextWeekDate()}\n🎯 **Priority:** Medium\n\n🔄 Sending notifications...`;
    } else {
        return `✅ **Task Assignment Center**\n\nAvailable team members:\n• John Smith (Manager) - Available\n• Sarah Johnson (Sales Rep) - 3 active tasks\n• Mike Davis (Developer) - 2 active tasks\n• Emily Chen (Designer) - 1 active task\n• David Wilson (Analyst) - 4 active tasks\n• Lisa Brown (Support) - 2 active tasks\n\nTry: \"Assign task to Mike: Review the new feature\" or \"Create task for Sarah about client follow-up\"`;
    }
}

// Handle employee-related requests
function handleEmployeeRequest(userMessage) {
    return `👥 **Employee Management**\n\n**Current Team (6 members):**\n\n🟢 **Online:**\n• John Smith (Manager) - In meeting\n• Sarah Johnson (Sales Rep) - Available\n• Mike Davis (Developer) - Coding\n\n🟡 **Away:**\n• Emily Chen (Designer) - Lunch break\n• David Wilson (Analyst) - Client call\n\n🔴 **Offline:**\n• Lisa Brown (Support) - End of shift\n\n📊 **Quick Actions:**\n• Send message to team\n• Assign new task\n• Check performance\n• Schedule meeting\n\nWhat would you like to do with your team?`;
}

// Helper function to extract message content
function extractMessageContent(userMessage) {
    const aboutIndex = userMessage.toLowerCase().indexOf('about');
    if (aboutIndex !== -1) {
        return userMessage.substring(aboutIndex + 5).trim();
    }
    
    // Try to extract content after employee name
    const employees = ['john', 'sarah', 'mike', 'emily', 'david', 'lisa'];
    for (let employee of employees) {
        const empIndex = userMessage.toLowerCase().indexOf(employee);
        if (empIndex !== -1) {
            const afterEmployee = userMessage.substring(empIndex + employee.length).trim();
            if (afterEmployee.length > 0) {
                return afterEmployee;
            }
        }
    }
    
    return "Please check the latest updates and let me know if you need anything.";
}

// Helper function to extract task content
function extractTaskContent(userMessage) {
    const colonIndex = userMessage.indexOf(':');
    if (colonIndex !== -1) {
        return userMessage.substring(colonIndex + 1).trim();
    }
    
    // Try to extract content after 'task'
    const taskIndex = userMessage.toLowerCase().indexOf('task');
    if (taskIndex !== -1) {
        const afterTask = userMessage.substring(taskIndex + 4).trim();
        if (afterTask.startsWith('to')) {
            const toIndex = afterTask.indexOf('to');
            return afterTask.substring(toIndex + 2).trim() || "Complete the assigned work";
        }
        return afterTask || "Complete the assigned work";
    }
    
    return "Complete the assigned work";
}

// Helper function to get next week's date
function getNextWeekDate() {
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);
    return nextWeek.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function updateNotificationCount(count) {
    const notificationDot = document.getElementById('chatNotificationDot');
    if (count > 0) {
        notificationDot.textContent = count;
        notificationDot.style.display = 'flex';
    } else {
        notificationDot.style.display = 'none';
    }
}

function initializeSpeechRecognition() {
    if ('webkitSpeechRecognition' in window) {
        recognition = new webkitSpeechRecognition();
    } else if ('SpeechRecognition' in window) {
        recognition = new SpeechRecognition();
    }
    
    if (recognition) {
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = 'en-US';
        
        recognition.onstart = function() {
            isListening = true;
            updateVoiceButton();
        };
        
        recognition.onresult = function(event) {
            const transcript = event.results[0][0].transcript;
            document.getElementById('chatInput').value = transcript;
            sendMessage();
        };
        
        recognition.onerror = function(event) {
            console.error('Speech recognition error', event.error);
            isListening = false;
            updateVoiceButton();
            showNotification('Voice recognition error: ' + event.error, 'error');
        };
        
        recognition.onend = function() {
            isListening = false;
            updateVoiceButton();
        };
    }
}

function toggleVoice() {
    if (!recognition) {
        showNotification('Voice recognition not supported in this browser', 'warning');
        return;
    }
    
    if (isListening) {
        recognition.stop();
    } else {
        recognition.start();
    }
}

function updateVoiceButton() {
    const voiceBtn = document.getElementById('chatVoiceBtn');
    if (isListening) {
        voiceBtn.classList.add('listening');
        voiceBtn.textContent = '🔴';
    } else {
        voiceBtn.classList.remove('listening');
        voiceBtn.textContent = '🎤';
    }
}

function showNotification(message, type = 'info') {
    const toast = document.getElementById('notificationToast');
    const toastMessage = document.getElementById('toastMessage');
    
    if (toast && toastMessage) {
        toastMessage.textContent = message;
        toast.className = `notification-toast show ${type}`;
        
        setTimeout(() => {
            toast.classList.remove('show');
        }, 5000);
    }
}

function closeToast() {
    const toast = document.getElementById('notificationToast');
    if (toast) {
        toast.classList.remove('show');
    }
}

// Simulate real-time notifications
setInterval(() => {
    if (!isWidgetOpen) {
        const randomEvents = [
            'New lead assigned',
            'Customer inquiry received',
            'Deal status updated',
            'Task reminder',
            'Meeting scheduled'
        ];
        
        if (Math.random() < 0.1) { // 10% chance every interval
            const event = randomEvents[Math.floor(Math.random() * randomEvents.length)];
            const currentCount = parseInt(document.getElementById('chatNotificationDot').textContent) || 0;
            updateNotificationCount(currentCount + 1);
        }
    }
}, 10000); // Check every 10 seconds

