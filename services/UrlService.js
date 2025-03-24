class UrlService {
  constructor(storageService) {
    this.storageService = storageService;
  }

  async createShortUrl(originalUrl, generateShortUrl) {
    const shortUrl = generateShortUrl();
    await this.storageService.save(shortUrl, originalUrl);
    return shortUrl;
  }

  async getOriginalUrl(shortUrl) {
    return await this.storageService.get(shortUrl);
  }
}

module.exports = UrlService;
