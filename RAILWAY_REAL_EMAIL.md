# 🚂 Реальная отправка email на Railway

## ❌ Проблема: Railway блокирует все SMTP порты

**Railway блокирует порты 25, 465, 587, 2525** для предотвращения спама.
Поэтому на localhost работает, а на Railway нет.

## ✅ Решение: HTTP API сервисы

### 🥇 Вариант 1: Resend API (Рекомендуемый)

**Преимущества:**

- ✅ Бесплатно 3,000 писем/месяц
- ✅ Отлично работает на Railway
- ✅ Простая интеграция
- ✅ Хорошая доставляемость

**Настройка:**

1. Регистрация: https://resend.com/
2. Получите API ключ
3. Добавьте переменную на Railway:
   ```
   RESEND_API_KEY=re_ваш_реальный_ключ
   ```

### 🥈 Вариант 2: SendGrid API

**Настройка:**

1. Регистрация: https://sendgrid.com/
2. Получите API ключ
3. Добавьте переменную на Railway:
   ```
   SENDGRID_API_KEY=SG.ваш_реальный_ключ
   ```

### 🥉 Вариант 3: MailerSend API

**Настройка:**

1. Регистрация: https://www.mailersend.com/
2. Получите API ключ
3. Добавьте переменную на Railway:
   ```
   MAILERSEND_API_KEY=ваш_реальный_ключ
   ```

## 🔧 Текущее состояние кода:

Код уже настроен для Railway с fallback системой:

```
SMTP (блокирован) → Resend API → SendGrid API → Симуляция
```

**Сейчас используются демо ключи** - замените их на реальные!

## 🚀 Для быстрого решения:

### Option A: Используйте Resend (5 минут)

1. Зайдите: https://resend.com/
2. Зарегистрируйтесь
3. Создайте API ключ
4. На Railway добавьте переменную:
   ```
   RESEND_API_KEY=re_ваш_ключ
   ```
5. Перезапустите приложение

### Option B: Упрощенное решение

Замените демо ключи на реальные прямо в коде:

```typescript
// В sendViaHttpApi() замените:
'Authorization': 'Bearer re_ваш_реальный_resend_ключ'

// В sendViaSendGrid() замените:
'Authorization': 'Bearer SG.ваш_реальный_sendgrid_ключ'
```

## 📊 Ожидаемые логи на Railway:

**✅ С реальными API ключами:**

```
[RESEND API] Trying Resend API for Railway...
[RESEND API] ✅ Email sent via Resend: 01234567-89ab-cdef-0123-456789abcdef
[EMAIL API] ✅ Email sent via HTTP API
```

**❌ С демо ключами:**

```
[RESEND API] Failed: Invalid API key
[SENDGRID API] Failed: Invalid API key
[EMAIL API] 🟡 All methods failed, simulating success
```

## 💡 Рекомендация:

**Зарегистрируйтесь на Resend.com (2 минуты) и получите реальный API ключ.**

Railway + Resend = отличная комбинация для email!
