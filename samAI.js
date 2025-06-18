class SamAI {
    constructor(database, emailService, socketIO) {
        this.db = database;
        this.emailService = emailService;
        this.io = socketIO;
        this.pendingActions = new Map(); // Store pending user confirmations
        this.loadPersonality();
    }

    loadPersonality() {
        this.personality = {
            name: 'Sam AI',
            role: 'CRM Assistant',
            traits: ['helpful', 'efficient', 'professional', 'friendly'],
            capabilities: [
                'Send messages to employees',
                'Manage notifications',
                'Search employee database',
                'Handle CRM operations',
                'Provide information and assistance'
            ]
        };
    }

    async processMessage(userMessage, userId = null) {
        try {
            const lowerMessage = userMessage.toLowerCase();
            
            // Store conversation
            let actionTaken = null;
            let response = '';

            // Check for message sending intent
            if (this.isMessageSendingIntent(lowerMessage)) {
                const result = await this.handleMessageSendingRequest(userMessage, userId);
                response = result.response;
                actionTaken = result.action;
            }
            // Check for employee search intent
            else if (this.isEmployeeSearchIntent(lowerMessage)) {
                const result = await this.handleEmployeeSearch(userMessage);
                response = result.response;
                actionTaken = result.action;
            }
            // Check for general CRM operations
            else if (this.isCRMOperationIntent(lowerMessage)) {
                const result = await this.handleCRMOperations(userMessage);
                response = result.response;
                actionTaken = result.action;
            }
            // Handle general conversation
            else {
                response = await this.handleGeneralConversation(userMessage);
                actionTaken = 'general_conversation';
            }

            // Store conversation in database
            if (userId) {
                await this.db.addConversation({
                    userId,
                    userMessage,
                    samResponse: response,
                    actionTaken
                });
            }

            return {
                response,
                actionTaken,
                timestamp: new Date().toISOString()
            };

        } catch (error) {
            console.error('Error processing message:', error);
            return {
                response: "I apologize, but I encountered an error processing your request. Please try again.",
                actionTaken: 'error',
                timestamp: new Date().toISOString()
            };
        }
    }

    isMessageSendingIntent(message) {
        const sendingKeywords = [
            'send message to',
            'message',
            'tell',
            'notify',
            'inform',
            'contact',
            'reach out to',
            'let know',
            'send to'
        ];
        return sendingKeywords.some(keyword => message.includes(keyword));
    }

    isEmployeeSearchIntent(message) {
        const searchKeywords = [
            'find employee',
            'search for',
            'who is',
            'employee list',
            'show employees',
            'find person',
            'lookup'
        ];
        return searchKeywords.some(keyword => message.includes(keyword));
    }

    isCRMOperationIntent(message) {
        const crmKeywords = [
            'crm',
            'notifications',
            'messages',
            'employee',
            'department',
            'status',
            'report'
        ];
        return crmKeywords.some(keyword => message.includes(keyword));
    }

    async handleMessageSendingRequest(userMessage, userId) {
        try {
            // Extract recipient and message content from user input
            const messageInfo = this.parseMessageRequest(userMessage);
            
            if (!messageInfo.recipient) {
                return {
                    response: "I'd be happy to send a message! Could you please specify who you'd like to send it to? For example: 'Send a message to John Smith about the project update'.",
                    action: 'clarification_needed'
                };
            }

            // Find the recipient in the database
            const recipient = await this.db.getEmployeeByName(messageInfo.recipient);
            
            if (!recipient) {
                // Try to find similar names
                const employees = await this.db.getEmployees();
                const suggestions = employees
                    .filter(emp => emp.name.toLowerCase().includes(messageInfo.recipient.toLowerCase()))
                    .slice(0, 3);
                
                if (suggestions.length > 0) {
                    const suggestionList = suggestions.map(emp => emp.name).join(', ');
                    return {
                        response: `I couldn't find an employee named "${messageInfo.recipient}". Did you mean one of these: ${suggestionList}?`,
                        action: 'employee_not_found_with_suggestions'
                    };
                } else {
                    return {
                        response: `I couldn't find an employee named "${messageInfo.recipient}". Would you like me to show you the list of all employees?`,
                        action: 'employee_not_found'
                    };
                }
            }

            // If message content is not clear, ask for clarification
            if (!messageInfo.content || messageInfo.content.length < 10) {
                return {
                    response: `I found ${recipient.name} (${recipient.position} in ${recipient.department}). What message would you like me to send to them?`,
                    action: 'message_content_needed'
                };
            }

            // Send the message
            const result = await this.sendEmployeeMessage({
                recipientId: recipient.id,
                subject: messageInfo.subject || 'Message from Sam AI',
                content: messageInfo.content,
                priority: messageInfo.priority || 'normal',
                senderId: userId
            });

            return {
                response: `✅ Message sent successfully to ${recipient.name}!\n\n**Details:**\n- Recipient: ${recipient.name} (${recipient.email})\n- Subject: ${result.subject}\n- Priority: ${result.priority}\n- Email notification: Sent\n\nThe recipient will be notified via email and in the CRM system.`,
                action: 'message_sent'
            };

        } catch (error) {
            console.error('Error handling message sending:', error);
            return {
                response: "I encountered an error while trying to send the message. Please try again or contact support.",
                action: 'error'
            };
        }
    }

    parseMessageRequest(userMessage) {
        const message = userMessage.toLowerCase();
        
        // Extract recipient name
        let recipient = null;
        const namePatterns = [
            /(?:send.*?(?:message|msg).*?to|tell|notify|contact|message)\s+([a-zA-Z\s]+?)(?:\s+(?:about|that|to)|$)/i,
            /(?:to|for)\s+([a-zA-Z\s]+?)(?:\s+(?:about|that|:)|$)/i
        ];
        
        for (const pattern of namePatterns) {
            const match = userMessage.match(pattern);
            if (match && match[1]) {
                recipient = match[1].trim();
                break;
            }
        }

        // Extract message content
        let content = null;
        const contentPatterns = [
            /(?:about|that|:)\s+(.+)$/i,
            /(?:tell.*?that|saying)\s+(.+)$/i,
            /message[\s\":]+(.*?)(?:\"|$)/i
        ];
        
        for (const pattern of contentPatterns) {
            const match = userMessage.match(pattern);
            if (match && match[1]) {
                content = match[1].trim().replace(/"/g, '');
                break;
            }
        }

        // Extract priority
        let priority = 'normal';
        if (message.includes('urgent') || message.includes('high priority') || message.includes('important')) {
            priority = 'high';
        } else if (message.includes('low priority') || message.includes('when convenient')) {
            priority = 'low';
        }

        // Generate subject
        let subject = 'Message from Sam AI';
        if (content) {
            const words = content.split(' ').slice(0, 6).join(' ');
            subject = words.length > 30 ? words.substring(0, 30) + '...' : words;
        }

        return { recipient, content, subject, priority };
    }

    async handleEmployeeSearch(userMessage) {
        try {
            const employees = await this.db.getEmployees();
            
            if (userMessage.toLowerCase().includes('list') || userMessage.toLowerCase().includes('show all')) {
                const employeeList = employees.map(emp => 
                    `• **${emp.name}** - ${emp.position} (${emp.department}) - ${emp.email}`
                ).join('\n');
                
                return {
                    response: `Here are all employees in our system:\n\n${employeeList}\n\nWould you like me to send a message to any of them?`,
                    action: 'employee_list_shown'
                };
            }

            // Search for specific employee
            const searchTerm = this.extractSearchTerm(userMessage);
            if (searchTerm) {
                const matches = employees.filter(emp => 
                    emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    emp.department.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    emp.position.toLowerCase().includes(searchTerm.toLowerCase())
                );

                if (matches.length > 0) {
                    const matchList = matches.map(emp => 
                        `• **${emp.name}** - ${emp.position} in ${emp.department}\n  Email: ${emp.email} | Phone: ${emp.phone || 'N/A'}`
                    ).join('\n\n');
                    
                    return {
                        response: `I found ${matches.length} employee(s) matching "${searchTerm}":\n\n${matchList}\n\nWould you like me to send a message to any of them?`,
                        action: 'employee_search_results'
                    };
                } else {
                    return {
                        response: `I couldn't find any employees matching "${searchTerm}". Would you like to see the full employee list?`,
                        action: 'no_search_results'
                    };
                }
            }

            return {
                response: "I can help you search for employees. Try asking 'show all employees' or 'find John Smith'.",
                action: 'search_help'
            };

        } catch (error) {
            console.error('Error handling employee search:', error);
            return {
                response: "I encountered an error while searching for employees. Please try again.",
                action: 'error'
            };
        }
    }

    extractSearchTerm(message) {
        const patterns = [
            /(?:find|search|lookup|who is)\s+(.+)$/i,
            /employee.*?named\s+(.+)$/i,
            /for\s+([a-zA-Z\s]+)$/i
        ];
        
        for (const pattern of patterns) {
            const match = message.match(pattern);
            if (match && match[1]) {
                return match[1].trim();
            }
        }
        return null;
    }

    async handleCRMOperations(userMessage) {
        const lowerMessage = userMessage.toLowerCase();
        
        if (lowerMessage.includes('notification')) {
            return {
                response: "I can help you with notifications! I can:\n\n• Send notifications to employees\n• Check notification status\n• Set up automated alerts\n\nWhat would you like me to help you with?",
                action: 'notification_help'
            };
        }
        
        if (lowerMessage.includes('report') || lowerMessage.includes('status')) {
            const employees = await this.db.getEmployees();
            const messages = await this.db.getMessages();
            
            return {
                response: `**CRM System Status Report:**\n\n👥 **Employees:** ${employees.length} active\n💬 **Messages:** ${messages.length} total\n📧 **Email Service:** Active\n🔔 **Notifications:** Enabled\n\n**Recent Activity:**\n${messages.slice(0, 3).map(msg => `• ${msg.subject} (${new Date(msg.created_at).toLocaleDateString()})`).join('\n')}`,
                action: 'status_report'
            };
        }

        return {
            response: "I can help you with various CRM operations:\n\n• Send messages to employees\n• Search employee database\n• Generate reports\n• Manage notifications\n• Check system status\n\nWhat would you like me to help you with?",
            action: 'crm_help'
        };
    }

    async handleGeneralConversation(userMessage) {
        const lowerMessage = userMessage.toLowerCase();

        // Greetings
        if (lowerMessage.includes('hello') || lowerMessage.includes('hi') || lowerMessage.includes('hey')) {
            return this.getRandomResponse([
                "Hello! I'm Sam, your CRM AI assistant. I can help you send messages to employees, search the database, and manage notifications. What can I do for you?",
                "Hi there! I'm here to help you with CRM tasks. Need to send a message to someone or search for employee information?",
                "Hey! Ready to assist you with your CRM needs. Just tell me what you'd like to do!"
            ]);
        }

        // Capabilities
        if (lowerMessage.includes('what can you do') || lowerMessage.includes('help') || lowerMessage.includes('capabilities')) {
            return `I'm Sam, your CRM AI assistant! Here's what I can help you with:\n\n💬 **Messaging:**\n• Send messages to employees\n• Handle email notifications\n• Set message priorities\n\n🔍 **Employee Management:**\n• Search employee database\n• Find contact information\n• Show department lists\n\n📧 **Notifications:**\n• Send instant notifications\n• Email alerts\n• Real-time updates\n\n📊 **Reports & Status:**\n• System status reports\n• Activity summaries\n• Employee statistics\n\n**Try saying:**\n• "Send a message to John about the meeting"\n• "Show me all employees"\n• "Find someone in marketing"\n• "Give me a status report"`;
        }

        // Thanks
        if (lowerMessage.includes('thank') || lowerMessage.includes('thanks')) {
            return this.getRandomResponse([
                "You're very welcome! I'm always here to help with your CRM needs.",
                "My pleasure! Feel free to ask me anything about employees or messaging.",
                "Happy to help! Is there anything else you need assistance with?"
            ]);
        }

        // Default responses
        return this.getRandomResponse([
            "I'm here to help with your CRM tasks! You can ask me to send messages, find employees, or get system reports. What would you like to do?",
            "As your CRM assistant, I can help you communicate with employees and manage information. How can I assist you today?",
            "I specialize in helping with employee communication and CRM operations. What can I help you accomplish?"
        ]);
    }

    async sendEmployeeMessage(messageData) {
        try {
            // Add message to database
            const message = await this.db.addMessage({
                senderId: messageData.senderId,
                recipientId: messageData.recipientId,
                subject: messageData.subject,
                content: messageData.content,
                priority: messageData.priority,
                messageType: 'sam_ai_generated'
            });

            // Get recipient details
            const recipient = await this.db.getEmployeeById(messageData.recipientId);
            const sender = messageData.senderId ? await this.db.getEmployeeById(messageData.senderId) : null;

            // Send email notification
            if (recipient && recipient.email) {
                await this.emailService.sendEmployeeMessage(
                    sender,
                    recipient,
                    messageData.subject,
                    messageData.content,
                    messageData.priority
                );
            }

            // Send real-time notification via WebSocket
            this.io.emit('newMessage', {
                message,
                recipient,
                sender,
                type: 'sam_ai_message'
            });

            return {
                success: true,
                messageId: message.id,
                subject: messageData.subject,
                priority: messageData.priority,
                recipient: recipient.name
            };

        } catch (error) {
            console.error('Error sending employee message:', error);
            throw error;
        }
    }

    getRandomResponse(responses) {
        return responses[Math.floor(Math.random() * responses.length)];
    }
}

module.exports = SamAI;

