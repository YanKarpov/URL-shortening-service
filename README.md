# Сервис сокращения URL с Docker

## Описание проекта
Это приложение для сокращения URL с использованием Docker и Redis. Приложение позволяет сократить URL и создать короткую ссылку, которая будет перенаправлять на оригинальный ресурс.

## Описание структуры файлов:
- **Dockerfile** — используется для создания Docker-образа приложения.
- **docker-compose.yml** — конфигурация Docker Compose, включающая сервисы Redis и приложение.
- **server.js** — основной серверный файл на Node.js, реализующий логику сокращения URL.
- **views/** — каталог с шаблонами для отображения страниц (используется EJS).

## Требования
- Установленный Docker для контейнеризации приложения.
- Node.js — для выполнения серверной логики приложения.

Убедитесь, что все зависимости установлены перед запуском приложения.

## Установка и запуск:

1. Клонируйте репозиторий:
   ```bash
   git clone https://github.com/YanKarpov/URL-shortening-service.git
   cd URL-shortening-service

2. Соберите и запустите контейнеры:
   ```bash
   docker-compose up --build

3. Перейдите в браузер и откройте http://localhost:3000.

4. Используйте интерфейс для создания сокращённых ссылок.

**P.S.** Redis автоматически устанавливается и запускается вместе с приложением благодаря моим настройкам в `docker-compose.yml`. Вам не нужно устанавливать Redis вручную, он будет работать как отдельный сервис внутри контейнера.

