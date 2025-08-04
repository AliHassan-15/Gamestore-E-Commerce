const { redisUtils } = require('../../config/redis/config');
const { logger } = require('../../utils/logger');

// Cache configuration
const cacheConfig = {
  defaultTTL: 3600, // 1 hour
  shortTTL: 300,    // 5 minutes
  longTTL: 86400,   // 24 hours
  userSpecificTTL: 1800 // 30 minutes for user-specific data
};

// Generate cache key
const generateCacheKey = (req, prefix = 'api') => {
  const userId = req.user ? req.user.id : 'anonymous';
  const path = req.originalUrl || req.url;
  const query = JSON.stringify(req.query);
  const params = JSON.stringify(req.params);
  
  return `${prefix}:${userId}:${path}:${query}:${params}`;
};

// Cache middleware
const cache = (ttl = cacheConfig.defaultTTL, keyPrefix = 'api') => {
  return async (req, res, next) => {
    try {
      // Skip caching for non-GET requests
      if (req.method !== 'GET') {
        return next();
      }

      // Skip caching for authenticated admin requests
      if (req.user && req.user.role === 'admin') {
        return next();
      }

      const cacheKey = generateCacheKey(req, keyPrefix);
      
      // Try to get cached response
      const cachedResponse = await redisUtils.get(cacheKey);
      
      if (cachedResponse) {
        logger.debug(`Cache hit for key: ${cacheKey}`);
        
        // Set cache headers
        res.set({
          'X-Cache': 'HIT',
          'X-Cache-Key': cacheKey
        });
        
        return res.json(cachedResponse);
      }

      // Cache miss - store original send method
      const originalSend = res.json;
      
      // Override res.json to cache the response
      res.json = function(data) {
        // Restore original method
        res.json = originalSend;
        
        // Cache the response
        redisUtils.set(cacheKey, data, ttl).catch(err => {
          logger.error('Error caching response:', err);
        });
        
        // Set cache headers
        res.set({
          'X-Cache': 'MISS',
          'X-Cache-Key': cacheKey,
          'X-Cache-TTL': ttl
        });
        
        // Send the response
        return originalSend.call(this, data);
      };
      
      next();
    } catch (error) {
      logger.error('Cache middleware error:', error);
      next();
    }
  };
};

// Specific cache middlewares
const cacheMiddleware = {
  // Default cache (1 hour)
  default: cache(cacheConfig.defaultTTL, 'api'),
  
  // Short cache (5 minutes)
  short: cache(cacheConfig.shortTTL, 'api:short'),
  
  // Long cache (24 hours)
  long: cache(cacheConfig.longTTL, 'api:long'),
  
  // User-specific cache (30 minutes)
  userSpecific: cache(cacheConfig.userSpecificTTL, 'api:user'),
  
  // Products cache (1 hour)
  products: cache(cacheConfig.defaultTTL, 'products'),
  
  // Categories cache (24 hours)
  categories: cache(cacheConfig.longTTL, 'categories'),
  
  // Reviews cache (30 minutes)
  reviews: cache(cacheConfig.userSpecificTTL, 'reviews')
};

// Clear cache by pattern
const clearCache = async (pattern) => {
  try {
    // Note: This is a simplified version. In production, you'd use SCAN
    // to iterate through keys matching the pattern
    logger.info(`Clearing cache pattern: ${pattern}`);
    
    // For now, we'll clear specific keys
    const keysToClear = [
      'products:*',
      'categories:*',
      'reviews:*',
      'api:products:*',
      'api:categories:*'
    ];
    
    for (const key of keysToClear) {
      if (key.includes(pattern) || pattern === '*') {
        await redisUtils.del(key);
      }
    }
    
    return true;
  } catch (error) {
    logger.error('Error clearing cache:', error);
    return false;
  }
};

// Clear user-specific cache
const clearUserCache = async (userId) => {
  try {
    const patterns = [
      `api:user:${userId}:*`,
      `api:short:${userId}:*`,
      `api:long:${userId}:*`
    ];
    
    for (const pattern of patterns) {
      await clearCache(pattern);
    }
    
    logger.info(`Cleared cache for user: ${userId}`);
    return true;
  } catch (error) {
    logger.error('Error clearing user cache:', error);
    return false;
  }
};

// Cache invalidation middleware
const invalidateCache = (patterns = []) => {
  return async (req, res, next) => {
    try {
      // Store original send method
      const originalSend = res.json;
      
      // Override res.json to invalidate cache after successful response
      res.json = function(data) {
        // Restore original method
        res.json = originalSend;
        
        // Invalidate cache patterns
        if (data.success && patterns.length > 0) {
          patterns.forEach(pattern => {
            clearCache(pattern).catch(err => {
              logger.error(`Error invalidating cache pattern ${pattern}:`, err);
            });
          });
        }
        
        // Send the response
        return originalSend.call(this, data);
      };
      
      next();
    } catch (error) {
      logger.error('Cache invalidation middleware error:', error);
      next();
    }
  };
};

// Get cache statistics
const getCacheStats = async () => {
  try {
    // This is a simplified version. In production, you'd use INFO command
    // to get detailed Redis statistics
    return {
      status: 'active',
      patterns: {
        'api:*': 'General API cache',
        'products:*': 'Product cache',
        'categories:*': 'Category cache',
        'reviews:*': 'Review cache'
      },
      config: cacheConfig
    };
  } catch (error) {
    logger.error('Error getting cache stats:', error);
    return null;
  }
};

// Warm up cache with frequently accessed data
const warmupCache = async () => {
  try {
    logger.info('🔥 Warming up cache...');
    
    const { Product, Category } = require('../../models');
    
    // Cache featured products
    const featuredProducts = await Product.findAll({
      where: { is_featured: true, is_active: true },
      limit: 10
    });
    
    await redisUtils.set('products:featured', featuredProducts, cacheConfig.defaultTTL);
    
    // Cache categories
    const categories = await Category.findAll({
      where: { is_active: true },
      include: [
        {
          model: require('../../models').Subcategory,
          as: 'subcategories',
          where: { is_active: true },
          required: false
        }
      ]
    });
    
    await redisUtils.set('categories:all', categories, cacheConfig.longTTL);
    
    logger.info('✅ Cache warmup completed');
  } catch (error) {
    logger.error('Error warming up cache:', error);
  }
};

module.exports = {
  cacheMiddleware,
  cache,
  clearCache,
  clearUserCache,
  invalidateCache,
  getCacheStats,
  warmupCache,
  cacheConfig
}; 