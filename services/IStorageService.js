class IStorageService {
    async save(shortUrl, originalUrl) {
        throw new Error("Метод save() должен быть реализован");
    }

    async get(shortUrl) {
        throw new Error("Метод get() должен быть реализован");
    }
}

module.exports = IStorageService;
