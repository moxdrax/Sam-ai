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
    chatButton.addEventListener('click', handleButtonClick);
    closeBtn.addEventListener('click', closeChatWidget);
    sendBtn.addEventListener('click', sendMessage);
    voiceBtn.addEventListener('click', toggleVoice);
    chatInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            sendMessage();
        }
    });
    
    // Long press event listeners for Sam button
    chatButton.addEventListener('mousedown', startLongPressTimer);
    chatButton.addEventListener('mouseup', stopLongPressTimer);
    chatButton.addEventListener('mouseleave', stopLongPressTimer);
    chatButton.addEventListener('touchstart', startLongPressTouchTimer, { passive: false });
    chatButton.addEventListener('touchend', stopLongPressTimer);
    chatButton.addEventListener('touchcancel', stopLongPressTimer);
    
    // Initialize drag functionality
    initializeDragFunctionality();
    
    // Initialize speech recognition
    initializeSpeechRecognition();
    
    // Simulate some initial notifications
    setTimeout(() => {
        updateNotificationCount(3);
    }, 2000);
}

// Drag functionality variables
let isDragging = false;
let isClick = true;
let dragStartTime = 0;
let dragStartX = 0;
let dragStartY = 0;
let dragThreshold = 5; // pixels
let clickTimeout = null;

// Long press functionality variables
let longPressTimer = null;
let longPressThreshold = 500; // milliseconds for long press
let isLongPress = false;
let longPressStarted = false;

function handleButtonClick(e) {
    // If we were dragging, don't open chat
    if (!isClick) {
        isClick = true;
        return;
    }
    
    // If it was a long press that started voice recognition, don't toggle chat
    if (isLongPress) {
        isLongPress = false;
        return;
    }
    
    // Normal click behavior - toggle chat
    toggleChatWidget();
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
        recognition.interimResults = true; // Enable interim results for real-time feedback
        recognition.lang = 'en-US';
        recognition.maxAlternatives = 1;
        
        recognition.onstart = function() {
            isListening = true;
            updateVoiceButton();
            
            if (longPressStarted) {
                // Long press mode - only show popup notification
                console.log('Long press voice recognition started');
            } else {
                // Regular voice button mode - show notification
                showNotification('🎤 Listening... Speak now!', 'info');
                
                // Add visual feedback to input
                const chatInput = document.getElementById('chatInput');
                chatInput.placeholder = '🎤 Listening... Speak now!';
                chatInput.style.background = 'linear-gradient(45deg, #f0f8ff, #e6f3ff)';
                chatInput.style.borderColor = '#667eea';
            }
        };
        
        recognition.onresult = function(event) {
            const chatInput = document.getElementById('chatInput');
            let finalTranscript = '';
            let interimTranscript = '';
            
            // Process all results
            for (let i = event.resultIndex; i < event.results.length; i++) {
                const transcript = event.results[i][0].transcript;
                
                if (event.results[i].isFinal) {
                    finalTranscript += transcript;
                } else {
                    interimTranscript += transcript;
                }
            }
            
            // Update transcription popup if in long press mode
            if (longPressStarted) {
                if (interimTranscript) {
                    updateTranscriptionText(interimTranscript, false);
                }
                if (finalTranscript) {
                    updateTranscriptionText(finalTranscript.trim(), true);
                }
            } else {
                // Show interim results in regular input
                if (interimTranscript) {
                    chatInput.value = interimTranscript;
                    chatInput.style.fontStyle = 'italic';
                    chatInput.style.color = '#666';
                }
            }
            
            // Process final result
            if (finalTranscript) {
                if (!longPressStarted) {
                    chatInput.value = finalTranscript.trim();
                    chatInput.style.fontStyle = 'normal';
                    chatInput.style.color = '#333';
                    showNotification('✅ Speech recognized: "' + finalTranscript.trim() + '"', 'success');
                }
                
                // If triggered by long press, auto-send immediately
                if (longPressStarted) {
                    // Open chat widget if not already open
                    if (!isWidgetOpen) {
                        openChatWidget();
                    }
                    
                    // Set the message in the input
                    chatInput.value = finalTranscript.trim();
                    
                    // Auto-send the message after a brief delay
                    setTimeout(() => {
                        if (chatInput.value.trim()) {
                            sendMessage();
                            hideVoiceTranscriptionPopup();
                            hideInlineVoiceIndicator();
                            longPressStarted = false;
                        }
                    }, 500);
                } else {
                    // Regular voice input - auto-send after delay to allow user to see
                    setTimeout(() => {
                        if (chatInput.value.trim()) {
                            sendMessage();
                        }
                    }, 1000);
                }
            }
        };
        
        recognition.onerror = function(event) {
            console.error('Speech recognition error', event.error);
            isListening = false;
            updateVoiceButton();
            resetInputStyling();
            
            let errorMessage = 'Voice recognition error';
            switch(event.error) {
                case 'no-speech':
                    errorMessage = '🔇 No speech detected. Please try again.';
                    break;
                case 'audio-capture':
                    errorMessage = '🎤 Microphone not found. Please check your microphone.';
                    break;
                case 'not-allowed':
                    errorMessage = '🚫 Microphone access denied. Please allow microphone access.';
                    break;
                case 'network':
                    errorMessage = '🌐 Network error. Please check your connection.';
                    break;
                default:
                    errorMessage = '❌ Speech recognition error: ' + event.error;
            }
            
            showNotification(errorMessage, 'error');
        };
        
        recognition.onend = function() {
            isListening = false;
            updateVoiceButton();
            updateSamButtonAfterVoice();
            resetInputStyling();
            
            // If long press session ended, reset the flag
            if (longPressStarted) {
                longPressStarted = false;
                showNotification('🎤 Long press voice input completed', 'success');
            } else if (!document.getElementById('chatInput').value.trim()) {
                showNotification('🎤 Speech recognition stopped. Click the mic to try again.', 'info');
            }
        };
    } else {
        console.warn('Speech recognition not supported');
    }
}

