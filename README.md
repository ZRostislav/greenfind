# Greenfind Frontend

Frontend часть поисково-аналитической системы Greenfind (Angular 20).

## Что умеет приложение

- Поиск в режимах `web` и `images`.
- Отображение `knowledge_graph`, `ai_overview`, связанных запросов и пагинации.
- История поисков пользователя и сохраненные ссылки.
- Авторизация (local + OAuth callback), верификация почты, reset password.
- Админ-панель: аналитика, отчеты и управление пользователями.

## Технологии

- Angular 20 (standalone API)
- RxJS
- TailwindCSS
- Lucide Icons
- jsPDF/html2canvas (экспорт отчетов)

## Структура проекта

- `src/app/components` — UI-компоненты (поиск, auth, профиль, админка)
- `src/app/services` — работа с API и состоянием
- `src/app/guards` — защита маршрутов
- `src/app/interceptors` — авторизационный interceptor
- `src/app/validators` — переиспользуемые валидаторы форм
- `src/app/environments` — runtime API URL

## Быстрый старт

1. Установить зависимости:

```bash
npm install
```

2. Запустить dev-сервер:

```bash
npm run dev
```

3. Открыть приложение:

`https://localhost:4200`

## Переменные окружения

Фронтенд читает API адрес из `window.__env.apiUrl` (файл формируется скриптом `scripts/write-env.mjs` перед сборкой).

Если runtime-переменная не задана, используется fallback:

`http://localhost:3000/api`

## Скрипты

- `npm run dev` — локальный запуск
- `npm run build` — production build
- `npm test` — unit-тесты (Karma + Jasmine)

## Покрытие тестами (frontend)

Добавлены базовые unit-тесты на критические части:

- `AuthInterceptor` (добавление токена и очистка сессии на 401)
- `AdminService` (query params и генерация URL экспорта)
- `AuthStateService` (localStorage + lifecycle сессии)
- `passwordPolicyValidator`
- `matchFieldsValidator`

## Связь с backend

Backend расположен рядом в соседней папке: `../greenfind-Backend`.

Основной API префикс:

- `/api/auth/*`
- `/api/user/*`
- `/api/search/*`
- `/api/admin/*`

## Для диплома

Рекомендуем фиксировать в отчете:

- сценарий поиска с кешированием;
- сценарий авторизации/верификации;
- сценарий админ-аналитики (top queries, trend, top sites);
- скриншоты тестов `npm test` и сборки `npm run build`.
