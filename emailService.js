const nodemailer = require('nodemailer');

class EmailService {
    constructor() {
        this.transporter = null;
        this.setupTransporter();
    }

    setupTransporter() {
        // For development, we'll use a test account from Ethereal Email
        // In production, you would use your actual email service (Gmail, SendGrid, etc.)
        
        // Option 1: Gmail (requires app password)
        // this.transporter = nodemailer.createTransport({
        //     service: 'gmail',
        //     auth: {
        //         user: 'your-email@gmail.com',
        //         pass: 'your-app-password'
        //     }
        // });

        // Option 2: Development - Ethereal Email (for testing)
        nodemailer.createTestAccount((err, account) => {
            if (err) {
                console.error('Failed to create test account:', err);
                return;
            }

            this.transporter = nodemailer.createTransport({
                host: 'smtp.ethereal.email',
                port: 587,
                secure: false, // true for 465, false for other ports
                auth: {
                    user: account.user,
                    pass: account.pass
                }
            });

            console.log('📧 Email service configured with test account');
            console.log('🔗 Test email preview: https://ethereal.email');
        });

        // Option 3: SMTP (for custom email servers)
        // this.transporter = nodemailer.createTransport({
        //     host: 'your-smtp-server.com',
        //     port: 587,
        //     secure: false,
        //     auth: {
        //         user: 'your-username',
        //         pass: 'your-password'
        //     }
        // });
    }

    async sendNotification(recipientEmail, subject, content, options = {}) {
        if (!this.transporter) {
            console.log('Email service not ready, simulating email send...');
            console.log(`📧 [SIMULATED] To: ${recipientEmail}`);
            console.log(`📧 [SIMULATED] Subject: ${subject}`);
            console.log(`📧 [SIMULATED] Content: ${content}`);
            return { success: true, simulated: true };
        }

        try {
            const mailOptions = {
                from: options.from || '"Sam AI CRM" <sam@company.com>',
                to: recipientEmail,
                subject: subject,
                html: this.generateEmailHTML(subject, content, options),
                text: content
            };

            const info = await this.transporter.sendMail(mailOptions);
            
            console.log(`✅ Email sent to ${recipientEmail}`);
            console.log(`🔗 Preview URL: ${nodemailer.getTestMessageUrl(info)}`);
            
            return {
                success: true,
                messageId: info.messageId,
                previewUrl: nodemailer.getTestMessageUrl(info)
            };
        } catch (error) {
            console.error('❌ Email sending failed:', error);
            throw error;
        }
    }

    generateEmailHTML(subject, content, options = {}) {
        const priority = options.priority || 'normal';
        const priorityColor = {
            'high': '#dc3545',
            'normal': '#007bff',
            'low': '#28a745'
        }[priority];

        return `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>${subject}</title>
                <style>
                    body {
                        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                        line-height: 1.6;
                        color: #333;
                        max-width: 600px;
                        margin: 0 auto;
                        padding: 20px;
                        background-color: #f4f4f4;
                    }
                    .email-container {
                        background: white;
                        border-radius: 10px;
                        box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                        overflow: hidden;
                    }
                    .header {
                        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                        color: white;
                        padding: 30px 20px;
                        text-align: center;
                    }
                    .header h1 {
                        margin: 0;
                        font-size: 24px;
                    }
                    .priority-badge {
                        display: inline-block;
                        background: ${priorityColor};
                        color: white;
                        padding: 4px 8px;
                        border-radius: 12px;
                        font-size: 12px;
                        font-weight: bold;
                        text-transform: uppercase;
                        margin-top: 10px;
                    }
                    .content {
                        padding: 30px 20px;
                    }
                    .message {
                        background: #f8f9fa;
                        border-left: 4px solid ${priorityColor};
                        padding: 20px;
                        margin: 20px 0;
                        border-radius: 0 5px 5px 0;
                    }
                    .footer {
                        background: #f8f9fa;
                        padding: 20px;
                        text-align: center;
                        color: #666;
                        font-size: 14px;
                    }
                    .btn {
                        display: inline-block;
                        background: ${priorityColor};
                        color: white;
                        padding: 12px 24px;
                        text-decoration: none;
                        border-radius: 5px;
                        margin-top: 20px;
                    }
                </style>
            </head>
            <body>
                <div class="email-container">
                    <div class="header">
                        <h1>🤖 Sam AI CRM</h1>
                        <div class="priority-badge">${priority} Priority</div>
                    </div>
                    <div class="content">
                        <h2>${subject}</h2>
                        <div class="message">
                            ${content.replace(/\n/g, '<br>')}
                        </div>
                        <p><strong>Sent by:</strong> Sam AI Assistant</p>
                        <p><strong>Time:</strong> ${new Date().toLocaleString()}</p>
                        <a href="http://localhost:3000" class="btn">Open CRM System</a>
                    </div>
                    <div class="footer">
                        <p>This email was sent automatically by Sam AI CRM System.</p>
                        <p>Please do not reply to this email.</p>
                    </div>
                </div>
            </body>
            </html>
        `;
    }

    async sendEmployeeMessage(fromEmployee, toEmployee, subject, content, priority = 'normal') {
        const emailSubject = `[CRM] ${subject}`;
        const emailContent = `
Hello ${toEmployee.name},

You have received a new message in the CRM system.

--- Message ---
${content}

--- End Message ---

From: ${fromEmployee ? fromEmployee.name : 'Sam AI Assistant'}
Priority: ${priority.toUpperCase()}

Please log into the CRM system to view and respond to this message.

Best regards,
Sam AI CRM System`;

        return await this.sendNotification(
            toEmployee.email,
            emailSubject,
            emailContent,
            { priority, from: fromEmployee ? `"${fromEmployee.name}" <${fromEmployee.email}>` : null }
        );
    }

    async sendWelcomeEmail(employee) {
        const subject = 'Welcome to Sam AI CRM System!';
        const content = `
Hello ${employee.name},

Welcome to our CRM system! Your account has been created successfully.

Your Details:
- Name: ${employee.name}
- Email: ${employee.email}
- Department: ${employee.department}
- Position: ${employee.position}

You can now:
• Receive messages and notifications
• Interact with Sam AI Assistant
• Collaborate with your team

To get started, visit: http://localhost:3000

If you have any questions, just ask Sam!

Best regards,
Sam AI CRM Team`;

        return await this.sendNotification(employee.email, subject, content);
    }

    // Test email functionality
    async testEmail() {
        try {
            const testResult = await this.sendNotification(
                'test@example.com',
                'Sam AI CRM - Test Email',
                'This is a test email from Sam AI CRM system. If you receive this, the email service is working correctly!',
                { priority: 'normal' }
            );
            console.log('✅ Email test completed:', testResult);
            return testResult;
        } catch (error) {
            console.error('❌ Email test failed:', error);
            throw error;
        }
    }
}

module.exports = EmailService;

