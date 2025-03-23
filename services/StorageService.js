const redisClient = require("../config/redis");

class StorageService {
  async set(key, value) {
    await redisClient.set(key, value);
  }

  async get(key) {
    return await redisClient.get(key);
  }
}

module.exports = new StorageService();
