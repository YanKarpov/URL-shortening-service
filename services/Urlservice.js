const redisClient = require("../config/redis");

async function createShortUrl(originalUrl, generateShortUrl) {
  const shortUrl = generateShortUrl();
  await redisClient.set(shortUrl, originalUrl);
  return shortUrl;
}

async function getOriginalUrl(shortUrl) {
  return await redisClient.get(shortUrl);
}

module.exports = { createShortUrl, getOriginalUrl };
