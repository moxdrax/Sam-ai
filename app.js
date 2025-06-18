document.addEventListener('DOMContentLoaded', init);

let socket = null;
let messageQueue = [];
let isListening = false;

const samAI = {
    name: 'Sam',
    language: 'en-US',
    recognition: null,
    synthesis: window.speechSynthesis
};

function init() {
    console.log('Initializing Sam AI CRM System');
    setupEventListeners();
    // Skip socket initialization for now
    // initializeSocket();
    initializeSpeechRecognition();
    // Skip dashboard data update for now
    // updateDashboardData();
    loadMockData();
    setTimeout(hideLoadingScreen, 1000);
}

function setupEventListeners() {
    document.getElementById('sendBtn').addEventListener('click', sendMessage);
    document.getElementById('voiceBtn').addEventListener('click', toggleVoiceRecognition);
    document.getElementById('refreshBtn').addEventListener('click', updateDashboardData);
    document.getElementById('employeeListBtn').addEventListener('click', showEmployeeView);
    document.getElementById('messagesBtn').addEventListener('click', showMessagesView);
}

function initializeSocket() {
    socket = io();

    socket.on('connect', () => {
        console.log('Connected to server as', socket.id);
    });

    socket.on('newMessage', (data) => {
        console.log('New message received', data);
        addMessageToList(data.message);
        showNotification(`New message for ${data.recipient.name}: ${data.message.subject}`);
    });

    socket.on('samResponse', (response) => {
        console.log('Sam response received', response);
        addSamResponseToChat(response);
    });

    socket.on('samError', (error) => {
        console.error('Sam AI encountered an error', error);
        showNotification(error.error, 'error');
    });

    // Join a user room
    socket.emit('joinRoom', 'user_global'); // Replace with actual user ID
}

function initializeSpeechRecognition() {
    if ('webkitSpeechRecognition' in window) {
        samAI.recognition = new webkitSpeechRecognition();
    } else if ('SpeechRecognition' in window) {
        samAI.recognition = new SpeechRecognition();
    }

    if (samAI.recognition) {
        samAI.recognition.continuous = false;
        samAI.recognition.interimResults = false;
        samAI.recognition.lang = samAI.language;

        samAI.recognition.onstart = () => {
            console.log('Voice recognition started');
            isListening = true;
            updateVoiceButton();
        };
        
        samAI.recognition.onresult = (event) => {
            const transcript = event.results[0][0].transcript;
            document.getElementById('messageInput').value = transcript;
            console.log(`Voice recognized: ${transcript}`);
            sendMessage();
        };
        
        samAI.recognition.onerror = (event) => {
            console.error('Voice recognition error', event.error);
            isListening = false;
            updateVoiceButton();
        };
        
        samAI.recognition.onend = () => {
            console.log('Voice recognition ended');
            isListening = false;
            updateVoiceButton();
        };
    } else {
        console.error('Voice recognition not supported on this browser');
    }
}

function hideLoadingScreen() {
    document.getElementById('loadingScreen').style.display = 'none';
    document.getElementById('mainApp').style.display = 'block';
}

function addMessageToQueue(message) {
    messageQueue.push(message);
    processMessageQueue();
}

function processMessageQueue() {
    if (messageQueue.length > 0) {
        const message = messageQueue.shift();
        addMessageToChat(message.content, 'user');
        
        // For demo purposes, simulate Sam's response without server
        setTimeout(() => {
            const response = generateMockResponse(message.content);
            addMessageToChat(response, 'assistant');
        }, 1000);
    }
}

// Generate mock responses for demo
function generateMockResponse(userMessage) {
    const lowerMessage = userMessage.toLowerCase();
    
    if (lowerMessage.includes('employee') || lowerMessage.includes('show')) {
        return "I can see you're looking for employee information. I would normally fetch this from the database, but I'm in demo mode right now. In the full version, I can search employees, show their details, and help you manage the team!";
    } else if (lowerMessage.includes('message') || lowerMessage.includes('send')) {
        return "I'd be happy to help you send a message! In the full version, I can compose and send messages to any employee, schedule them for later, and track delivery status. Right now I'm in demo mode without server connection.";
    } else if (lowerMessage.includes('hello') || lowerMessage.includes('hi')) {
        return "Hello! I'm Sam, your AI CRM assistant. I can help you manage employees, send messages, and analyze your CRM data. What would you like to do today?";
    } else {
        return "I understand you're asking about: '" + userMessage + "'. In the full version with server connection, I can help with employee management, messaging, analytics, and much more!";
    }
}

