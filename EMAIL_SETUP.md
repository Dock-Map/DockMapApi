# 📧 Настройка Email для DockMap

## 🔄 Принцип работы Mail.ru SMTP

### Как работает доставка:
```
NestJS → Mail.ru SMTP → Mail.ru доставляет → Gmail/Yandex/Outlook/etc
```

**Важно**: Вы напрямую НЕ работаете с Gmail или Yandex!
- NestJS общается только с Mail.ru SMTP
- Mail.ru сам доставляет письма на любые домены
- Поддерживаются все почтовые системы: Gmail, Yandex, Outlook, Yahoo и др.

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

### 🛡️ Защита от спама

**Преимущества использования @mail.ru адреса:**
- ✅ SPF, DKIM, DMARC уже настроены Mail.ru
- ✅ Репутация Mail.ru серверов
- ✅ Письма реже попадают в спам
- ✅ Не нужно настраивать DNS записи

**Если бы использовали свой домен** (например noreply@mydomain.ru):
- ❌ Нужно настраивать SPF записи
- ❌ Нужно настраивать DKIM подписи  
- ❌ Нужно настраивать DMARC политики
- ❌ Больше шансов попасть в спам

### 🧪 Тестирование

Используйте эндпоинт `/auth/email/test` для проверки отправки email:

```bash
POST /auth/email/test
{
  "email": "test@example.com"
}
```

**Можно тестировать с любыми доменами:**
- test@gmail.com
- test@yandex.ru  
- test@outlook.com
- test@yahoo.com

### 📚 Документация

- [Настройка Mail.ru SMTP](https://help.mail.ru/mail/login/mailer/#setup)
- [Создание пароля для приложений](https://help.mail.ru/mail/login/mailer/#setup)
