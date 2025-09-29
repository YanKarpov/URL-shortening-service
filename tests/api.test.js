const request = require('supertest');
const allure = require("allure-js-commons");
const baseUrl = 'http://localhost:3000'; 

describe('URL Shortener API Tests via Docker', () => {

  // 1. Создание короткой ссылки с валидным URL
  it('Создание короткой ссылки с валидным URL', async () => {
    await allure.epic("URL Shortener API");
    await allure.feature("Создание ссылок");
    await allure.story("Валидные URL");
    await allure.severity("critical");

    await allure.step('Отправка POST запроса на /create с валидным URL', async () => {
      const res = await request(baseUrl)
        .post('/create')
        .type('form')        
        .send({ url: 'https://example.com' });
      
      await allure.attachment("Ответ сервера", res.text, "text/plain");
      
      expect(res.statusCode).toBe(200);
      expect(res.text).toMatch(/\d{8}-\d{4}/);
    });
  });

  // 2. Создание короткой ссылки с невалидным URL
  it('Создание короткой ссылки с невалидным URL', async () => {
    await allure.feature("Создание ссылок");
    await allure.story("Невалидные URL");
    await allure.severity("normal");

    await allure.step('Отправка POST запроса с неправильным URL', async () => {
      const res = await request(baseUrl)
        .post('/create')
        .type('form')
        .send({ url: 'htp://badurl' });
      
      await allure.attachment("Ответ сервера", res.text, "text/plain");
      expect([400, 500]).toContain(res.statusCode);
    });
  });

  // 3. Создание пустой ссылки
  it('Создание пустой ссылки', async () => {
    await allure.feature("Создание ссылок");
    await allure.story("Пустые URL");
    await allure.severity("normal");

    await allure.step('Отправка пустого URL', async () => {
      const res = await request(baseUrl)
        .post('/create')
        .type('form')
        .send({ url: '' });
      
      await allure.attachment("Ответ сервера", res.text, "text/plain");
      expect(res.statusCode).toBe(400);
      expect(res.text).toContain('URL не указан');
    });
  });

  // 4. Дублирование URL
  it('Дублирование одного и того же URL', async () => {
    await allure.feature("Создание ссылок");
    await allure.story("Дублирование");
    await allure.severity("normal");

    await allure.step('Создание ссылки дважды', async () => {
      const url = 'https://example.com';
      const res1 = await request(baseUrl).post('/create').type('form').send({ url });
      const res2 = await request(baseUrl).post('/create').type('form').send({ url });

      await allure.attachment("Ответ сервера 1", res1.text, "text/plain");
      await allure.attachment("Ответ сервера 2", res2.text, "text/plain");

      expect(res1.statusCode).toBe(200);
      expect(res2.statusCode).toBe(200);
    });
  });

  // 5. Проверка формата сокращённой ссылки
  it('Формат короткой ссылки YYYYMMDD-HHMM', async () => {
    await allure.feature("Формат ссылок");
    await allure.severity("minor");

    await allure.step('Проверка формата короткой ссылки', async () => {
      const res = await request(baseUrl).post('/create').type('form').send({ url: 'https://example.com' });
      const match = res.text.match(/\d{8}-\d{4}/);

      await allure.attachment("Ответ сервера", res.text, "text/plain");
      expect(match).not.toBeNull();
    });
  });

  // 6. Переход по сокращённой ссылке
  it('Редирект по короткой ссылке', async () => {
    await allure.feature("Редиректы");
    await allure.severity("critical");

    await allure.step('Создание короткой ссылки и проверка редиректа', async () => {
      const createRes = await request(baseUrl).post('/create').type('form').send({ url: 'https://example.com' });
      const shortUrlMatch = createRes.text.match(/\d{8}-\d{4}/);
      expect(shortUrlMatch).not.toBeNull();
      const shortUrl = shortUrlMatch[0];

      const redirectRes = await request(baseUrl)
        .get(`/${shortUrl}`)
        .redirects(0);

      await allure.attachment("Заголовки редиректа", JSON.stringify(redirectRes.headers, null, 2), "application/json");
      expect(redirectRes.statusCode).toBe(302);
      expect(redirectRes.headers.location).toBe('https://example.com');
    });
  });

  // 7. Попытка вставки очень длинного URL
  it('Очень длинный URL', async () => {
    await allure.feature("Создание ссылок");
    await allure.story("Длинные URL");
    await allure.severity("normal");

    await allure.step('Создание короткой ссылки с очень длинным URL', async () => {
      const longUrl = 'https://example.com/' + 'a'.repeat(3000);
      const res = await request(baseUrl).post('/create').type('form').send({ url: longUrl });
      
      await allure.attachment("Ответ сервера", res.text, "text/plain");
      expect([200, 500]).toContain(res.statusCode);
    });
  });

  // 8. Использование спецсимволов в URL
  it('URL с спецсимволами', async () => {
    await allure.feature("Создание ссылок");
    await allure.story("Спецсимволы");
    await allure.severity("normal");

    await allure.step('Создание короткой ссылки с URL, содержащим спецсимволы', async () => {
      const url = 'https://example.com/page?query=1&other=#section';
      const res = await request(baseUrl).post('/create').type('form').send({ url });
      expect(res.statusCode).toBe(200);

      const shortUrlMatch = res.text.match(/\d{8}-\d{4}/);
      expect(shortUrlMatch).not.toBeNull();

      const shortUrl = shortUrlMatch[0];
      const redirectRes = await request(baseUrl)
        .get(`/${shortUrl}`)
        .redirects(0);

      await allure.attachment("Заголовки редиректа", JSON.stringify(redirectRes.headers, null, 2), "application/json");
      expect(redirectRes.statusCode).toBe(302);
      expect(redirectRes.headers.location).toBe(url);
    });
  });

  // 9. Повторное обновление страницы после создания
  it('Обновление страницы после создания ссылки', async () => {
    await allure.feature("UI тесты");
    await allure.severity("minor");

    await allure.step('Проверка повторного доступа к главной странице', async () => {
      const res = await request(baseUrl).post('/create').type('form').send({ url: 'https://example.com' });
      expect(res.statusCode).toBe(200);

      const reloadRes = await request(baseUrl).get('/');
      expect(reloadRes.statusCode).toBe(200);
      expect(reloadRes.text).toContain('<form');
    });
  });

  // 10. Проверка работы без подключения к интернету
  it('Сервер недоступен / ошибка сети', async () => {
    await allure.feature("Обработка ошибок");
    await allure.severity("normal");

    await allure.step('Проверка недоступного сервера', async () => {
      const badBaseUrl = 'http://localhost:3999';
      try {
        await request(badBaseUrl).post('/create').type('form').send({ url: 'https://example.com' });
      } catch (err) {
        await allure.attachment("Ошибка", err.message, "text/plain");
        expect(err).toBeTruthy(); 
      }
    });
  });

  // 11. Тестируем кириллицу
  it('Создание короткой ссылки с URL на кириллице', async () => {
    await allure.feature("Создание ссылок");
    await allure.story("Кириллические URL");
    await allure.severity("normal");

    await allure.step('Создание ссылки с кириллическим URL', async () => {
      const cyrillicUrl = 'https://пример.рф';
      const res = await request(baseUrl)
        .post('/create')
        .type('form')
        .send({ url: cyrillicUrl });

      await allure.attachment("Ответ сервера", res.text, "text/plain");
      expect(res.statusCode).toBe(400); 
      expect(res.text).toContain('Неверный URL'); 
    });
  });
});