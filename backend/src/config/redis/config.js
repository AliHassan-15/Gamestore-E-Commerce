const redis = require('redis');
const { logger } = require('../../utils/logger');

// Redis configuration
const redisConfig = {
  host: process.env.REDIS_HOST || 'localhost',
  port: process.env.REDIS_PORT || 6379,
  password: process.env.REDIS_PASSWORD || null,
  db: process.env.REDIS_DB || 0,
  retry_strategy: (options) => {
    if (options.error && options.error.code === 'ECONNREFUSED') {
      // End reconnecting on a specific error and flush all commands with a individual error
      return new Error('The server refused the connection');
    }
    if (options.total_retry_time > 1000 * 60 * 60) {
      // End reconnecting after a specific timeout and flush all commands with a individual error
      return new Error('Retry time exhausted');
    }
    if (options.attempt > 10) {
      // End reconnecting with built in error
      return undefined;
    }
    // Reconnect after
    return Math.min(options.attempt * 100, 3000);
  }
};

// Create Redis client
const client = redis.createClient(redisConfig);

// Redis client event handlers
client.on('connect', () => {
  logger.info('✅ Redis client connected');
});

client.on('ready', () => {
  logger.info('✅ Redis client ready');
});

client.on('error', (err) => {
  logger.error('❌ Redis client error:', err);
});

client.on('end', () => {
  logger.info('🔌 Redis client disconnected');
});

// Redis utility functions
const redisUtils = {
  // Set key with expiration
  set: async (key, value, expireSeconds = 3600) => {
    try {
      const stringValue = typeof value === 'object' ? JSON.stringify(value) : value;
      await client.setEx(key, expireSeconds, stringValue);
      return true;
    } catch (error) {
      logger.error('Redis set error:', error);
      return false;
    }
  },

  // Get key
  get: async (key) => {
    try {
      const value = await client.get(key);
      if (!value) return null;
      
      // Try to parse as JSON, if fails return as string
      try {
        return JSON.parse(value);
      } catch {
        return value;
      }
    } catch (error) {
      logger.error('Redis get error:', error);
      return null;
    }
  },

  // Delete key
  del: async (key) => {
    try {
      await client.del(key);
      return true;
    } catch (error) {
      logger.error('Redis del error:', error);
      return false;
    }
  },

  // Set hash field
  hset: async (key, field, value) => {
    try {
      const stringValue = typeof value === 'object' ? JSON.stringify(value) : value;
      await client.hSet(key, field, stringValue);
      return true;
    } catch (error) {
      logger.error('Redis hset error:', error);
      return false;
    }
  },

  // Get hash field
  hget: async (key, field) => {
    try {
      const value = await client.hGet(key, field);
      if (!value) return null;
      
      try {
        return JSON.parse(value);
      } catch {
        return value;
      }
    } catch (error) {
      logger.error('Redis hget error:', error);
      return null;
    }
  },

  // Get all hash fields
  hgetall: async (key) => {
    try {
      const hash = await client.hGetAll(key);
      const result = {};
      
      for (const [field, value] of Object.entries(hash)) {
        try {
          result[field] = JSON.parse(value);
        } catch {
          result[field] = value;
        }
      }
      
      return result;
    } catch (error) {
      logger.error('Redis hgetall error:', error);
      return null;
    }
  },

  // Increment counter
  incr: async (key) => {
    try {
      return await client.incr(key);
    } catch (error) {
      logger.error('Redis incr error:', error);
      return null;
    }
  },

  // Set key with expiration
  setex: async (key, seconds, value) => {
    try {
      const stringValue = typeof value === 'object' ? JSON.stringify(value) : value;
      await client.setEx(key, seconds, stringValue);
      return true;
    } catch (error) {
      logger.error('Redis setex error:', error);
      return false;
    }
  },

  // Check if key exists
  exists: async (key) => {
    try {
      const result = await client.exists(key);
      return result === 1;
    } catch (error) {
      logger.error('Redis exists error:', error);
      return false;
    }
  },

  // Flush all keys
  flushall: async () => {
    try {
      await client.flushAll();
      return true;
    } catch (error) {
      logger.error('Redis flushall error:', error);
      return false;
    }
  }
};

module.exports = {
  client,
  redisUtils
}; 