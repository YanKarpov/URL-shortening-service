const storageService = require("./StorageService");

async function createShortUrl(originalUrl, generateShortUrl) {
  const shortUrl = generateShortUrl();
  await storageService.set(shortUrl, originalUrl);
  return shortUrl;
}

async function getOriginalUrl(shortUrl) {
  return await storageService.get(shortUrl);
}

module.exports = { createShortUrl, getOriginalUrl };
