const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { logger } = require('../../utils/logger');

const stripeService = {
  // Create payment intent
  createPaymentIntent: async (amount, currency = 'usd', metadata = {}) => {
    try {
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(amount * 100), // Convert to cents
        currency,
        metadata,
        automatic_payment_methods: {
          enabled: true,
        },
      });

      logger.info(`Payment intent created: ${paymentIntent.id}`);
      return paymentIntent;
    } catch (error) {
      logger.error('Create payment intent error:', error);
      throw error;
    }
  },

  // Confirm payment intent
  confirmPaymentIntent: async (paymentIntentId) => {
    try {
      const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
      return paymentIntent;
    } catch (error) {
      logger.error('Confirm payment intent error:', error);
      throw error;
    }
  },

  // Create customer
  createCustomer: async (email, name, metadata = {}) => {
    try {
      const customer = await stripe.customers.create({
        email,
        name,
        metadata,
      });

      logger.info(`Customer created: ${customer.id}`);
      return customer;
    } catch (error) {
      logger.error('Create customer error:', error);
      throw error;
    }
  },

  // Update customer
  updateCustomer: async (customerId, data) => {
    try {
      const customer = await stripe.customers.update(customerId, data);
      logger.info(`Customer updated: ${customerId}`);
      return customer;
    } catch (error) {
      logger.error('Update customer error:', error);
      throw error;
    }
  },

  // Create payment method
  createPaymentMethod: async (type, card, billingDetails) => {
    try {
      const paymentMethod = await stripe.paymentMethods.create({
        type,
        card,
        billing_details: billingDetails,
      });

      logger.info(`Payment method created: ${paymentMethod.id}`);
      return paymentMethod;
    } catch (error) {
      logger.error('Create payment method error:', error);
      throw error;
    }
  },

  // Attach payment method to customer
  attachPaymentMethod: async (paymentMethodId, customerId) => {
    try {
      const paymentMethod = await stripe.paymentMethods.attach(paymentMethodId, {
        customer: customerId,
      });

      logger.info(`Payment method attached: ${paymentMethodId} to customer: ${customerId}`);
      return paymentMethod;
    } catch (error) {
      logger.error('Attach payment method error:', error);
      throw error;
    }
  },

  // Detach payment method
  detachPaymentMethod: async (paymentMethodId) => {
    try {
      const paymentMethod = await stripe.paymentMethods.detach(paymentMethodId);
      logger.info(`Payment method detached: ${paymentMethodId}`);
      return paymentMethod;
    } catch (error) {
      logger.error('Detach payment method error:', error);
      throw error;
    }
  },

  // Create refund
  createRefund: async (paymentIntentId, amount, reason = 'requested_by_customer') => {
    try {
      const refund = await stripe.refunds.create({
        payment_intent: paymentIntentId,
        amount: Math.round(amount * 100), // Convert to cents
        reason,
      });

      logger.info(`Refund created: ${refund.id} for payment: ${paymentIntentId}`);
      return refund;
    } catch (error) {
      logger.error('Create refund error:', error);
      throw error;
    }
  },

  // Get refund
  getRefund: async (refundId) => {
    try {
      const refund = await stripe.refunds.retrieve(refundId);
      return refund;
    } catch (error) {
      logger.error('Get refund error:', error);
      throw error;
    }
  },

  // Create webhook event
  constructWebhookEvent: (payload, signature, secret) => {
    try {
      const event = stripe.webhooks.constructEvent(payload, signature, secret);
      return event;
    } catch (error) {
      logger.error('Webhook signature verification failed:', error);
      throw error;
    }
  },

  // Handle webhook events
  handleWebhookEvent: async (event) => {
    try {
      switch (event.type) {
        case 'payment_intent.succeeded':
          await handlePaymentSucceeded(event.data.object);
          break;
        case 'payment_intent.payment_failed':
          await handlePaymentFailed(event.data.object);
          break;
        case 'charge.refunded':
          await handleRefundSucceeded(event.data.object);
          break;
        default:
          logger.info(`Unhandled event type: ${event.type}`);
      }
    } catch (error) {
      logger.error('Handle webhook event error:', error);
      throw error;
    }
  },

  // Get payment intent
  getPaymentIntent: async (paymentIntentId) => {
    try {
      const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
      return paymentIntent;
    } catch (error) {
      logger.error('Get payment intent error:', error);
      throw error;
    }
  },

  // List customer payment methods
  listCustomerPaymentMethods: async (customerId, type = 'card') => {
    try {
      const paymentMethods = await stripe.paymentMethods.list({
        customer: customerId,
        type,
      });
      return paymentMethods;
    } catch (error) {
      logger.error('List customer payment methods error:', error);
      throw error;
    }
  },

  // Set default payment method
  setDefaultPaymentMethod: async (customerId, paymentMethodId) => {
    try {
      const customer = await stripe.customers.update(customerId, {
        invoice_settings: {
          default_payment_method: paymentMethodId,
        },
      });
      logger.info(`Default payment method set: ${paymentMethodId} for customer: ${customerId}`);
      return customer;
    } catch (error) {
      logger.error('Set default payment method error:', error);
      throw error;
    }
  }
};

// Webhook event handlers
const handlePaymentSucceeded = async (paymentIntent) => {
  try {
    logger.info(`Payment succeeded: ${paymentIntent.id}`);
    // Update order status in database
    // Send confirmation email
    // Update inventory
  } catch (error) {
    logger.error('Handle payment succeeded error:', error);
  }
};

const handlePaymentFailed = async (paymentIntent) => {
  try {
    logger.info(`Payment failed: ${paymentIntent.id}`);
    // Update order status in database
    // Send failure notification
  } catch (error) {
    logger.error('Handle payment failed error:', error);
  }
};

const handleRefundSucceeded = async (charge) => {
  try {
    logger.info(`Refund succeeded: ${charge.id}`);
    // Update order status in database
    // Send refund confirmation
  } catch (error) {
    logger.error('Handle refund succeeded error:', error);
  }
};

module.exports = { stripeService }; 