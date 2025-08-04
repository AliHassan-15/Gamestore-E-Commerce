const { redisUtils } = require('../../config/redis/config');
const { logger } = require('../../utils/logger');

// Rate limiting configuration
const rateLimitConfig = {
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: {
    default: 100,
    auth: 5, // Login attempts
    admin: 200, // Admin endpoints
    upload: 10 // File uploads
  },
  skipSuccessfulRequests: false,
  skipFailedRequests: false
};

// Create rate limiter middleware
const createRateLimiter = (type = 'default') => {
  return async (req, res, next) => {
    try {
      const clientIP = req.ip || req.connection.remoteAddress;
      const maxRequests = rateLimitConfig.maxRequests[type] || rateLimitConfig.maxRequests.default;
      const windowMs = rateLimitConfig.windowMs;
      
      // Create rate limit key
      const key = `rate_limit:${type}:${clientIP}`;
      
      // Get current request count
      const currentCount = await redisUtils.get(key) || 0;
      
      if (currentCount >= maxRequests) {
        logger.warn(`Rate limit exceeded for IP: ${clientIP}, Type: ${type}`);
        
        return res.status(429).json({
          success: false,
          message: 'Too many requests, please try again later',
          error: {
            code: 'RATE_LIMIT_EXCEEDED',
            retryAfter: Math.ceil(windowMs / 1000)
          }
        });
      }
      
      // Increment request count
      await redisUtils.incr(key);
      
      // Set expiration if key doesn't exist
      if (currentCount === 0) {
        await redisUtils.setex(key, Math.ceil(windowMs / 1000), 1);
      }
      
      // Add rate limit headers
      res.set({
        'X-RateLimit-Limit': maxRequests,
        'X-RateLimit-Remaining': Math.max(0, maxRequests - currentCount - 1),
        'X-RateLimit-Reset': Math.ceil(Date.now() / 1000) + Math.ceil(windowMs / 1000)
      });
      
      next();
    } catch (error) {
      logger.error('Rate limiting error:', error);
      // Continue without rate limiting if Redis is unavailable
      next();
    }
  };
};

// Specific rate limiters
const rateLimiters = {
  default: createRateLimiter('default'),
  auth: createRateLimiter('auth'),
  admin: createRateLimiter('admin'),
  upload: createRateLimiter('upload')
};

// Rate limit by user ID (for authenticated users)
const userRateLimit = (type = 'default') => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return next();
      }
      
      const userId = req.user.id;
      const maxRequests = rateLimitConfig.maxRequests[type] || rateLimitConfig.maxRequests.default;
      const windowMs = rateLimitConfig.windowMs;
      
      // Create rate limit key for user
      const key = `rate_limit:user:${type}:${userId}`;
      
      // Get current request count
      const currentCount = await redisUtils.get(key) || 0;
      
      if (currentCount >= maxRequests) {
        logger.warn(`User rate limit exceeded for User ID: ${userId}, Type: ${type}`);
        
        return res.status(429).json({
          success: false,
          message: 'Too many requests, please try again later',
          error: {
            code: 'USER_RATE_LIMIT_EXCEEDED',
            retryAfter: Math.ceil(windowMs / 1000)
          }
        });
      }
      
      // Increment request count
      await redisUtils.incr(key);
      
      // Set expiration if key doesn't exist
      if (currentCount === 0) {
        await redisUtils.setex(key, Math.ceil(windowMs / 1000), 1);
      }
      
      // Add rate limit headers
      res.set({
        'X-RateLimit-Limit': maxRequests,
        'X-RateLimit-Remaining': Math.max(0, maxRequests - currentCount - 1),
        'X-RateLimit-Reset': Math.ceil(Date.now() / 1000) + Math.ceil(windowMs / 1000)
      });
      
      next();
    } catch (error) {
      logger.error('User rate limiting error:', error);
      next();
    }
  };
};

// Clear rate limit for specific IP or user
const clearRateLimit = async (identifier, type = 'default') => {
  try {
    const key = `rate_limit:${type}:${identifier}`;
    await redisUtils.del(key);
    logger.info(`Rate limit cleared for ${identifier}, Type: ${type}`);
    return true;
  } catch (error) {
    logger.error('Error clearing rate limit:', error);
    return false;
  }
};

// Get rate limit info
const getRateLimitInfo = async (identifier, type = 'default') => {
  try {
    const key = `rate_limit:${type}:${identifier}`;
    const currentCount = await redisUtils.get(key) || 0;
    const maxRequests = rateLimitConfig.maxRequests[type] || rateLimitConfig.maxRequests.default;
    
    return {
      current: currentCount,
      limit: maxRequests,
      remaining: Math.max(0, maxRequests - currentCount),
      resetTime: Math.ceil(Date.now() / 1000) + Math.ceil(rateLimitConfig.windowMs / 1000)
    };
  } catch (error) {
    logger.error('Error getting rate limit info:', error);
    return null;
  }
};

module.exports = {
  rateLimiters,
  userRateLimit,
  clearRateLimit,
  getRateLimitInfo,
  rateLimitConfig
}; 