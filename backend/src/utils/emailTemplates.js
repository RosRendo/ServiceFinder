const getPasswordResetEmail = (code, userName) => {
  return {
    subject: 'Password Reset Code - CleanService',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .code-box { background: white; border: 2px dashed #667eea; border-radius: 10px; padding: 20px; text-align: center; margin: 20px 0; }
          .code { font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #667eea; }
          .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
          .warning { background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🔐 Password Reset Request</h1>
          </div>
          <div class="content">
            <p>Hi ${userName},</p>
            <p>We received a request to reset your password. Use the verification code below to proceed:</p>
            
            <div class="code-box">
              <p style="margin: 0; color: #666; font-size: 14px;">Your verification code is:</p>
              <div class="code">${code}</div>
              <p style="margin: 0; color: #666; font-size: 12px; margin-top: 10px;">Valid for 15 minutes</p>
            </div>

            <div class="warning">
              <strong>⚠️ Security Notice:</strong>
              <p style="margin: 5px 0 0 0;">If you didn't request this password reset, please ignore this email or contact support if you have concerns.</p>
            </div>

            <p>Best regards,<br>The CleanService Team</p>
          </div>
          <div class="footer">
            <p>This is an automated email. Please do not reply to this message.</p>
            <p>&copy; 2024 CleanService. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `
      Hi ${userName},

      We received a request to reset your password.

      Your verification code is: ${code}

      This code will expire in 15 minutes.

      If you didn't request this password reset, please ignore this email.

      Best regards,
      The CleanService Team
    `
  };
};
const getStaffWelcomeEmail = (userName, companyName, tempPassword, loginUrl) => {
  return {
    subject: `Welcome to ${companyName} - Your Account is Ready!`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .code-box { background: white; border: 2px dashed #667eea; border-radius: 10px; padding: 20px; text-align: center; margin: 20px 0; }
          .password { font-size: 24px; font-weight: bold; letter-spacing: 2px; color: #667eea; }
          .button { display: inline-block; padding: 12px 24px; background-color: #667eea; color: white; text-decoration: none; border-radius: 5px; font-weight: bold; margin-top: 15px; }
          .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
          .warning { background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🤝 Welcome to the Team!</h1>
          </div>
          <div class="content">
            <p>Hi ${userName},</p>
            <p>You have been invited by **${companyName}** to join their team through Service Finder. Your account has been created successfully.</p>
            
            <p>Please use the temporary password below to log in for the first time:</p>
            <div class="code-box">
              <p style="margin: 0; color: #666; font-size: 14px;">Your temporary password is:</p>
              <div class="password">${tempPassword}</div>
            </div>

            <p style="text-align: center;">
              <a href="${loginUrl}" class="button">Log In Now</a>
            </p>

            <div class="warning">
              <strong>⚠️ Security Notice:</strong>
              <p style="margin: 5px 0 0 0;">Please change your password immediately after logging in.</p>
            </div>

            <p>Best regards,<br>Service Finder Team</p>
          </div>
          <div class="footer">
            <p>This is an automated email. Please do not reply to this message.</p>
            <p>&copy; ${new Date().getFullYear()} Service Finder. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `
      Hi ${userName},

      You have been invited by ${companyName} to join their team through Service Finder. Your account has been created successfully.

      Your temporary password is: ${tempPassword}

      Please log in at ${loginUrl}

      IMPORTANT: Please change your password immediately after logging in.

      Best regards,
      Service Finder Team
    `
  };
};

const getBookingConfirmationEmail = (customerName, serviceName, companyName, date, time) => {
  return {
    subject: `Booking Confirmed: ${serviceName} with ${companyName}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #48bb78 0%, #38a169 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .details-box { background: white; border-radius: 10px; padding: 20px; margin: 20px 0; border: 1px solid #e2e8f0; }
          .detail-row { display: flex; justify-content: space-between; margin-bottom: 10px; padding-bottom: 10px; border-bottom: 1px solid #edf2f7; }
          .detail-row:last-child { border-bottom: none; margin-bottom: 0; padding-bottom: 0; }
          .label { font-weight: bold; color: #718096; }
          .value { font-weight: 500; color: #2d3748; }
          .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>✅ Booking Confirmed</h1>
          </div>
          <div class="content">
            <p>Hi ${customerName},</p>
            <p>Your booking with <strong>${companyName}</strong> has been confirmed successfully!</p>
            
            <div class="details-box">
              <div class="detail-row">
                <span class="label">Service:</span>
                <span class="value">${serviceName}</span>
              </div>
              <div class="detail-row">
                <span class="label">Date:</span>
                <span class="value">${date}</span>
              </div>
              <div class="detail-row">
                <span class="label">Time:</span>
                <span class="value">${time}</span>
              </div>
            </div>

            <p>Thank you for choosing Service Finder. If you need to make changes to your booking, please check your app dashboard.</p>

            <p>Best regards,<br>Service Finder Team</p>
          </div>
          <div class="footer">
            <p>This is an automated email. Please do not reply to this message.</p>
            <p>&copy; ${new Date().getFullYear()} Service Finder. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `
      Hi ${customerName},

      Your booking with ${companyName} has been confirmed successfully!

      Service: ${serviceName}
      Date: ${date}
      Time: ${time}

      Thank you for choosing Service Finder.

      Best regards,
      Service Finder Team
    `
  };
};

module.exports = { getPasswordResetEmail, getStaffWelcomeEmail, getBookingConfirmationEmail };