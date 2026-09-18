# Каталог книг

Фронтенд каталога книг по OpenAPI-спеке `openapi/book.yaml`. Yii2 не входит в сдачу: контракт закрывает React-клиент и локальный mock API.

Демо: [https://reasonov.github.io/green-api-test/](https://reasonov.github.io/green-api-test/)

Репозиторий: [https://github.com/reasonov/green-api-test](https://github.com/reasonov/green-api-test)

## Стек

- React + TypeScript + Vite
- React Router, TanStack Query, react-hook-form, zod
- Клиент API: `openapi-typescript` + `openapi-fetch`
- Mock: Hono на `/api/v1` локально; на GitHub Pages — тот же контракт в браузере

## Запуск

```bash
npm install
npm run dev
```

Откройте [http://localhost:5173](http://localhost:5173). Vite проксирует `/api` и `/uploads` на mock `http://127.0.0.1:3001`.

Демо-пользователь: `user` / `password`.

Гость видит каталог, карточки, отчёт TOP-10 и может подписаться на автора по телефону.

## API

Клиент ходит в `/api/v1` строго по спеке:

- `POST /auth/login` — JWT
- `GET/POST /books`, `GET/PUT/PATCH/DELETE /books/{id}`
- `GET/POST /authors`, `GET/PUT/DELETE /authors/{id}`
- `GET /reports/top-authors?year=`

Создание и полная замена книги — `multipart/form-data` с обязательной обложкой. Частичное обновление — `PATCH` JSON.

Перегенерация типов:

```bash
npm run generate:api
```

Живой бэкенд: задайте `VITE_API_URL` в `.env` (см. `.env.example`).

## Подписка и SMS

В yaml нет subscribe. Это расширение ТЗ на mock:

`POST /api/v1/authors/{id}/subscriptions` — `{ "phone": "79001234567" }`, без авторизации.

После `POST /books` mock один раз на номер вызывает SMSPilot emulator. Ошибка SMS не откатывает создание книги. В консоли API будет лог `[SMSPilot]`.

Тестовый ключ эмулятора из документации SMSPilot уже стоит в `.env.example`. Реальной отправки нет.

## Скрипты

- `npm run dev` — фронт и mock
- `npm test` — vitest
- `npm run lint`
- `npm run build`
