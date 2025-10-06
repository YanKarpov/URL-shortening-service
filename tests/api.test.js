const request = require("supertest");
const allure = require("allure-js-commons");
const baseUrl = process.env.BASE_URL || "http://localhost:3000";
const config = require('./config/config.test.js');

const makeCreateRequest = (url, timeout = config.timeouts.medium) => {
  return request(baseUrl)
    .post("/create")
    .set('Content-Type', 'application/x-www-form-urlencoded') // 
    .send({ url })
    .timeout(timeout);
};

describe("URL Shortener API - Health Checks", () => {
  let testStartTime;

  beforeAll(async () => {
    testStartTime = Date.now();
    await allure.step("Health check сервера", async () => {
      const healthCheck = await request(baseUrl)
        .get("/")
        .timeout(config.timeouts.short)
        .catch(() => null);
      
      if (!healthCheck || healthCheck.statusCode !== 200) {
        throw new Error(`Сервер недоступен: ${baseUrl}`);
      }
    });
  });

  afterAll(async () => {
    await allure.step("Финальная статистика", async () => {
      const duration = Date.now() - testStartTime;
      await allure.attachment("Статистика тестов", JSON.stringify({
        testDuration: `${duration}ms`,
        baseUrl: baseUrl,
        environment: process.env.NODE_ENV || 'development'
      }, null, 2), "application/json");
    });
  });

  it("Сервер должен быть доступен", async () => {
    const res = await request(baseUrl)
      .get("/")
      .timeout(config.timeouts.short);
    
    expect(res.statusCode).toBe(200);
  });
});

