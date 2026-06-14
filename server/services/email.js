import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: parseInt(process.env.EMAIL_PORT, 10),
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

export const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

export const sendOTPEmail = async (email, otp, name) => {
  console.log(`\n🔑 [PrepVault] OTP for ${email} (${name}): ${otp}\n`);
  
  const mailOptions = {
    from: `"PrepVault" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: '🔐 Verify Your PrepVault Account',
    html: `
      <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 480px; margin: 0 auto; background: #0a0a1a; border-radius: 16px; overflow: hidden; border: 1px solid rgba(99,102,241,0.3);">
        <div style="background: linear-gradient(135deg, #6366f1, #a855f7); padding: 32px 24px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 28px; font-weight: 700;">PrepVault</h1>
          <p style="color: rgba(255,255,255,0.85); margin: 8px 0 0; font-size: 14px;">AI-Powered Job Preparation</p>
        </div>
        <div style="padding: 32px 24px;">
          <p style="color: #f1f5f9; font-size: 16px; margin: 0 0 8px;">Hi ${name},</p>
          <p style="color: #94a3b8; font-size: 14px; line-height: 1.6; margin: 0 0 24px;">
            Welcome to PrepVault! Use the verification code below to activate your account.
          </p>
          <div style="background: rgba(99,102,241,0.15); border: 1px solid rgba(99,102,241,0.3); border-radius: 12px; padding: 24px; text-align: center; margin: 0 0 24px;">
            <p style="color: #94a3b8; font-size: 12px; margin: 0 0 8px; text-transform: uppercase; letter-spacing: 2px;">Verification Code</p>
            <p style="color: #6366f1; font-size: 36px; font-weight: 700; letter-spacing: 8px; margin: 0;">${otp}</p>
          </div>
          <p style="color: #64748b; font-size: 12px; margin: 0; text-align: center;">
            This code expires in <strong style="color: #f59e0b;">10 minutes</strong>. Do not share it with anyone.
          </p>
        </div>
        <div style="padding: 16px 24px; border-top: 1px solid rgba(255,255,255,0.05); text-align: center;">
          <p style="color: #475569; font-size: 11px; margin: 0;">
            If you didn't create a PrepVault account, you can safely ignore this email.
          </p>
        </div>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
  } catch (error) {
    console.warn(`⚠️ [PrepVault] SMTP send error: ${error.message}. Continuing with console-logged OTP.`);
  }
};
