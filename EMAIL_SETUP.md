# 📧 Настройка Email для DockMap

## Конфигурация Mail.ru SMTP

Согласно [документации Mail.ru](https://help.mail.ru/mail/login/mailer/#setup), для отправки email через внешние приложения используются следующие настройки:

### 🔐 Переменные окружения (.env.production)

```env
# Mail.ru SMTP настройки
EMAIL_USER=dock.map@mail.ru
EMAIL_PASSWORD=weghPOZktP2e3Md7Rr37
EMAIL_FROM=DockMap <dock.map@mail.ru>

# SMTP сервер настройки
SMTP_HOST=smtp.mail.ru
SMTP_PORT=465
SMTP_SECURE=true
```

### 📋 Настройки Mail.ru SMTP

| Параметр | Значение |
|----------|----------|
| **SMTP сервер** | smtp.mail.ru |
| **Порт** | 465 (SSL/TLS) |
| **Шифрование** | SSL/TLS |
| **Авторизация** | Обязательна |

### ⚠️ Важно!

1. **Пароль для внешних приложений**: `weghPOZktP2e3Md7Rr37`
   - Это НЕ обычный пароль от почты
   - Создается в настройках Mail.ru: Безопасность → Пароли для внешних приложений

2. **Тип протокола**: Полный доступ к Почте (для отправки email)

3. **Безопасность**: Используется SSL/TLS на порту 465

### 🚀 Деплой

На Timeweb Cloud Apps переменные окружения будут использованы автоматически из кода.

### 🧪 Тестирование

Используйте эндпоинт `/auth/email/test` для проверки отправки email:

```bash
POST /auth/email/test
{
  "email": "test@example.com"
}
```

### 📚 Документация

- [Настройка Mail.ru SMTP](https://help.mail.ru/mail/login/mailer/#setup)
- [Создание пароля для приложений](https://help.mail.ru/mail/login/mailer/#setup)
