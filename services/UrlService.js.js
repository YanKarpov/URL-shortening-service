const storageService = require("./RedisStorageService");
const storageService = require("./InMemoryStorageService");


async function createShortUrl(originalUrl, generateShortUrl) {
  const shortUrl = generateShortUrl();
  await storageService.save(shortUrl, originalUrl);
  return shortUrl;
}

async function getOriginalUrl(shortUrl) {
  return await storageService.get(shortUrl);
}

module.exports = { createShortUrl, getOriginalUrl };
