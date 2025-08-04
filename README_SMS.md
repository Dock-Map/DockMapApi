# SMS Верификация - Быстрый старт

## Установка и запуск

1. **Установите зависимости:**
```bash
npm install
```

2. **Настройте переменные окружения:**
Создайте файл `.env.development`:
```env
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USER=dock
DATABASE_PASSWORD=dock
DATABASE_NAME=dock

TWILIO_ACCOUNT_SID=your_twilio_sid
TWILIO_AUTH_TOKEN=your_twilio_token
TWILIO_PHONE_NUMBER=your_twilio_number

JWT_SECRET=your_jwt_secret
```

3. **Запустите базу данных:**
```bash
npm run setupBd
```

4. **Запустите приложение:**
```bash
npm run start:dev
```

## Тестирование

### Автоматические тесты
```bash
npm test
```

### Ручное тестирование
```bash
node test-sms-verification.js
```

### API Endpoints

#### Отправка SMS
```bash
curl -X POST http://localhost:3000/auth/sms/send \
  -H "Content-Type: application/json" \
  -d '{"phoneNumber": "+79001234567"}'
```

#### Верификация SMS
```bash
curl -X POST http://localhost:3000/auth/sms/verify \
  -H "Content-Type: application/json" \
  -d '{"phoneNumber": "+79001234567", "code": "123456"}'
```

#### Очистка истекших кодов
```bash
curl -X DELETE http://localhost:3000/user/cleanup-expired-codes
```

## Структура проекта

```
src/
├── auth/
│   ├── auth.controller.ts    # Контроллер авторизации
│   ├── auth.service.ts       # Сервис авторизации
│   └── ...
├── user/
│   ├── entities/
│   │   ├── user.entity.ts           # Сущность пользователя
│   │   └── verification-code.entity.ts  # Сущность кода верификации
│   ├── user.service.ts       # Сервис пользователей
│   └── user.controller.ts    # Контроллер пользователей
└── shared/
    └── services/
        └── sms.service.ts    # Сервис отправки SMS
```

## Особенности реализации

✅ **Безопасность:**
- Коды хранятся в базе данных
- Время жизни кода: 5 минут
- Одноразовое использование
- Автоматическая очистка истекших кодов

✅ **Производительность:**
- Индексы на номер телефона
- Оптимизированные запросы
- Минимальные блокировки

✅ **Масштабируемость:**
- Модульная архитектура
- Легко добавить новые провайдеры SMS
- Поддержка Redis для кэширования

## Следующие шаги

1. **Rate Limiting** - ограничение количества запросов
2. **Redis** - кэширование для лучшей производительности
3. **Мониторинг** - логирование и метрики
4. **Тестирование** - интеграционные тесты
5. **Документация** - OpenAPI спецификация 