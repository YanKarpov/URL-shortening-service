const IStorageService = require("./IStorageService");
const redisClient = require("../config/redis");

class RedisStorageService extends IStorageService {
    async save(shortUrl, originalUrl) {
        await redisClient.set(shortUrl, originalUrl);
    }

    async get(shortUrl) {
        return await redisClient.get(shortUrl);
    }
}

module.exports = new RedisStorageService();
