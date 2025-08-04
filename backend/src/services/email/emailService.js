const nodemailer = require('nodemailer');
const { logger } = require('../../utils/logger');

// Create transporter
const createTransporter = () => {
  return nodemailer.createTransporter({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: process.env.SMTP_PORT || 587,
    secure: false, // true for 465, false for other ports
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
};

const emailService = {
  // Send welcome email
  sendWelcomeEmail: async (user) => {
    try {
      const transporter = createTransporter();
      
      const mailOptions = {
        from: `"${process.env.APP_NAME || 'GameStore'}" <${process.env.SMTP_USER}>`,
        to: user.email,
        subject: 'Welcome to GameStore!',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #333;">Welcome to GameStore!</h2>
            <p>Hi ${user.first_name},</p>
            <p>Thank you for registering with GameStore. We're excited to have you as part of our gaming community!</p>
            <p>You can now:</p>
            <ul>
              <li>Browse our extensive collection of games</li>
              <li>Add items to your wishlist</li>
              <li>Make purchases with secure payment</li>
              <li>Track your orders</li>
              <li>Write reviews and ratings</li>
            </ul>
            <p>If you have any questions, feel free to contact our support team.</p>
            <p>Happy gaming!</p>
            <p>Best regards,<br>The GameStore Team</p>
          </div>
        `
      };

      const info = await transporter.sendMail(mailOptions);
      logger.info(`Welcome email sent to: ${user.email}`);
      return info;
    } catch (error) {
      logger.error('Send welcome email error:', error);
      throw error;
    }
  },

  // Send email verification
  sendVerificationEmail: async (user, verificationToken) => {
    try {
      const transporter = createTransporter();
      const verificationUrl = `${process.env.FRONTEND_URL}/verify-email?token=${verificationToken}`;
      
      const mailOptions = {
        from: `"${process.env.APP_NAME || 'GameStore'}" <${process.env.SMTP_USER}>`,
        to: user.email,
        subject: 'Verify Your Email Address',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #333;">Verify Your Email Address</h2>
            <p>Hi ${user.first_name},</p>
            <p>Please click the button below to verify your email address:</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${verificationUrl}" style="background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">Verify Email</a>
            </div>
            <p>If the button doesn't work, you can copy and paste this link into your browser:</p>
            <p>${verificationUrl}</p>
            <p>This link will expire in 24 hours.</p>
            <p>If you didn't create an account, you can safely ignore this email.</p>
            <p>Best regards,<br>The GameStore Team</p>
          </div>
        `
      };

      const info = await transporter.sendMail(mailOptions);
      logger.info(`Verification email sent to: ${user.email}`);
      return info;
    } catch (error) {
      logger.error('Send verification email error:', error);
      throw error;
    }
  },

  // Send password reset email
  sendPasswordResetEmail: async (user, resetToken) => {
    try {
      const transporter = createTransporter();
      const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;
      
      const mailOptions = {
        from: `"${process.env.APP_NAME || 'GameStore'}" <${process.env.SMTP_USER}>`,
        to: user.email,
        subject: 'Reset Your Password',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #333;">Reset Your Password</h2>
            <p>Hi ${user.first_name},</p>
            <p>You requested to reset your password. Click the button below to create a new password:</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${resetUrl}" style="background-color: #dc3545; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">Reset Password</a>
            </div>
            <p>If the button doesn't work, you can copy and paste this link into your browser:</p>
            <p>${resetUrl}</p>
            <p>This link will expire in 1 hour.</p>
            <p>If you didn't request a password reset, you can safely ignore this email.</p>
            <p>Best regards,<br>The GameStore Team</p>
          </div>
        `
      };

      const info = await transporter.sendMail(mailOptions);
      logger.info(`Password reset email sent to: ${user.email}`);
      return info;
    } catch (error) {
      logger.error('Send password reset email error:', error);
      throw error;
    }
  },

  // Send order confirmation email
  sendOrderConfirmationEmail: async (user, order) => {
    try {
      const transporter = createTransporter();
      
      const mailOptions = {
        from: `"${process.env.APP_NAME || 'GameStore'}" <${process.env.SMTP_USER}>`,
        to: user.email,
        subject: `Order Confirmation - #${order.order_number}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #333;">Order Confirmation</h2>
            <p>Hi ${user.first_name},</p>
            <p>Thank you for your order! Here are your order details:</p>
            
            <div style="background-color: #f8f9fa; padding: 20px; border-radius: 5px; margin: 20px 0;">
              <h3>Order #${order.order_number}</h3>
              <p><strong>Order Date:</strong> ${new Date(order.created_at).toLocaleDateString()}</p>
              <p><strong>Status:</strong> ${order.status}</p>
              <p><strong>Total:</strong> $${order.total.toFixed(2)}</p>
            </div>
            
            <p>We'll send you an email when your order ships.</p>
            <p>If you have any questions, please contact our support team.</p>
            <p>Best regards,<br>The GameStore Team</p>
          </div>
        `
      };

      const info = await transporter.sendMail(mailOptions);
      logger.info(`Order confirmation email sent to: ${user.email} for order: ${order.order_number}`);
      return info;
    } catch (error) {
      logger.error('Send order confirmation email error:', error);
      throw error;
    }
  },

  // Send order shipped email
  sendOrderShippedEmail: async (user, order, trackingNumber) => {
    try {
      const transporter = createTransporter();
      
      const mailOptions = {
        from: `"${process.env.APP_NAME || 'GameStore'}" <${process.env.SMTP_USER}>`,
        to: user.email,
        subject: `Your Order Has Shipped - #${order.order_number}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #333;">Your Order Has Shipped!</h2>
            <p>Hi ${user.first_name},</p>
            <p>Great news! Your order has been shipped and is on its way to you.</p>
            
            <div style="background-color: #f8f9fa; padding: 20px; border-radius: 5px; margin: 20px 0;">
              <h3>Order #${order.order_number}</h3>
              <p><strong>Tracking Number:</strong> ${trackingNumber}</p>
              <p><strong>Shipping Date:</strong> ${new Date().toLocaleDateString()}</p>
            </div>
            
            <p>You can track your package using the tracking number above.</p>
            <p>Thank you for shopping with GameStore!</p>
            <p>Best regards,<br>The GameStore Team</p>
          </div>
        `
      };

      const info = await transporter.sendMail(mailOptions);
      logger.info(`Order shipped email sent to: ${user.email} for order: ${order.order_number}`);
      return info;
    } catch (error) {
      logger.error('Send order shipped email error:', error);
      throw error;
    }
  },

  // Send order delivered email
  sendOrderDeliveredEmail: async (user, order) => {
    try {
      const transporter = createTransporter();
      
      const mailOptions = {
        from: `"${process.env.APP_NAME || 'GameStore'}" <${process.env.SMTP_USER}>`,
        to: user.email,
        subject: `Your Order Has Been Delivered - #${order.order_number}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #333;">Your Order Has Been Delivered!</h2>
            <p>Hi ${user.first_name},</p>
            <p>Your order has been successfully delivered. We hope you enjoy your purchase!</p>
            
            <div style="background-color: #f8f9fa; padding: 20px; border-radius: 5px; margin: 20px 0;">
              <h3>Order #${order.order_number}</h3>
              <p><strong>Delivery Date:</strong> ${new Date().toLocaleDateString()}</p>
            </div>
            
            <p>We'd love to hear your feedback! Please consider leaving a review for the products you purchased.</p>
            <p>Thank you for shopping with GameStore!</p>
            <p>Best regards,<br>The GameStore Team</p>
          </div>
        `
      };

      const info = await transporter.sendMail(mailOptions);
      logger.info(`Order delivered email sent to: ${user.email} for order: ${order.order_number}`);
      return info;
    } catch (error) {
      logger.error('Send order delivered email error:', error);
      throw error;
    }
  },

  // Send refund confirmation email
  sendRefundConfirmationEmail: async (user, order, refundAmount) => {
    try {
      const transporter = createTransporter();
      
      const mailOptions = {
        from: `"${process.env.APP_NAME || 'GameStore'}" <${process.env.SMTP_USER}>`,
        to: user.email,
        subject: `Refund Processed - #${order.order_number}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #333;">Refund Processed</h2>
            <p>Hi ${user.first_name},</p>
            <p>Your refund has been processed successfully.</p>
            
            <div style="background-color: #f8f9fa; padding: 20px; border-radius: 5px; margin: 20px 0;">
              <h3>Order #${order.order_number}</h3>
              <p><strong>Refund Amount:</strong> $${refundAmount.toFixed(2)}</p>
              <p><strong>Refund Date:</strong> ${new Date().toLocaleDateString()}</p>
            </div>
            
            <p>The refund will be credited to your original payment method within 5-10 business days.</p>
            <p>If you have any questions, please contact our support team.</p>
            <p>Best regards,<br>The GameStore Team</p>
          </div>
        `
      };

      const info = await transporter.sendMail(mailOptions);
      logger.info(`Refund confirmation email sent to: ${user.email} for order: ${order.order_number}`);
      return info;
    } catch (error) {
      logger.error('Send refund confirmation email error:', error);
      throw error;
    }
  },

  // Send low stock alert email (admin)
  sendLowStockAlertEmail: async (product) => {
    try {
      const transporter = createTransporter();
      
      const mailOptions = {
        from: `"${process.env.APP_NAME || 'GameStore'}" <${process.env.SMTP_USER}>`,
        to: process.env.ADMIN_EMAIL,
        subject: 'Low Stock Alert',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #dc3545;">Low Stock Alert</h2>
            <p>The following product is running low on stock:</p>
            
            <div style="background-color: #f8f9fa; padding: 20px; border-radius: 5px; margin: 20px 0;">
              <h3>${product.name}</h3>
              <p><strong>SKU:</strong> ${product.sku}</p>
              <p><strong>Current Stock:</strong> ${product.stock_quantity}</p>
              <p><strong>Minimum Stock Level:</strong> ${product.min_stock_level}</p>
            </div>
            
            <p>Please restock this product as soon as possible.</p>
          </div>
        `
      };

      const info = await transporter.sendMail(mailOptions);
      logger.info(`Low stock alert email sent for product: ${product.name}`);
      return info;
    } catch (error) {
      logger.error('Send low stock alert email error:', error);
      throw error;
    }
  },

  // Send custom email
  sendCustomEmail: async (to, subject, htmlContent) => {
    try {
      const transporter = createTransporter();
      
      const mailOptions = {
        from: `"${process.env.APP_NAME || 'GameStore'}" <${process.env.SMTP_USER}>`,
        to,
        subject,
        html: htmlContent
      };

      const info = await transporter.sendMail(mailOptions);
      logger.info(`Custom email sent to: ${to}`);
      return info;
    } catch (error) {
      logger.error('Send custom email error:', error);
      throw error;
    }
  }
};

module.exports = { emailService }; 