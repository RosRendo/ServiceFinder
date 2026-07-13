const redisClient = require('../config/redis');

/**
 * Middleware to cache HTTP GET responses.
 * @param {number} duration - Seconds to cache the response.
 */
const cacheData = (duration = 300) => {
  return async (req, res, next) => {
    // Only cache GET requests
    if (req.method !== 'GET') {
      return next();
    }

    if (!redisClient.isReady()) {
      return next(); // Fallback to DB if Redis is down
    }

    try {
      const client = redisClient.getClient();
      
      // We use the exact URL as the cache key. You can also append userId if caching user-specific data.
      const key = `cache:${req.originalUrl || req.url}`;
      
      const cachedResponse = await client.get(key);

      if (cachedResponse) {
        // Return cached response instantly
        return res.status(200).json(JSON.parse(cachedResponse));
      }


      // Hijack the res.json method to intercept the response output before it sends
      const originalJson = res.json.bind(res);
      
      res.json = (body) => {
        // Only cache successful requests
        if (res.statusCode >= 200 && res.statusCode < 300) {
          // Fire and forget caching action
          client.setEx(key, duration, JSON.stringify(body))
            .catch(err => console.error('Redis cache saving error:', err));
        }
        
        // Call the original res.json to successfully send data to the user
        return originalJson(body);
      };

      next();
    } catch (error) {
      console.error('Cache middleware error:', error);
      next(); // Fail gracefully and proceed without cache
    }
  };
};

/**
 * Utility to invalidate cache dynamically.
 * Useful when an item is created/updated/deleted.
 * @param {string} pattern - Key pattern to delete (e.g., 'cache:/api/companies*')
 */
const clearCache = async (pattern) => {
  if (!redisClient.isReady()) return;

  try {
    const client = redisClient.getClient();
    // Note: KEYS is okay for basic/local usage.
    // For massive scale, switch to SCAN pattern matching to prevent thread blocking.
    const keys = await client.keys(pattern);
    if (keys && keys.length > 0) {
      await client.del(keys);
    }
  } catch (error) {
    console.error('Error clearing cache:', error);
  }
};

module.exports = {
  cacheData,
  clearCache
};
