# 🔑 Как получить API ключи для email отправки на Railway

## 🚀 Быстрый старт: Resend API (Рекомендуемый)

### 📝 Пошаговая инструкция:

1. **Перейдите на сайт Resend**

   ```
   https://resend.com/
   ```

2. **Нажмите "Get Started"** (правый верхний угол)

3. **Заполните форму регистрации:**
   - Email адрес
   - Пароль
   - Имя компании (можете написать "DockMap")

4. **Подтвердите email** (проверьте почту)

5. **В панели управления:**
   - Перейдите в раздел **"API Keys"** (левое меню)
   - Нажмите **"Create API Key"**
   - Название: `DockMap Railway`
   - Выберите домен или создайте новый
   - Нажмите **"Create"**

6. **Скопируйте ключ:**
   ```
   re_AbCdEf123456789_ваш_реальный_ключ
   ```
   ⚠️ **Важно**: Сохраните ключ, он показывается только один раз!

### 🔧 Настройка на Railway:

1. **Откройте ваш проект на Railway**
2. **Перейдите во вкладку "Variables"**
3. **Добавьте новую переменную:**
   ```
   Name: RESEND_API_KEY
   Value: re_ваш_скопированный_ключ
   ```
4. **Нажмите "Add"**
5. **Перезапустите приложение** (Deploy → Redeploy)

## 🔄 Альтернатива: SendGrid API

### 📝 Если Resend не подходит:

1. **Перейдите на SendGrid**

   ```
   https://sendgrid.com/
   ```

2. **Sign Up** → заполните форму

3. **В панели SendGrid:**
   - **Settings** → **API Keys**
   - **Create API Key**
   - Название: `DockMap Railway`
   - Permissions: **Full Access**
   - **Create & View**

4. **Скопируйте ключ:**

   ```
   SG.xxxxxxxxxxxxxxxxxxxxx
   ```

5. **На Railway добавьте:**
   ```
   Name: SENDGRID_API_KEY
   Value: SG.ваш_ключ
   ```

## 📊 Результат на Railway:

### ✅ С правильными ключами:

```
[EMAIL API] Starting email send process for: user@example.com
[RESEND API] Trying Resend API for Railway...
[RESEND API] ✅ Email sent via Resend: 01234567-89ab-cdef
[EMAIL API] ✅ Email sent via HTTP API
```

### ❌ Без ключей:

```
[RESEND API] API key not configured, skipping...
[SENDGRID API] API key not configured, skipping...
[EMAIL API] 🟡 All methods failed, simulating success
```

## 💰 Бесплатные лимиты:

| Сервис       | Бесплатный лимит  | Регистрация |
| ------------ | ----------------- | ----------- |
| **Resend**   | 3,000 писем/месяц | 2 минуты    |
| **SendGrid** | 100 писем/день    | 5 минут     |

## 🎯 Рекомендация:

**Начните с Resend** - проще регистрация и больше бесплатных писем.

## 🔗 Полезные ссылки:

- [Resend регистрация](https://resend.com/)
- [SendGrid регистрация](https://sendgrid.com/)
- [Railway Variables](https://docs.railway.app/deploy/variables)

## ❓ Проблемы?

Если что-то не работает:

1. Проверьте правильность API ключа
2. Убедитесь что переменная добавлена на Railway
3. Перезапустите приложение
4. Посмотрите логи Railway
