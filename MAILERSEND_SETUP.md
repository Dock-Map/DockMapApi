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
MAILERSEND_API_KEY=mlsn.e596169615b1b18803f8f7c578d6b682b6451cf7a8c67cec6c69912951d4f0c9
MAILERSEND_FROM_EMAIL=noreply@trial-3vz9dlez0jv4kj50.mlsender.net
MAILERSEND_FROM_NAME=DockMap
```

**Описание переменных:**

- `MAILERSEND_API_KEY` - ваш API ключ от MailerSend
- `MAILERSEND_FROM_EMAIL` - email отправителя (trial домен или ваш верифицированный домен)
- `MAILERSEND_FROM_NAME` - имя отправителя, отображаемое в письмах

### 🚀 Развертывание

#### Railway

```bash
railway variables set MAILERSEND_API_KEY=mlsn.e596169615b1b18803f8f7c578d6b682b6451cf7a8c67cec6c69912951d4f0c9
railway variables set MAILERSEND_FROM_EMAIL=noreply@trial-3vz9dlez0jv4kj50.mlsender.net
railway variables set MAILERSEND_FROM_NAME=DockMap
```

#### Docker

```bash
docker run -e MAILERSEND_API_KEY=mlsn.e596169615b1b18803f8f7c578d6b682b6451cf7a8c67cec6c69912951d4f0c9 \
           -e MAILERSEND_FROM_EMAIL=noreply@trial-3vz9dlez0jv4kj50.mlsender.net \
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

Логи в консоли покажут:

```
[MAILERSEND API] Sending email to: user@example.com
[MAILERSEND] MailerSend instance created, sending email...
[MAILERSEND] ✅ Email sent successfully
```

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