function addMessageToChat(content, sender) {
    const chatContainer = document.getElementById('chatContainer');
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${sender}`;
    messageDiv.innerHTML = `
        <div class="avatar"><span class="avatar-icon">${sender === 'user' ? '👤' : '🤖'}</span></div>
        <div class="message-content"><div class="message-text">${content}</div><div class="message-actions"><button class="btn-action" onclick="speakMessage(this)">🔊</button></div></div>
    `;
    chatContainer.appendChild(messageDiv);
    chatContainer.scrollTop = chatContainer.scrollHeight;
}

function addSamResponseToChat(response) {
    addMessageToChat(response.response, 'sam');
    if (samAI.synthesis) {
        speak(response.response);
    }
}

function updateVoiceButton() {
    const voiceBtn = document.getElementById('voiceBtn');
    if (isListening) {
        voiceBtn.classList.add('listening');
        voiceBtn.textContent = '🎙️ Listening...';
    } else {
        voiceBtn.classList.remove('listening');
        voiceBtn.textContent = '🎤';
    }
}

function toggleVoiceRecognition() {
    if (isListening) {
        stopVoiceRecognition();
    } else {
        startVoiceRecognition();
    }
}

function startVoiceRecognition() {
    if (samAI.recognition) {
        samAI.recognition.start();
    } else {
        console.error('Speech recognition not supported');
        showNotification('Voice recognition not supported in this browser', 'warning');
    }
}

function stopVoiceRecognition() {
    if (samAI.recognition) {
        samAI.recognition.stop();
    }
}

function sendMessage() {
    const messageInput = document.getElementById('messageInput');
    const messageText = messageInput.value.trim();
    if (messageText) {
        addMessageToQueue({ content: messageText });
        messageInput.value = '';
    }
}

function sendSuggestion(suggestion) {
    document.getElementById('messageInput').value = suggestion;
    sendMessage();
}

function speak(text) {
    if (samAI.synthesis) {
        samAI.synthesis.cancel(); // Cancel any existing speech

        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = samAI.language;
        utterance.pitch = 1;
        utterance.rate = 1;

        utterance.onstart = () => {
            console.log('Speech synthesis started');
        };

        utterance.onend = () => {
            console.log('Speech synthesis ended');
        };

        samAI.synthesis.speak(utterance);
    }
}

function speakMessage(button) {
    const messageContent = button.parentElement.parentElement.querySelector('.message-text').textContent;
    speak(messageContent);
}

function updateDashboardData() {
    fetch('/api/dashboard')
        .then(response => response.json())
        .then(data => updateDashboardView(data))
        .catch(error => console.error('Error fetching dashboard data', error));
}

function updateDashboardView(data) {
    document.getElementById('employeeCount').textContent = data.employees || '-';
    document.getElementById('messageCount').textContent = data.messages || '-';
    document.getElementById('activeNotifications').textContent = data.notifications || '-';
    updateRecentMessages(data.recentMessages);
}

function updateRecentMessages(messages) {
    const recentMessagesContainer = document.getElementById('recentMessages');
    recentMessagesContainer.innerHTML = '';

    if (messages && messages.length > 0) {
        messages.forEach(msg => {
            const messageItem = document.createElement('div');
            messageItem.className = 'activity-item';
            messageItem.innerHTML = `
                <div class="activity-subject">${msg.subject}</div>
                <div class="activity-details">From: ${msg.sender_name || 'System'}, Date: ${new Date(msg.created_at).toLocaleDateString()}</div>
            `;
            recentMessagesContainer.appendChild(messageItem);
        });
    } else {
        recentMessagesContainer.innerHTML = '<div class="empty-message">No recent messages</div>';
    }
}

function showNotification(message, type = 'info') {
    const notificationToast = document.getElementById('notificationToast');
    const toastMessage = document.getElementById('toastMessage');

    toastMessage.textContent = message;
    notificationToast.className = `notification-toast ${type}`;
    notificationToast.style.display = 'block';

    setTimeout(closeToast, 5000);
}

function closeToast() {
    const notificationToast = document.getElementById('notificationToast');
    notificationToast.style.display = 'none';
}

function showEmployeeView() {
    setActiveView('employeeView');
    document.getElementById('crmPanelTitle').textContent = '👥 Employee List';
    fetchEmployees();
}

function showMessagesView() {
    setActiveView('messagesView');
    document.getElementById('crmPanelTitle').textContent = '💬 Messages';
    fetchMessages();
}

function setActiveView(viewId) {
    document.querySelectorAll('.content-view').forEach(view => {
        view.classList.remove('active');
    });
    document.getElementById(viewId).classList.add('active');
}

function fetchEmployees() {
    fetch('/api/employees')
        .then(response => response.json())
        .then(employees => updateEmployeeList(employees))
        .catch(error => console.error('Error fetching employees', error));
}

function updateEmployeeList(employees) {
    const employeeList = document.getElementById('employeeList');
    employeeList.innerHTML = '';

    if (employees && employees.length > 0) {
        employees.forEach(emp => {
            const employeeItem = document.createElement('div');
            employeeItem.className = 'employee-item';
            employeeItem.innerHTML = `
                <div class="employee-name">${emp.name}</div>
                <div class="employee-details">${emp.position}, ${emp.department}, Email: ${emp.email}</div>
            `;
            employeeList.appendChild(employeeItem);
        });
    } else {
        employeeList.innerHTML = '<div class="empty-message">No employees found</div>';
    }
}

function fetchMessages() {
    fetch('/api/messages')
        .then(response => response.json())
        .then(messages => updateMessagesList(messages))
        .catch(error => console.error('Error fetching messages', error));
}

function updateMessagesList(messages) {
    const messagesList = document.getElementById('messagesList');
    messagesList.innerHTML = '';

    if (messages && messages.length > 0) {
        messages.forEach(msg => {
            const messageItem = document.createElement('div');
            messageItem.className = 'message-item';
            messageItem.innerHTML = `
                <div class="message-subject">${msg.subject}</div>
                <div class="message-details">To: ${msg.recipient_name || 'N/A'}, Priority: ${msg.priority || 'Normal'}, Date: ${new Date(msg.created_at).toLocaleDateString()}</div>
            `;
            messagesList.appendChild(messageItem);
        });
    } else {
        messagesList.innerHTML = '<div class="empty-message">No messages found</div>';
    }
}

function searchEmployees() {
    const searchQuery = document.getElementById('employeeSearch').value.trim().toLowerCase();
    const employeeItems = document.querySelectorAll('.employee-item');

    employeeItems.forEach(item => {
        const employeeName = item.querySelector('.employee-name').textContent.toLowerCase();
        if (employeeName.includes(searchQuery)) {
            item.style.display = 'block';
        } else {
            item.style.display = 'none';
        }
    });
}

// Load mock data for demonstration
function loadMockData() {
    // Update dashboard with mock data
    const mockDashboardData = {
        employees: 25,
        messages: 143,
        notifications: 7,
        recentMessages: [
            {
                subject: "Team Meeting Tomorrow",
                sender_name: "John Smith",
                created_at: new Date().toISOString()
            },
            {
                subject: "Project Status Update",
                sender_name: "Sarah Johnson", 
                created_at: new Date(Date.now() - 86400000).toISOString()
            },
            {
                subject: "Client Presentation",
                sender_name: "Mike Davis",
                created_at: new Date(Date.now() - 172800000).toISOString()
            }
        ]
    };
    
    updateDashboardView(mockDashboardData);
    
    // Add mock chat message from Sam
    setTimeout(() => {
        addMessageToChat("Hello! I'm ready to help you with your CRM tasks. Try asking me to show employees or send a message!", 'assistant');
    }, 1500);
}




