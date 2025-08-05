const { PaymentMethod, User } = require('../models');
const { logger } = require('../utils/logger');

const paymentController = {
  // Get user's payment methods
  getUserPaymentMethods: async (req, res) => {
    try {
      const userId = req.user.id;
      
      const paymentMethods = await PaymentMethod.findAll({
        where: { 
          user_id: userId,
          is_active: true 
        },
        order: [['is_default', 'DESC'], ['created_at', 'DESC']]
      });

      res.json({
        success: true,
        data: paymentMethods
      });
    } catch (error) {
      logger.error('Error fetching payment methods:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch payment methods',
        error: error.message
      });
    }
  },

  // Create new payment method
  createPaymentMethod: async (req, res) => {
    try {
      const userId = req.user.id;
      const { payment_type, card_last_four, card_brand, stripe_payment_method_id, is_default } = req.body;

      // If this is set as default, unset other defaults
      if (is_default) {
        await PaymentMethod.update(
          { is_default: false },
          { where: { user_id: userId, is_default: true } }
        );
      }

      const paymentMethod = await PaymentMethod.create({
        user_id: userId,
        payment_type: payment_type || 'card',
        card_last_four,
        card_brand,
        stripe_payment_method_id,
        is_default: is_default || false
      });

      res.status(201).json({
        success: true,
        message: 'Payment method created successfully',
        data: paymentMethod
      });
    } catch (error) {
      logger.error('Error creating payment method:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create payment method',
        error: error.message
      });
    }
  },

  // Update payment method
  updatePaymentMethod: async (req, res) => {
    try {
      const userId = req.user.id;
      const { id } = req.params;
      const updateData = req.body;

      const paymentMethod = await PaymentMethod.findOne({
        where: { id, user_id: userId }
      });

      if (!paymentMethod) {
        return res.status(404).json({
          success: false,
          message: 'Payment method not found'
        });
      }

      // If setting as default, unset other defaults
      if (updateData.is_default) {
        await PaymentMethod.update(
          { is_default: false },
          { where: { user_id: userId, is_default: true, id: { [require('sequelize').Op.ne]: id } } }
        );
      }

      await paymentMethod.update(updateData);

      res.json({
        success: true,
        message: 'Payment method updated successfully',
        data: paymentMethod
      });
    } catch (error) {
      logger.error('Error updating payment method:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update payment method',
        error: error.message
      });
    }
  },

  // Delete payment method
  deletePaymentMethod: async (req, res) => {
    try {
      const userId = req.user.id;
      const { id } = req.params;

      const paymentMethod = await PaymentMethod.findOne({
        where: { id, user_id: userId }
      });

      if (!paymentMethod) {
        return res.status(404).json({
          success: false,
          message: 'Payment method not found'
        });
      }

      await paymentMethod.destroy();

      res.json({
        success: true,
        message: 'Payment method deleted successfully'
      });
    } catch (error) {
      logger.error('Error deleting payment method:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete payment method',
        error: error.message
      });
    }
  }
};

module.exports = paymentController; 