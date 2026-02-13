import brevo from '@getbrevo/brevo';
import dotenv from 'dotenv';

dotenv.config();

// Initialize Brevo API
const apiInstance = new brevo.TransactionalEmailsApi();
apiInstance.setApiKey(brevo.TransactionalEmailsApiApiKeys.apiKey, process.env.BREVO_API_KEY);

// Generate 6-digit OTP
export const generateOTP = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
};

// Send OTP email using Brevo
export const sendOTPEmail = async (email, otp, fullName) => {
    try {
        const sendSmtpEmail = new brevo.SendSmtpEmail();

        sendSmtpEmail.sender = { name: 'SNSR AI', email: 'sabarinadhmedia2006@gmail.com' };
        sendSmtpEmail.to = [{ email: email, name: fullName }];
        sendSmtpEmail.subject = 'Verify your SNSR AI account';
        sendSmtpEmail.htmlContent = `
            <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 500px; margin: 0 auto; padding: 20px;">
                <div style="text-align: center; margin-bottom: 30px;">
                    <h1 style="color: #6366f1; margin: 0;">✦ SNSR AI</h1>
                </div>
                <h2 style="color: #1e293b;">Hello ${fullName}! 👋</h2>
                <p style="color: #475569; font-size: 16px;">
                    Thanks for signing up! Use this code to verify your email:
                </p>
                <div style="background: linear-gradient(135deg, #6366f1, #ec4899); padding: 20px; border-radius: 12px; text-align: center; margin: 30px 0;">
                    <span style="color: white; font-size: 36px; font-weight: bold; letter-spacing: 8px;">${otp}</span>
                </div>
                <p style="color: #64748b; font-size: 14px;">
                    This code expires in <strong>10 minutes</strong>.
                </p>
                <p style="color: #94a3b8; font-size: 12px; margin-top: 30px;">
                    If you didn't request this, please ignore this email.
                </p>
            </div>
        `;

        const result = await apiInstance.sendTransacEmail(sendSmtpEmail);
        console.log('OTP email sent via Brevo:', result.body?.messageId);
        return { success: true, data: result };
    } catch (error) {
        console.error('Brevo email error:', error?.body || error);
        return { success: false, error };
    }
};
