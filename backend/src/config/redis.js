const { createClient } = require('redis');

class RedisClient {
  constructor() {
    this.client = null;
    this.isConnected = false;
  }

  async connect() {
    // Determine the Redis URL based on the environment
    // Use the Docker container name 'redis' when running via docker-compose
    // Otherwise rely on REDIS_URL from .env or default to localhost
    const redisUrl = process.env.REDIS_URL || 
      (process.env.NODE_ENV === 'production' && !process.env.RAILWAY_ENVIRONMENT_NAME 
        ? 'redis://redis:6379' 
        : 'redis://127.0.0.1:6379');

    this.client = createClient({
      url: redisUrl,
    });

    this.client.on('error', (err) => {
      console.error('❌ Redis Client Error:', err.message);
      this.isConnected = false;
    });

    this.client.on('connect', () => {
      this.isConnected = true;
    });

    this.client.on('reconnecting', () => {
    });

    this.client.on('ready', () => {
      this.isConnected = true;
    });

    try {
      await this.client.connect();
    } catch (error) {
      console.error('Failed to initialize Redis connection:', error.message);
      // We don't throw the error so the app can start even if memory cache is down
      // Caching middlewares should fail gracefully.
    }
  }

  getClient() {
    return this.client;
  }

  isReady() {
    return this.isConnected;
  }
}

const redisInstance = new RedisClient();
module.exports = redisInstance;
