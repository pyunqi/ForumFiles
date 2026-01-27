import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransporter({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

export async function sendVerificationCode(email: string, code: string): Promise<void> {
  const mailOptions = {
    from: process.env.SMTP_FROM || 'noreply@forumfiles.com',
    to: email,
    subject: 'ForumFiles - Verification Code',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #333;">Your Verification Code</h2>
        <p style="font-size: 16px; color: #666;">
          Your verification code for ForumFiles is:
        </p>
        <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; text-align: center; margin: 20px 0;">
          <span style="font-size: 32px; font-weight: bold; color: #007bff; letter-spacing: 5px;">
            ${code}
          </span>
        </div>
        <p style="font-size: 14px; color: #666;">
          This code will expire in 10 minutes.
        </p>
        <p style="font-size: 14px; color: #999;">
          If you didn't request this code, please ignore this email.
        </p>
      </div>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log('Verification code sent to:', email);
  } catch (error) {
    console.error('Error sending verification code:', error);
    throw new Error('Failed to send verification code');
  }
}

export async function sendFileShare(
  recipientEmail: string,
  filename: string,
  downloadUrl: string,
  message?: string
): Promise<void> {
  const mailOptions = {
    from: process.env.SMTP_FROM || 'noreply@forumfiles.com',
    to: recipientEmail,
    subject: `File Shared with You: ${filename}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #333;">File Shared with You</h2>
        <p style="font-size: 16px; color: #666;">
          Someone has shared a file with you on ForumFiles.
        </p>
        <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <p style="margin: 0; font-weight: bold; color: #333;">File:</p>
          <p style="margin: 5px 0 0 0; color: #666;">${filename}</p>
        </div>
        ${message ? `
        <div style="background-color: #fff3cd; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #ffc107;">
          <p style="margin: 0; font-weight: bold; color: #856404;">Message:</p>
          <p style="margin: 5px 0 0 0; color: #856404;">${message}</p>
        </div>
        ` : ''}
        <p style="text-align: center; margin: 30px 0;">
          <a href="${downloadUrl}"
             style="background-color: #007bff; color: white; padding: 12px 30px;
                    text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
            Download File
          </a>
        </p>
        <p style="font-size: 12px; color: #999; text-align: center;">
          This link will remain valid as long as the file exists.
        </p>
      </div>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log('File share notification sent to:', recipientEmail);
  } catch (error) {
    console.error('Error sending file share notification:', error);
    throw new Error('Failed to send file share notification');
  }
}

export async function sendPublicLinkNotification(
  recipientEmail: string,
  filename: string,
  publicLink: string,
  password: string
): Promise<void> {
  const mailOptions = {
    from: process.env.SMTP_FROM || 'noreply@forumfiles.com',
    to: recipientEmail,
    subject: `Public Download Link: ${filename}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #333;">Public Download Link</h2>
        <p style="font-size: 16px; color: #666;">
          A public download link has been created for:
        </p>
        <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <p style="margin: 0; font-weight: bold; color: #333;">File:</p>
          <p style="margin: 5px 0 0 0; color: #666;">${filename}</p>
        </div>
        <div style="background-color: #d1ecf1; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #0c5460;">
          <p style="margin: 0; font-weight: bold; color: #0c5460;">Download Password:</p>
          <p style="margin: 5px 0 0 0; font-size: 24px; font-weight: bold; color: #0c5460; letter-spacing: 3px;">${password}</p>
        </div>
        <p style="text-align: center; margin: 30px 0;">
          <a href="${publicLink}"
             style="background-color: #28a745; color: white; padding: 12px 30px;
                    text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
            Access Download Page
          </a>
        </p>
        <p style="font-size: 12px; color: #999; text-align: center;">
          You will need to enter the password to download the file.
        </p>
      </div>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log('Public link notification sent to:', recipientEmail);
  } catch (error) {
    console.error('Error sending public link notification:', error);
    throw new Error('Failed to send public link notification');
  }
}
