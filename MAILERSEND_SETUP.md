# 📧 MailerSend Setup для DockMap

## 🔧 Настройка MailerSend

### Получение API ключа

1. Зарегистрируйтесь на https://app.mailersend.com/
2. Перейдите в **API Tokens** в настройках
3. Создайте новый API токен с правами на отправку email
4. Скопируйте ваш API ключ (формат: `mlsn.xxxxxxxxxx`)

### 🌐 Настройка домена

#### Вариант 1: Использование Trial домена (для тестирования)

- MailerSend предоставляет trial домен для тестирования
- Формат: `noreply@trial-xxxxxxxxx.mlsender.net`
- Подходит для разработки и тестирования

#### Вариант 2: Настройка собственного домена

1. В панели MailerSend перейдите в **Domains**
2. Добавьте ваш домен
3. Настройте DNS записи согласно инструкциям
4. Дождитесь верификации домена
5. Используйте любой email с вашего домена для отправки

### 🔐 Переменные окружения

Добавьте в ваш `.env` файл:

```env
# MailerSend Configuration
MAILERSEND_API_KEY=mlsn.ce978212dc34f30cda1fe6bec4d069539a3206709a51a551bad362e59ec67c0d
MAILERSEND_FROM_EMAIL=hello@test-pzkmgq7656vl059v.mlsender.net
MAILERSEND_FROM_NAME=DockMap
```

**Описание переменных:**

- `MAILERSEND_API_KEY` - ваш API ключ от MailerSend
- `MAILERSEND_FROM_EMAIL` - email отправителя (trial домен или ваш верифицированный домен)
- `MAILERSEND_FROM_NAME` - имя отправителя, отображаемое в письмах

### 🚀 Развертывание

#### Railway

```bash
railway variables set MAILERSEND_API_KEY=mlsn.ce978212dc34f30cda1fe6bec4d069539a3206709a51a551bad362e59ec67c0d
railway variables set MAILERSEND_FROM_EMAIL=hello@test-pzkmgq7656vl059v.mlsender.net
railway variables set MAILERSEND_FROM_NAME=DockMap
```

#### Docker

```bash
docker run -e MAILERSEND_API_KEY=mlsn.ce978212dc34f30cda1fe6bec4d069539a3206709a51a551bad362e59ec67c0d \
           -e MAILERSEND_FROM_EMAIL=hello@test-pzkmgq7656vl059v.mlsender.net \
           -e MAILERSEND_FROM_NAME=DockMap \
           your-app
```

### ✅ Преимущества MailerSend

- 🔥 **Высокая доставляемость** - профессиональная инфраструктура
- 📊 **Аналитика** - детальная статистика доставки
- 🌍 **Глобальная инфраструктура** - быстрая доставка по всему миру
- 🔒 **Безопасность** - поддержка DKIM, SPF, DMARC
- 💰 **Доступность** - щедрый бесплатный план
- 📧 **Гибкость** - поддержка HTML и текстовых писем

### 🧪 Тестирование

После настройки переменных окружения, отправка email будет происходить через MailerSend API.

**Успешная отправка - логи в консоли:**

```
[MAILERSEND API] Sending email to: user@example.com
[MAILERSEND SDK] Trying MailerSend SDK...
[MAILERSEND] Using API key: mlsn.ce978212dc...
[MAILERSEND] Sending from: hello@test-pzkmgq7656vl059v.mlsender.net
[MAILERSEND] Sending email to: user@example.com
[MAILERSEND] Raw result: {"statusCode":202}
[MAILERSEND] ✅ Email sent successfully
[MAILERSEND SDK] ✅ Email sent successfully
```

**Если SDK не работает - используется HTTP fallback:**

```
[MAILERSEND SDK] Failed: [error details]
[MAILERSEND HTTP] Trying direct HTTP API...
[MAILERSEND HTTP] Sending from: hello@test-pzkmgq7656vl059v.mlsender.net
[MAILERSEND HTTP] Response status: 202
[MAILERSEND HTTP] ✅ Email sent successfully
```

### 🔧 Troubleshooting

#### 1. Domain Configuration

Используется ваш настроенный домен:

- `hello@test-pzkmgq7656vl059v.mlsender.net`

**Важно**: Код автоматически исправляет email если в переменной окружения указан только домен без префикса:

- `test-pzkmgq7656vl059v.mlsender.net` → `hello@test-pzkmgq7656vl059v.mlsender.net`

#### 2. API Key Issues

- Убедитесь, что API ключ действителен в MailerSend панели
- Проверьте права доступа для токена (должен иметь права на отправку email)

#### 3. Fallback System

Система имеет двойную защиту:

1. **MailerSend SDK** - основной метод
2. **HTTP API** - fallback при проблемах с SDK

#### 4. Detailed Logging

Для отладки включены детальные логи на каждом этапе:

- Инициализация API ключа
- Настройка sender домена
- Статус отправки
- Детальные ошибки при неудаче

### 📋 Лимиты

**Trial план:**

- 3,000 emails/месяц бесплатно
- Возможность отправки только с trial домена

**Paid планы:**

- Больше emails в месяц
- Собственные домены
- Расширенная аналитика
- Приоритетная поддержка

### 🔗 Полезные ссылки

- [MailerSend Dashboard](https://app.mailersend.com/)
- [MailerSend Documentation](https://developers.mailersend.com/)
- [Node.js SDK](https://github.com/mailersend/mailersend-nodejs)
- [API Reference](https://developers.mailersend.com/api/v1/emails.html)