function toggleVoice() {
    if (!recognition) {
        showNotification('🚫 Voice recognition not supported in this browser. Please use Chrome, Edge, or Safari.', 'warning');
        return;
    }
    
    if (isListening) {
        recognition.stop();
        showNotification('🛑 Speech recognition stopped', 'info');
    } else {
        // Check for microphone permission
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
            navigator.mediaDevices.getUserMedia({ audio: true })
                .then(function(stream) {
                    // Permission granted, stop the stream and start recognition
                    stream.getTracks().forEach(track => track.stop());
                    recognition.start();
                })
                .catch(function(err) {
                    console.error('Microphone permission error:', err);
                    showNotification('🎤 Please allow microphone access to use voice input', 'warning');
                });
        } else {
            // Fallback for browsers without getUserMedia
            try {
                recognition.start();
            } catch (error) {
                showNotification('🚫 Could not start speech recognition: ' + error.message, 'error');
            }
        }
    }
}

function updateVoiceButton() {
    const voiceBtn = document.getElementById('chatVoiceBtn');
    if (isListening) {
        voiceBtn.classList.add('listening');
        voiceBtn.textContent = '🔴';
        voiceBtn.title = 'Stop listening (Click to stop)';
        
        // Add pulsing animation to show it's actively listening
        voiceBtn.style.animation = 'pulse-recording 1s infinite';
    } else {
        voiceBtn.classList.remove('listening');
        voiceBtn.textContent = '🎤';
        voiceBtn.title = 'Start voice input (Click to speak)';
        voiceBtn.style.animation = '';
    }
}

