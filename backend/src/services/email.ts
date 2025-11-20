export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export interface RecommendationEmailData {
  userName: string;
  recommendations: Array<{
    productName: string;
    price: number;
    reasoning: string;
  }>;
}

export async function sendEmail(options: EmailOptions): Promise<boolean> {
  const emailService = process.env.EMAIL_SERVICE;
  
  if (!emailService || emailService === 'console') {
    console.log('=== EMAIL (Console Mode) ===');
    console.log(`To: ${options.to}`);
    console.log(`Subject: ${options.subject}`);
    console.log(`Body:\n${options.text || options.html}`);
    console.log('===========================');
    return true;
  }
  
  if (emailService === 'smtp') {
    return sendViaSMTP(options);
  }
  
  if (emailService === 'sendgrid') {
    return sendViaSendGrid(options);
  }
  
  console.warn(`Unknown email service: ${emailService}, using console mode`);
  return sendEmail({...options});
}

async function sendViaSMTP(options: EmailOptions): Promise<boolean> {
  const nodemailer = require('nodemailer');
  
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  });
  
  try {
    await transporter.sendMail({
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text
    });
    return true;
  } catch (error) {
    console.error('SMTP email error:', error);
    return false;
  }
}

async function sendViaSendGrid(options: EmailOptions): Promise<boolean> {
  const sgMail = require('@sendgrid/mail');
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
  
  try {
    await sgMail.send({
      to: options.to,
      from: process.env.SENDGRID_FROM_EMAIL || 'noreply@visioneer.com',
      subject: options.subject,
      html: options.html,
      text: options.text
    });
    return true;
  } catch (error) {
    console.error('SendGrid email error:', error);
    return false;
  }
}

export function generateRecommendationEmail(data: RecommendationEmailData): EmailOptions {
  const productsList = data.recommendations.map((rec, index) => 
    `${index + 1}. ${rec.productName} - $${rec.price}\n   ${rec.reasoning}`
  ).join('\n\n');
  
  return {
    to: data.userName,
    subject: 'Your Room Design Recommendations',
    html: `
      <html>
        <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Hello ${data.userName}!</h2>
          <p>Here are your personalized room design recommendations:</p>
          <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
            ${data.recommendations.map((rec, index) => `
              <div style="margin-bottom: 20px;">
                <h3>${index + 1}. ${rec.productName} - $${rec.price}</h3>
                <p>${rec.reasoning}</p>
              </div>
            `).join('')}
          </div>
          <p>Thank you for using Visioneer!</p>
        </body>
      </html>
    `,
    text: `Hello ${data.userName}!\n\nYour Room Design Recommendations:\n\n${productsList}\n\nThank you for using Visioneer!`
  };
}

export function generateWelcomeEmail(userName: string, userEmail: string): EmailOptions {
  return {
    to: userEmail,
    subject: 'Welcome to Visioneer!',
    html: `
      <html>
        <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Welcome to Visioneer, ${userName}!</h2>
          <p>We're excited to help you design your perfect space.</p>
          <p>Get started by uploading a room photo to receive AI-powered design recommendations.</p>
          <p>Happy designing!</p>
        </body>
      </html>
    `,
    text: `Welcome to Visioneer, ${userName}!\n\nWe're excited to help you design your perfect space.\n\nGet started by uploading a room photo to receive AI-powered design recommendations.\n\nHappy designing!`
  };
}

