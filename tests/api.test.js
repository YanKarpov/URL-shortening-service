const request = require('supertest');
const baseUrl = 'http://localhost:3000'; 

describe('URL Shortener API Tests via Docker', () => {

  // 1. Создание короткой ссылки с валидным URL
  it('Создание короткой ссылки с валидным URL', async () => {
    const res = await request(baseUrl)
      .post('/create')
      .type('form')        
      .send({ url: 'https://example.com' });
    expect(res.statusCode).toBe(200);
    expect(res.text).toMatch(/\d{8}-\d{4}/); // формат YYYYMMDD-HHMM
  });

  // 2. Создание короткой ссылки с невалидным URL
  it('Создание короткой ссылки с невалидным URL', async () => {
    const res = await request(baseUrl)
      .post('/create')
      .type('form')
      .send({ url: 'htp://badurl' });
    expect([400, 500]).toContain(res.statusCode);
  });

  // 3. Создание пустой ссылки
  it('Создание пустой ссылки', async () => {
    const res = await request(baseUrl)
      .post('/create')
      .type('form')
      .send({ url: '' });
    expect(res.statusCode).toBe(400);
    expect(res.text).toContain('URL не указан');
  });

  // 4. Дублирование URL
  it('Дублирование одного и того же URL', async () => {
    const url = 'https://example.com';
    const res1 = await request(baseUrl).post('/create').type('form').send({ url });
    const res2 = await request(baseUrl).post('/create').type('form').send({ url });
    expect(res1.statusCode).toBe(200);
    expect(res2.statusCode).toBe(200);
  });

  // 5. Проверка формата сокращённой ссылки
  it('Формат короткой ссылки YYYYMMDD-HHMM', async () => {
    const res = await request(baseUrl).post('/create').type('form').send({ url: 'https://example.com' });
    const match = res.text.match(/\d{8}-\d{4}/);
    expect(match).not.toBeNull();
  });

  // 6. Переход по сокращённой ссылке
  it('Редирект по короткой ссылке', async () => {
    const createRes = await request(baseUrl).post('/create').type('form').send({ url: 'https://example.com' });
    const shortUrlMatch = createRes.text.match(/\d{8}-\d{4}/);
    expect(shortUrlMatch).not.toBeNull();
    const shortUrl = shortUrlMatch[0];

    const redirectRes = await request(baseUrl)
      .get(`/${shortUrl}`)
      .redirects(0); // не следуем за редиректом
    expect(redirectRes.statusCode).toBe(302);
    expect(redirectRes.headers.location).toBe('https://example.com');
  });

  // 7. Попытка вставки очень длинного URL
  it('Очень длинный URL', async () => {
    const longUrl = 'https://example.com/' + 'a'.repeat(3000);
    const res = await request(baseUrl).post('/create').type('form').send({ url: longUrl });
    expect([200, 500]).toContain(res.statusCode);
  });

  // 8. Использование спецсимволов в URL
  it('URL с спецсимволами', async () => {
    const url = 'https://example.com/page?query=1&other=#section';
    const res = await request(baseUrl).post('/create').type('form').send({ url });
    expect(res.statusCode).toBe(200);
    const shortUrlMatch = res.text.match(/\d{8}-\d{4}/);
    expect(shortUrlMatch).not.toBeNull();

    const shortUrl = shortUrlMatch[0];
    const redirectRes = await request(baseUrl)
      .get(`/${shortUrl}`)
      .redirects(0);
    expect(redirectRes.statusCode).toBe(302);
    expect(redirectRes.headers.location).toBe(url);
  });

  // 9. Повторное обновление страницы после создания
  it('Обновление страницы после создания ссылки', async () => {
    const res = await request(baseUrl).post('/create').type('form').send({ url: 'https://example.com' });
    expect(res.statusCode).toBe(200);

    const reloadRes = await request(baseUrl).get('/');
    expect(reloadRes.statusCode).toBe(200);
    expect(reloadRes.text).toContain('<form');
  });

  // 10. Проверка работы без подключения к интернету
  it('Сервер недоступен / ошибка сети', async () => {
    const badBaseUrl = 'http://localhost:3999'; // порт, где сервер не слушает
    try {
      await request(badBaseUrl).post('/create').type('form').send({ url: 'https://example.com' });
    } catch (err) {
      expect(err).toBeTruthy(); 
    }
  });

//   11. Тестируем кириллицу
  it('Создание короткой ссылки с URL на кириллице', async () => {
    const cyrillicUrl = 'https://пример.рф';

    const res = await request(baseUrl)
      .post('/create')
      .type('form')
      .send({ url: cyrillicUrl });


    expect(res.statusCode).toBe(400); 

    expect(res.text).toContain('Неверный URL'); 
  });

});