// Helper function to reset input styling after speech recognition
function resetInputStyling() {
    const chatInput = document.getElementById('chatInput');
    chatInput.placeholder = 'Ask Sam anything about your CRM...';
    chatInput.style.background = '#f8fafc';
    chatInput.style.borderColor = '#e2e8f0';
    chatInput.style.fontStyle = 'normal';
    chatInput.style.color = '#333';
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

// Long press functionality for Sam button
function startLongPressTimer(e) {
    // Don't start long press if we're about to drag
    if (e.type === 'mousedown') {
        dragStartX = e.clientX;
        dragStartY = e.clientY;
    }
    
    // Clear any existing timer
    if (longPressTimer) {
        clearTimeout(longPressTimer);
    }
    
    isLongPress = false;
    
    // Start the long press timer
    longPressTimer = setTimeout(() => {
        // Check if we haven't moved (not dragging)
        if (!isDragging) {
            startLongPressVoiceInput();
        }
    }, longPressThreshold);
}

function startLongPressTouchTimer(e) {
    if (e.touches.length === 1) {
        const touch = e.touches[0];
        dragStartX = touch.clientX;
        dragStartY = touch.clientY;
        
        // Clear any existing timer
        if (longPressTimer) {
            clearTimeout(longPressTimer);
        }
        
        isLongPress = false;
        
        // Start the long press timer
        longPressTimer = setTimeout(() => {
            // Check if we haven't moved (not dragging)
            if (!isDragging) {
                startLongPressVoiceInput();
            }
        }, longPressThreshold);
    }
}

function stopLongPressTimer() {
    if (longPressTimer) {
        clearTimeout(longPressTimer);
        longPressTimer = null;
    }
    
    // If long press voice input is active and button is released, stop it
    if (longPressStarted && isListening) {
        recognition.stop();
        longPressStarted = false;
        hideVoiceTranscriptionPopup();
        hideInlineVoiceIndicator();
        resetSamButtonAfterVoice();
    }
}

function startLongPressVoiceInput() {
    if (!recognition) {
        showNotification('🚫 Voice recognition not supported in this browser. Please use Chrome, Edge, or Safari.', 'warning');
        return;
    }
    
    isLongPress = true;
    longPressStarted = true;
    
    // Show the inline voice indicator instead of popup
    showInlineVoiceIndicator();
    
    // Provide haptic feedback if available
    if (navigator.vibrate) {
        navigator.vibrate(50);
    }
    
    // Visual feedback on Sam button
    const samButton = document.getElementById('samChatButton');
    samButton.classList.add('recording');
    samButton.style.transform = 'scale(1.1)';
    samButton.style.boxShadow = '0 0 0 8px rgba(229, 62, 62, 0.3)';
    samButton.style.background = 'linear-gradient(135deg, #e53e3e 0%, #c53030 100%)';
    
    // Start voice recognition
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        navigator.mediaDevices.getUserMedia({ audio: true })
            .then(function(stream) {
                stream.getTracks().forEach(track => track.stop());
                recognition.start();
            })
            .catch(function(err) {
                console.error('Microphone permission error:', err);
                showNotification('🎤 Please allow microphone access to use voice input', 'warning');
                hideInlineVoiceIndicator();
                resetSamButtonAfterVoice();
            });
    } else {
        try {
            recognition.start();
        } catch (error) {
            showNotification('🚫 Could not start speech recognition: ' + error.message, 'error');
            hideInlineVoiceIndicator();
            resetSamButtonAfterVoice();
        }
    }
}

function updateSamButtonAfterVoice() {
    const samButton = document.getElementById('samChatButton');
    if (isListening) {
        // Show that Sam button is actively listening
        samButton.style.background = 'linear-gradient(135deg, #e53e3e 0%, #c53030 100%)';
        samButton.style.boxShadow = '0 0 0 8px rgba(229, 62, 62, 0.3)';
        samButton.style.transform = 'scale(1.1)';
        samButton.style.animation = 'pulse-recording 1s infinite';
    } else {
        resetSamButtonAfterVoice();
    }
}

function resetSamButtonAfterVoice() {
    const samButton = document.getElementById('samChatButton');
    samButton.classList.remove('recording');
    samButton.style.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
    samButton.style.boxShadow = '0 8px 25px rgba(102, 126, 234, 0.4)';
    samButton.style.transform = '';
    samButton.style.animation = '';
}

