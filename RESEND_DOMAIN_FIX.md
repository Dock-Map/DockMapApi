# Исправление проблемы с доменом Resend API

## Проблема

Resend API в тестовом режиме позволяет отправлять email только на email владельца аккаунта:

```
Error 403: You can only send testing emails to your own email address (ponywebmoriss@gmail.com).
To send emails to other recipients, please verify a domain at resend.com/domains
```

## Решение

### 1. Автоматическое перенаправление на владельца

Все email автоматически перенаправляются на `ponywebmoriss@gmail.com`:

```typescript
// Для тестирования: если email не является владельцем аккаунта, перенаправляем на владельца
const ownerEmail = 'ponywebmoriss@gmail.com';
const actualRecipient = email === ownerEmail ? email : ownerEmail;

if (email !== ownerEmail) {
  console.log(
    `[RESEND SDK] 🔄 Redirecting email from ${email} to owner ${ownerEmail} (Resend limitation)`,
  );
}
```

### 2. Обновленный from адрес

Используется email владельца как отправитель:

```typescript
from: 'DockMap <ponywebmoriss@gmail.com>', // Используем email владельца аккаунта
```

### 3. Уведомление в subject и теле письма

- **Subject:** `Сброс пароля DockMap (для nickshym@yandex.by)`
- **В письме:** Блок с информацией о перенаправлении

```html
<div
  style="background: #e0f2fe; padding: 15px; border-radius: 6px; border-left: 4px solid #0288d1;"
>
  <p style="color: #01579b; margin: 0; font-size: 14px;">
    📧 <strong>Тестирование:</strong> Это письмо предназначалось для
    nickshym@yandex.by, но отправлено на ваш email из-за ограничений Resend API
    в тестовом режиме.
  </p>
</div>
```

## Логи диагностики

### Успешная отправка:

```
[RESEND SDK] 🔄 Redirecting email from nickshym@yandex.by to owner ponywebmoriss@gmail.com (Resend limitation)
[RESEND SDK] ✅ Email sent successfully: abc123-def456
```

### Без перенаправления (владелец):

```
[RESEND SDK] ✅ Email sent successfully: xyz789-abc123
```

## Тестирование

### Для любого email:

```bash
curl -X POST http://localhost:3000/auth/email/test \
  -H "Content-Type: application/json" \
  -d '{"email": "any@example.com"}'
```

**Результат:** Email будет отправлен на `ponywebmoriss@gmail.com` с указанием оригинального получателя.

### Для владельца:

```bash
curl -X POST http://localhost:3000/auth/email/test \
  -H "Content-Type: application/json" \
  -d '{"email": "ponywebmoriss@gmail.com"}'
```

**Результат:** Email отправляется напрямую без перенаправления.

## Для Railway

На Railway это решение работает точно так же:

1. Все email перенаправляются на владельца аккаунта
2. В subject и теле письма указывается оригинальный получатель
3. Нет ошибок 403 от Resend API

## Долгосрочное решение

Для продакшена:

1. **Зарегистрировать домен** на [resend.com/domains](https://resend.com/domains)
2. **Настроить DNS записи** для домена
3. **Изменить from адрес** на `noreply@yourdomain.com`
4. **Убрать перенаправление** и отправлять на реальные адреса

**Сейчас email работает в тестовом режиме!** ✅ 📧
