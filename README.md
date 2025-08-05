🚤 DockMap — Цифровая платформа для швартовок и управления яхт-клубами
DockMap — это масштабируемая B2C+B2B платформа, объединяющая владельцев судов и администраторов яхт-клубов. Сервис позволяет бронировать швартовки, управлять причалами, сотрудниками, тарифами и платежами. Первая версия реализуется как MVP, но с учётом будущего роста и модульной архитектуры.

⚙️ Стек технологий (MVP)
Backend: NestJS + PostgreSQL + Prisma

Auth: JWT (access/refresh), RBAC, вход через Telegram

Файлы: AWS S3 (через SDK), шифрование документов

Платежи: CloudPayments / Stripe / YooKassa / Тинькофф (интеграция через Webhooks)

Уведомления: Email (SMTP/SendGrid), SMS (Twilio), Telegram (бот)

DevOps: Docker, Railway / Render / VPS

API-документация: Swagger

🧑‍💼 Ролевая модель доступа
Роль Кто это Основные права и доступ
Owner Владелец судна Личный кабинет, бронь, документы, оплата
ClubAdmin Администратор яхт-клуба Управление клубом, карта, бронирования, сотрудники
ClubManager Менеджер яхт-клуба Работа с клиентами, швартовками, частичный доступ
DockWorker Швартовщик Только карта и статусы, без доступа к CRM
SuperAdmin Модератор платформы DockMap Верификация клубов, модерирование, аналитика по всем клубам

🧩 Основные модули платформы

1. 🔐 Аутентификация и авторизация
   JWT + Refresh Tokens

Role-based Access Control (RBAC)

Поддержка входа через Telegram Login

Логирование входов по IP-адресу и устройству

2. 👤 Пользователи
   CRUD профиля

Загрузка и хранение документов (S3)

Привязка судов

История бронирований

3. ⚓️ Яхт-клубы
   CRUD клубов (в том числе модерация SuperAdmin-ом)

Подключение сотрудников (менеджеры, рабочие)

Интерактивная карта и координаты

Причалы (места) с параметрами (ширина, глубина и пр.)

Цены, тарифы, услуги (душ, электричество и др.)

4. 📅 Бронирования
   CRUD операций

Статусы: pending, confirmed, cancelled, expired

Автоотмена при неактивации

Генерация оферты на бронирование

Управление доступными местами и услугами

5. 💳 Оплаты
   Интеграция с платёжной системой

Поддержка Webhooks

Фискализация и генерация чеков (опционально)

История транзакций

6. 🔔 Уведомления
   Email-уведомления (через SMTP или SendGrid)

Telegram-бот (node-telegram-bot-api)

SMS (Twilio или аналогичный провайдер)

7. 📊 Аналитика и отчёты
   Доходность по клубу

Загруженность причалов

Статистика по пользователям

Выгрузка данных в Excel / PDF (через админку)

# DockMapApi

API для системы управления яхт-клубами и судовладельцами.

## Аутентификация и безопасность токенов

### JWT Token Security

Система использует двойную систему токенов для безопасности:

#### Access Token

- **Время жизни**: 15 минут
- **Назначение**: Доступ к защищенным ресурсам
- **Хранение**: В памяти клиента

#### Refresh Token

- **Время жизни**: 7 дней
- **Назначение**: Обновление access token
- **Хранение**: В базе данных (хешированный)

### Безопасность Refresh Tokens

#### Ротация токенов

- При каждом обновлении создается **новый** refresh token
- Старый refresh token становится недействительным
- Предотвращает повторное использование скомпрометированных токенов

#### Проверка валидности

- Refresh token проверяется на соответствие сохраненному в базе
- Используется bcrypt для сравнения хешей
- При несовпадении токен отзывается

#### Отзыв токенов

- **Logout**: Отзывает текущий refresh token
- **Revoke All**: Отзывает все токены пользователя (для безопасности)

### API Endpoints

```bash
# Обновление токенов
POST /auth/refresh
Body: { "refreshToken": "..." }

# Выход из системы
POST /auth/logout
Authorization: Bearer <access_token>

# Отзыв всех токенов (безопасность)
POST /auth/revoke-all-tokens
Authorization: Bearer <access_token>

# Проверка валидности refresh token
POST /auth/validate-refresh
Body: { "refreshToken": "..." }
```

### Рекомендации по безопасности

1. **Храните refresh token безопасно** - в httpOnly cookies или secure storage
2. **Используйте HTTPS** - для всех запросов с токенами
3. **Регулярно обновляйте токены** - не держите старые access tokens
4. **Отзывайте токены при подозрении** - используйте `/auth/revoke-all-tokens`
5. **Мониторьте активность** - логируйте все операции с токенами

## Установка и запуск

### Требования

- Node.js 18+
- PostgreSQL
- Redis (опционально)

### Переменные окружения

```env
# База данных
DATABASE_URL=postgresql://user:password@localhost:5432/dockmap

# JWT токены
JWT_SECRET=your_jwt_secret_key
JWT_SECRET_REFRESH=your_jwt_refresh_secret_key

# Twilio SMS
TWILIO_ACCOUNT_SID=your_twilio_account_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_PHONE_NUMBER=your_twilio_phone_number

# Yandex Cloud Object Storage (опционально)
YANDEX_S3_ACCESS_KEY_ID=your_access_key_id
YANDEX_S3_SECRET_ACCESS_KEY=your_secret_access_key
YANDEX_S3_BUCKET=your_bucket_name
```

### Установка зависимостей

```bash
npm install
```

### Запуск в режиме разработки

```bash
npm run start:dev
```

### Запуск в продакшене

```bash
npm run build
npm run start:prod
```

## API Endpoints

### Аутентификация

- `POST /auth/sms/send` - Отправить SMS код
- `POST /auth/sms/verify` - Проверить SMS код и войти
- `POST /auth/refresh` - Обновить токены
- `POST /auth/logout` - Выйти из системы
- `POST /auth/revoke-all-tokens` - Отозвать все токены

### Пользователи

- `GET /user/cities` - Получить список городов
- `POST /user/complete-registration` - Завершить регистрацию
- `GET /user/profile` - Получить профиль пользователя

### Файлы (если настроен S3)

- `POST /files/upload` - Загрузить файл
- `POST /files/upload-image` - Загрузить изображение
- `GET /files/list` - Список файлов
- `GET /files/download/{key}` - Скачать файл
- `DELETE /files/{key}` - Удалить файл

## Структура проекта

```
src/
├── auth/           # Аутентификация и авторизация
├── user/           # Управление пользователями
├── shared/         # Общие сервисы (S3, SMS)
├── healthCheck/    # Проверка здоровья приложения
└── app/           # Основной модуль приложения
```

## Технологии

- **NestJS** - фреймворк для Node.js
- **TypeORM** - ORM для работы с базой данных
- **JWT** - JSON Web Tokens для аутентификации
- **Passport** - стратегии аутентификации
- **Twilio** - SMS верификация
- **Yandex Cloud Object Storage** - хранение файлов
- **Swagger** - документация API