// Smooth floating movement
function startFloating(button, widget) {
    button.classList.add('floating');
    
    const container = {
        width: window.innerWidth,
        height: window.innerHeight
    };
    
    // Generate random waypoints for smooth floating
    const waypoints = [];
    const numWaypoints = 5;
    
    for (let i = 0; i < numWaypoints; i++) {
        waypoints.push({
            x: Math.random() * (container.width - 80),
            y: Math.random() * (container.height - 80)
        });
    }
    
    let currentWaypoint = 0;
    let startTime = Date.now();
    const animationDuration = 2000; // 2 seconds total
    const waypointDuration = animationDuration / numWaypoints;
    
    function animate() {
        const elapsed = Date.now() - startTime;
        const progress = elapsed / animationDuration;
        
        if (progress >= 1) {
            // Animation complete, return to original position
            stopFloating(button, widget);
            return;
        }
        
        // Calculate current waypoint progress
        const waypointProgress = (elapsed % waypointDuration) / waypointDuration;
        const currentIndex = Math.floor(elapsed / waypointDuration);
        const nextIndex = (currentIndex + 1) % waypoints.length;
        
        if (currentIndex < waypoints.length && nextIndex < waypoints.length) {
            const current = waypoints[currentIndex];
            const next = waypoints[nextIndex];
            
            // Smooth interpolation between waypoints using easing
            const easeProgress = easeInOutCubic(waypointProgress);
            const x = current.x + (next.x - current.x) * easeProgress;
            const y = current.y + (next.y - current.y) * easeProgress;
            
            // Update widget position
            widget.style.left = x + 'px';
            widget.style.top = y + 'px';
            widget.style.right = 'auto';
            widget.style.bottom = 'auto';
        }
        
        requestAnimationFrame(animate);
    }
    
    animate();
}

function stopFloating(button, widget) {
    button.classList.remove('floating');
    
    // Animate back to original position with smooth transition
    widget.style.transition = 'all 1s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
    widget.style.left = 'auto';
    widget.style.top = 'auto';
    widget.style.right = '20px';
    widget.style.bottom = '20px';
    
    // Reset transition after animation
    setTimeout(() => {
        widget.style.transition = 'all 0.1s ease-out';
    }, 1000);
}

// Smooth easing function for natural movement
function easeInOutCubic(t) {
    return t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1;
}