describe("URL Shortener API - Создание ссылок", () => {
  let createdUrls = [];

  beforeEach(() => {
    createdUrls = [];
  });

  afterEach(async () => {
    if (createdUrls.length > 0) {
      await allure.step("Очистка тестовых данных", async () => {
        await allure.attachment("Созданные URL", JSON.stringify(createdUrls, null, 2), "application/json");
      });
    }
  });

  describe("Валидные URL", () => {
    const getTestUrl = (path = '') => `https://test-domain.example${path}`;

    it("Создание короткой ссылки с валидным URL", async () => {
      await allure.epic("URL Shortener API");
      await allure.feature("Создание ссылок");
      await allure.story("Валидные URL");
      await allure.severity("critical");

      const testUrl = getTestUrl('/valid-path');
      const res = await makeCreateRequest(testUrl);

      await allure.attachment("Ответ сервера", res.text, "text/plain");

      expect(res.statusCode).toBe(config.statusCodes.success);
      
      const shortId = config.helpers.extractShortId(res.text);
      
      expect(shortId).not.toBeNull();
      expect(shortId).toMatch(config.patterns.shortId);
      expect(shortId).toHaveLength(13);
      
      createdUrls.push({ original: testUrl, short: shortId });
    });

    it("Дублирование одного и того же URL", async () => {
      await allure.feature("Создание ссылок");
      await allure.story("Дублирование");
      await allure.severity("normal");

      const url = config.helpers.generateUniqueUrl();
      
      const [res1, res2] = await Promise.all([
        makeCreateRequest(url),
        makeCreateRequest(url)
      ]);

      await allure.attachment("Ответ 1", res1.text, "text/plain");
      await allure.attachment("Ответ 2", res2.text, "text/plain");

      expect(res1.statusCode).toBe(config.statusCodes.success);
      expect(res2.statusCode).toBe(config.statusCodes.success);

      const shortId1 = config.helpers.extractShortId(res1.text);
      const shortId2 = config.helpers.extractShortId(res2.text);
      expect(shortId1).toBe(shortId2);
      
      createdUrls.push({ original: url, short: shortId1 });
    });

    it("Проверка формата короткой ссылки YYYYMMDD-HHMM", async () => {
      await allure.feature("Формат ссылок");
      await allure.severity("minor");

      const testUrl = config.helpers.getRandomValidUrl();
      const res = await makeCreateRequest(testUrl, config.timeouts.short);
      
      await allure.attachment("Ответ сервера", res.text, "text/plain");
      
      const match = res.text.match(config.patterns.shortId);
      expect(match).not.toBeNull();

      if (match) {
        const shortId = match[0];
        const [datePart, timePart] = shortId.split('-');
        
        const year = parseInt(datePart.substring(0, 4));
        const month = parseInt(datePart.substring(4, 6));
        const hours = parseInt(timePart.substring(0, 2));
        const minutes = parseInt(timePart.substring(2, 4));
        
        expect(year).toBeGreaterThanOrEqual(2020);
        expect(month).toBeGreaterThanOrEqual(1);
        expect(month).toBeLessThanOrEqual(12);
        expect(hours).toBeGreaterThanOrEqual(0);
        expect(hours).toBeLessThanOrEqual(23);
        expect(minutes).toBeGreaterThanOrEqual(0);
        expect(minutes).toBeLessThanOrEqual(59);
      }
    });
  });

  describe("Невалидные URL", () => {
    it("Создание короткой ссылки с невалидным URL", async () => {
      await allure.feature("Создание ссылок");
      await allure.story("Невалидные URL");
      await allure.severity("normal");

      const testUrl = config.helpers.getRandomInvalidUrl();
      const res = await makeCreateRequest(testUrl, config.timeouts.short);

      await allure.attachment("Ответ сервера", res.text, "text/plain");
      
      expect([config.statusCodes.badRequest, config.statusCodes.serverError])
        .toContain(res.statusCode);
    });

    it("Создание пустой ссылки", async () => {
      await allure.feature("Создание ссылок");
      await allure.story("Пустые URL");
      await allure.severity("normal");

      const res = await makeCreateRequest(config.testUrls.edgeCases.empty, config.timeouts.short);

      await allure.attachment("Ответ сервера", res.text, "text/plain");
      
      expect(res.statusCode).toBe(config.statusCodes.badRequest);
      expect(res.text).toContain(config.expectedMessages.urlRequired);
    });

    it("Очень длинный URL", async () => {
      await allure.feature("Создание ссылок");
      await allure.story("Длинные URL");
      await allure.severity("normal");

      const longUrl = "https://test-domain.example.com/" + "a".repeat(1000);
      const res = await makeCreateRequest(longUrl, config.timeouts.long);

      await allure.attachment("Ответ сервера", res.text, "text/plain");
      
      expect([config.statusCodes.success, config.statusCodes.serverError])
        .toContain(res.statusCode);
    });
  });

  describe("Специальные случаи URL", () => {
    it("URL с спецсимволами", async () => {
      await allure.feature("Создание ссылок");
      await allure.story("Спецсимволы");
      await allure.severity("normal");

      const testUrl = config.testUrls.special[0];
      const res = await makeCreateRequest(testUrl);
          
      expect(res.statusCode).toBe(config.statusCodes.success);

      const shortUrl = config.helpers.extractShortId(res.text);
      expect(shortUrl).not.toBeNull();
      
      createdUrls.push({ original: testUrl, short: shortUrl });

      const redirectRes = await request(baseUrl)
        .get(`/${shortUrl}`)
        .redirects(0)
        .timeout(config.timeouts.short);

      await allure.attachment("Заголовки редиректа", JSON.stringify(redirectRes.headers, null, 2), "application/json");
      
      expect(redirectRes.statusCode).toBe(config.statusCodes.redirect);
      expect(redirectRes.headers.location).toBe(testUrl);
    });

    it("IDN домены (кириллица)", async () => {
      await allure.feature("Создание ссылок");
      await allure.story("Кириллические URL");
      await allure.severity("normal");

      const idnUrl = config.testUrls.edgeCases.cyrillic;
      const res = await makeCreateRequest(idnUrl, config.timeouts.short);

      await allure.attachment("Ответ сервера", res.text, "text/plain");

      if (res.statusCode === config.statusCodes.success) {
        const shortUrl = config.helpers.extractShortId(res.text);
        expect(shortUrl).not.toBeNull();
        
        createdUrls.push({ original: idnUrl, short: shortUrl });

        const redirectRes = await request(baseUrl)
          .get(`/${shortUrl}`)
          .redirects(0)
          .timeout(config.timeouts.short);

        expect(redirectRes.statusCode).toBe(config.statusCodes.redirect);
        expect(redirectRes.headers.location).toBe(idnUrl);
      } else {
        expect(res.statusCode).toBe(config.statusCodes.badRequest);
        expect(res.text).toContain(config.expectedMessages.invalidUrl);
      }
    });
  });
});

