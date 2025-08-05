Проект DockMap — это цифровая платформа с амбициозным функционалом, охватывающим B2C (владельцы судов) и B2B (администраторы яхт-клубов) интерфейсы. Стартуем с бэкенда, ориентируясь на MVP, но с учётом масштабируемости.

Роль Кто это Основные права и доступ
Owner Судовладелец ЛК, бронирование, документы, оплата
ClubAdmin Администратор яхт-клуба Управление клубом, карта, бронирования, сотрудники
ClubManager Менеджер клуба Работа с клиентами, швартовками, частичный доступ
DockWorker Швартовщик Просмотр карт, статусов, без доступа к CRM
SuperAdmin DockMap модератор платформы Верификация клубов, модерирование, аналитика всех клубов

3. Основные модули (по функциональности)
1. Аутентификация и авторизация
   JWT + Refresh Tokens
   Role-based access (RBAC)

Поддержка входа через Telegram (OAuth-like flow)

Логгирование входов по IP / устройству

2. Пользователи
   CRUD профилей

Хранение документов (S3)

Список судов

Список бронирований

3. Яхт-клубы
   CRUD клубов (модерация)

Подключение сотрудников

Календарь

Причалы (причальные места)

Интерактивная карта (связка с координатами)

Цены и тарифы

Услуги

4. Бронирования
   CRUD

Статусы: pending, confirmed, cancelled, expired

Управление бронями

Автоотмена при неактивации

Генерация оферты

5. Оплаты
   Интеграция с платежной системой (CloudPayments / Stripe / YooKassa / Тинькофф)

Webhooks

Генерация чеков (фискализация)

6. Уведомления
   Email (SMTP или сторонний сервис типа SendGrid)

Telegram (бот через node-telegram-bot-api)

SMS (Twilio)

7. Аналитика и отчёты
   Доходы

Загруженность

По клиентам

Выгрузка в Excel / PDF

8. Документы и безопасность
   Шифрование (AES-256)

Облачное хранилище

Подписи оферты (либо EDS, либо checkbox-согласие)

User {
id String @id @default(uuid())
role Role // Enum: OWNER | CLUB_ADMIN | MANAGER | WORKER | SUPER_ADMIN
name String
phone String @unique
email String? @unique
telegramChatId String?
boats Boat[]
bookings Booking[]
documents Document[]
createdAt DateTime @default(now())
}

Boat {
id String @id @default(uuid())
userId String
name String
type String
length Float
width Float
draft Float
registryNumber String
}

Club {
id String @id @default(uuid())
name String
location String
city String
coords Json
description String
admins ClubUser[]
docks Dock[]
services Service[]
}

Dock {
id String @id @default(uuid())
clubId String
name String // A1, A2 и т.п.
width Float
length Float
depth Float
category String
type String // guest / rent / reserved
status String // free, booked, occupied, repair
bookings Booking[]
}

Booking {
id String @id @default(uuid())
userId String
boatId String
clubId String
dockId String
fromDate DateTime
toDate DateTime
status String // pending, confirmed, cancelled
price Float
services BookingService[]
}

BookingService {
id String @id @default(uuid())
bookingId String
serviceId String
price Float
}

Service {
id String @id @default(uuid())
name String
price Float
availableDocks String[] // или отдельная связующая таблица
}