// Initialize drag functionality for Sam button
function initializeDragFunctionality() {
    const chatWidget = document.getElementById('samChatWidget');
    const chatButton = document.getElementById('samChatButton');
    
    let startX, startY, startLeft, startTop;
    
    // Mouse events
    chatButton.addEventListener('mousedown', startDrag);
    document.addEventListener('mousemove', drag);
    document.addEventListener('mouseup', stopDrag);
    
    // Touch events for mobile
    chatButton.addEventListener('touchstart', startDragTouch, { passive: false });
    document.addEventListener('touchmove', dragTouch, { passive: false });
    document.addEventListener('touchend', stopDragTouch);
    
    function startDrag(e) {
        e.preventDefault();
        isDragging = false;
        isClick = true;
        dragStartTime = Date.now();
        
        const rect = chatWidget.getBoundingClientRect();
        startX = e.clientX;
        startY = e.clientY;
        startLeft = rect.left;
        startTop = rect.top;
        
        dragStartX = e.clientX;
        dragStartY = e.clientY;
        
        chatButton.classList.add('dragging');
        document.body.style.userSelect = 'none';
    }
    
    function drag(e) {
        if (startX === undefined) return;
        
        const deltaX = Math.abs(e.clientX - dragStartX);
        const deltaY = Math.abs(e.clientY - dragStartY);
        
        // If moved more than threshold, consider it a drag
        if (!isDragging && (deltaX > dragThreshold || deltaY > dragThreshold)) {
            isDragging = true;
            isClick = false;
            chatButton.classList.add('floating');
        }
        
        if (isDragging) {
            e.preventDefault();
            
            const newX = startLeft + (e.clientX - startX);
            const newY = startTop + (e.clientY - startY);
            
            // Constrain to screen bounds
            const maxX = window.innerWidth - 80;
            const maxY = window.innerHeight - 80;
            const constrainedX = Math.max(0, Math.min(maxX, newX));
            const constrainedY = Math.max(0, Math.min(maxY, newY));
            
            chatWidget.style.left = constrainedX + 'px';
            chatWidget.style.top = constrainedY + 'px';
            chatWidget.style.right = 'auto';
            chatWidget.style.bottom = 'auto';
            
            // Add floating effect
            chatWidget.style.transform = 'scale(1.05) rotate(' + (Math.sin(Date.now() * 0.005) * 2) + 'deg)';
        }
    }
    
    function stopDrag(e) {
        if (startX === undefined) return;
        
        startX = undefined;
        startY = undefined;
        
        chatButton.classList.remove('dragging');
        document.body.style.userSelect = '';
        
        if (isDragging) {
            // Add gentle floating animation after drop
            setTimeout(() => {
                chatButton.classList.remove('floating');
                chatWidget.style.transform = '';
                chatWidget.style.transition = 'transform 0.3s ease';
                
                setTimeout(() => {
                    chatWidget.style.transition = 'all 0.1s ease-out';
                }, 300);
            }, 100);
            
            isDragging = false;
            
            // Reset click state after a brief delay
            setTimeout(() => {
                isClick = true;
            }, 100);
        }
    }
    
    // Touch event handlers
    function startDragTouch(e) {
        if (e.touches.length === 1) {
            const touch = e.touches[0];
            startDrag({
                preventDefault: () => e.preventDefault(),
                clientX: touch.clientX,
                clientY: touch.clientY
            });
        }
    }
    
    function dragTouch(e) {
        if (e.touches.length === 1 && startX !== undefined) {
            const touch = e.touches[0];
            drag({
                preventDefault: () => e.preventDefault(),
                clientX: touch.clientX,
                clientY: touch.clientY
            });
        }
    }
    
    function stopDragTouch(e) {
        stopDrag({
            preventDefault: () => {},
            clientX: 0,
            clientY: 0
        });
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

// Voice Transcription Popup Functions
function showVoiceTranscriptionPopup() {
    const popup = document.getElementById('voiceTranscriptionPopup');
    const transcriptionText = document.getElementById('transcriptionText');
    
    if (popup) {
        transcriptionText.textContent = 'Say something...';
        transcriptionText.classList.remove('active');
        popup.style.display = 'block';
        popup.classList.remove('closing');
        
        // Animate in
        setTimeout(() => {
            popup.style.opacity = '1';
            popup.style.transform = 'translate(-50%, -50%) scale(1)';
        }, 10);
    }
}

function hideVoiceTranscriptionPopup() {
    const popup = document.getElementById('voiceTranscriptionPopup');
    
    if (popup) {
        popup.classList.add('closing');
        
        setTimeout(() => {
            popup.style.display = 'none';
            popup.classList.remove('closing');
        }, 300);
    }
}

function updateTranscriptionText(text, isFinal = false) {
    const transcriptionText = document.getElementById('transcriptionText');
    const inlineTranscriptionText = document.getElementById('inlineTranscriptionText');
    
    if (transcriptionText) {
        transcriptionText.textContent = text || 'Say something...';
        
        if (isFinal) {
            transcriptionText.classList.add('active');
        } else if (text) {
            transcriptionText.classList.remove('active');
        }
    }
    
    // Also update inline indicator if active
    if (inlineTranscriptionText) {
        inlineTranscriptionText.textContent = text || 'Say something...';
        const transcriptionBox = inlineTranscriptionText.parentElement;
        
        if (isFinal) {
            inlineTranscriptionText.classList.add('active');
            transcriptionBox.classList.add('active');
        } else if (text) {
            inlineTranscriptionText.classList.remove('active');
            transcriptionBox.classList.remove('active');
        }
    }
}

// Inline Voice Indicator Functions
function showInlineVoiceIndicator() {
    const indicator = document.getElementById('inlineVoiceIndicator');
    const transcriptionText = document.getElementById('inlineTranscriptionText');
    
    if (indicator) {
        transcriptionText.textContent = 'Say something...';
        transcriptionText.classList.remove('active');
        const transcriptionBox = transcriptionText.parentElement;
        transcriptionBox.classList.remove('active');
        
        indicator.style.display = 'block';
        indicator.classList.remove('closing');
        
        // Animate in
        setTimeout(() => {
            indicator.style.opacity = '1';
            indicator.style.transform = 'translateY(0) scale(1)';
        }, 10);
    }
}

function hideInlineVoiceIndicator() {
    const indicator = document.getElementById('inlineVoiceIndicator');
    
    if (indicator) {
        indicator.classList.add('closing');
        
        setTimeout(() => {
            indicator.style.display = 'none';
            indicator.classList.remove('closing');
        }, 300);
    }
}