describe("URL Shortener API - Редиректы", () => {
  it("Редирект по короткой ссылке", async () => {
    await allure.feature("Редиректы");
    await allure.severity("critical");

    const testUrl = "https://redirect-test.example.com";
    const createRes = await makeCreateRequest(testUrl);
          
    const shortUrl = config.helpers.extractShortId(createRes.text);
    expect(shortUrl).not.toBeNull();

    const redirectRes = await request(baseUrl)
      .get(`/${shortUrl}`)
      .redirects(0)
      .timeout(config.timeouts.short);

    await allure.attachment("Заголовки редиректа", JSON.stringify(redirectRes.headers, null, 2), "application/json");
    
    expect(redirectRes.statusCode).toBe(config.statusCodes.redirect);
    expect(redirectRes.headers.location).toBe(testUrl);
  });

  it("Редирект для несуществующей ссылки", async () => {
    const nonExistentShortUrl = "20230101-0000";
    const res = await request(baseUrl)
      .get(`/${nonExistentShortUrl}`)
      .redirects(0)
      .timeout(config.timeouts.short);

    expect([404, config.statusCodes.redirect]).toContain(res.statusCode);
  });
});

describe("URL Shortener UI Tests", () => {
  it("Главная страница должна быть доступна", async () => {
    const res = await request(baseUrl)
      .get("/")
      .timeout(config.timeouts.short);
          
    expect(res.statusCode).toBe(config.statusCodes.success);
  });

  it("Главная страница содержит форму", async () => {
    const res = await request(baseUrl)
      .get("/")
      .timeout(config.timeouts.short);

    expect(res.statusCode).toBe(config.statusCodes.success);
    
    expect(res.text).toMatch(config.patterns.htmlForm);
    expect(res.text).toMatch(/<input[^>]*name=["']url["']/);
    expect(res.text).toMatch(/<button[^>]*type=["']submit["']/);
  });

  it("Обновление страницы после создания ссылки", async () => {
    await allure.feature("UI тесты");
    await allure.severity("minor");

    const res = await makeCreateRequest("https://test-domain.example.com/ui-test");
    expect(res.statusCode).toBe(config.statusCodes.success);

    const reloadRes = await request(baseUrl)
      .get("/")
      .timeout(config.timeouts.short);
          
    expect(reloadRes.statusCode).toBe(config.statusCodes.success);
    expect(reloadRes.text).toMatch(config.patterns.htmlForm);
  });
});

describe("URL Shortener API - Обработка ошибок", () => {
  it("Сервер недоступен / ошибка сети", async () => {
    await allure.feature("Обработка ошибок");
    await allure.severity("normal");

    await allure.step("Проверка недоступного сервера", async () => {
      const nonExistentDomain = "http://this-domain-definitely-does-not-exist-12345.test";
      
      try {
        await request(nonExistentDomain)
          .post("/create")
          .set('Content-Type', 'application/x-www-form-urlencoded')
          .send({ url: "https://example.com" })
          .timeout(config.timeouts.short);
        
        throw new Error("Запрос должен был завершиться ошибкой");
      } catch (err) {
        await allure.attachment("Ошибка сети", err.message, "text/plain");
        
        expect(err).toBeTruthy();
        expect(err.message).toMatch(/ENOTFOUND|ECONNREFUSED|timeout/i);
      }
    });
  });

  it("Обработка таймаута запроса", async () => {
    try {
      await makeCreateRequest("https://example.com", 1);
      
      throw new Error("Запрос должен был завершиться таймаутом");
    } catch (err) {
      await allure.attachment("Таймаут ошибка", err.message, "text/plain");
      expect(err.message).toMatch(/timeout/i);
    }
  });
});