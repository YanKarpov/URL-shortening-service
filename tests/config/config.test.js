module.exports = {
  // Таймауты запросов
  timeouts: {
    short: 5000,
    medium: 10000,
    long: 30000
  },
  
  // HTTP статус коды
  statusCodes: {
    success: 200,
    redirect: 302,
    badRequest: 400,
    serverError: 500
  },
  
  // Тестовые URL для разных сценариев
  testUrls: {
    valid: [
      "https://example.com",
      "https://google.com",
      "https://github.com",
      "https://stackoverflow.com"
    ],
    invalid: [
      "htp://badurl",
      "not-a-url",
      "http://",
      "https://",
      "ftp://example.com"
    ],
    special: [
      "https://example.com/page?query=1&other=2#section",
      "https://sub.domain.co.uk/path/to/resource",
      "https://user:pass@example.com:8080/path"
    ],
    edgeCases: {
      long: "https://example.com/" + "a".repeat(1000),
      cyrillic: "https://пример.рф",
      unicode: "https://münchen.de",
      withSpaces: "https://example.com/path with spaces",
      empty: ""  
    }
  },
  
  // Ожидаемые сообщения от сервера
  expectedMessages: {
    urlRequired: "URL не указан",
    invalidUrl: "Неверный URL",
    serverError: "Ошибка сервера"
  },
  
  // Регулярные выражения для валидации
  patterns: {
    shortId: /\d{8}-\d{4}/,
    httpStatus: /^[1-5]\d{2}$/,
    htmlForm: /<form/
  },
  
  environments: {
    test: {
      baseUrl: "http://localhost:3999"  
    }
  },
  
  // Вспомогательные методы
  helpers: {
    getRandomValidUrl: function() {
      const config = require('./config.test.js');
      const urls = config.testUrls.valid;
      return urls[Math.floor(Math.random() * urls.length)];
    },
    
    getRandomInvalidUrl: function() {
      const config = require('./config.test.js');
      const urls = config.testUrls.invalid;
      return urls[Math.floor(Math.random() * urls.length)];
    },
    
    generateUniqueUrl: function() {
      return `https://example.com/test-${Date.now()}`;
    },
    
    extractShortId: function(text) {
      const config = require('./config.test.js');
      const match = text.match(config.patterns.shortId);
      return match ? match[0] : null;
    }
  },
  
  validators: {
    // Валидация успешного создания короткой ссылки
    validateShortUrlCreation: function(response) {
      const config = require('./config.test.js');
      const validations = [
        {
          check: () => response.statusCode === config.statusCodes.success,
          message: `Ожидаемый статус ${config.statusCodes.success}, но вышло ${response.statusCode}`
        },
        {
          check: () => config.patterns.shortId.test(response.text),
          message: `Ответ не содержит шаблон короткого ID: ${response.text}`
        },
        {
          check: () => response.text.length > 0,
          message: 'Ответ не должен быть пустым'
        }
      ];
      
      return this.runValidations(validations);
    },
    
    // Валидация ошибки валидации URL
    validateUrlError: function(response, expectedMessage) {
      const config = require('./config.test.js');
      const validations = [
        {
          check: () => response.statusCode === config.statusCodes.badRequest,
          message: `Ожидаемый статус ${config.statusCodes.badRequest}, получен ${response.statusCode}`
        },
        {
          check: () => response.text.includes(expectedMessage),
          message: `Ожидаемое сообщение "${expectedMessage}", получено: ${response.text}`
        }
      ];
      
      return this.runValidations(validations);
    },
    
    // Валидация редиректа
    validateRedirect: function(response, expectedLocation) {
      const config = require('./config.test.js');
      const validations = [
        {
          check: () => response.statusCode === config.statusCodes.redirect,
          message: `Ожидаемый статус редиректа ${config.statusCodes.redirect}, получен ${response.statusCode}`
        },
        {
          check: () => response.headers.location === expectedLocation,
          message: `Ожидаемый location ${expectedLocation}, получен ${response.headers.location}`
        }
      ];
      
      return this.runValidations(validations);
    },
    
    // Валидация главной страницы
    validateMainPage: function(response) {
      const config = require('./config.test.js');
      const validations = [
        {
          check: () => response.statusCode === config.statusCodes.success,
          message: `Ожидаемый статус ${config.statusCodes.success}, получен ${response.statusCode}`
        },
        {
          check: () => config.patterns.htmlForm.test(response.text),
          message: 'Главная страница должна содержать HTML форму'
        }
      ];
      
      return this.runValidations(validations);
    },
    
    // Валидация сетевой ошибки
    validateNetworkError: function(error) {
      const validations = [
        {
          check: () => error !== null && error !== undefined,
          message: 'Ожидалась сетевая ошибка, но её нет'
        },
        {
          check: () => typeof error.message === 'string',
          message: 'Ошибка должна содержать сообщение'
        }
      ];
      
      return this.runValidations(validations);
    },
    
    // Вспомогательный метод для запуска валидаций
    runValidations: function(validations) {
      const errors = [];
      validations.forEach(validation => {
        if (!validation.check()) {
          errors.push(validation.message);
        }
      });
      return {
        isValid: errors.length === 0,
        errors: errors
      };
    }
  },
  
  // Настройки для Allure отчетов
  allure: {
    project: "URL Shortener API",
    baseUrl: process.env.BASE_URL || "http://localhost:3000"
  }
};