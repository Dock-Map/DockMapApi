# Настройка авторизации через разные провайдеры

## Установленные зависимости

- `passport-custom` - для кастомных стратегий
- `passport-oauth2` - для VKontakte OAuth

## Переменные окружения

Создайте файл `.env` со следующими переменными:

```env
# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key
JWT_SECRET_REFRESH=your-super-secret-refresh-key

# Database
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USERNAME=dock
DATABASE_PASSWORD=dock
DATABASE_NAME=dock

# Telegram Bot Configuration
TELEGRAM_BOT_TOKEN=your-telegram-bot-token

# VKontakte OAuth Configuration
VK_CLIENT_ID=your-vk-client-id
VK_CLIENT_SECRET=your-vk-client-secret
VK_CALLBACK_URL=http://localhost:3000/auth/vk/callback

# SMS Service (Twilio)
TWILIO_ACCOUNT_SID=your-twilio-account-sid
TWILIO_AUTH_TOKEN=your-twilio-auth-token
TWILIO_PHONE_NUMBER=your-twilio-phone-number
```

## Настройка провайдеров

### Telegram Login Widget

Telegram использует **Login Widget** вместо OAuth. Вот как это работает:

1. **Создайте бота** через @BotFather в Telegram
2. **Получите токен бота** и добавьте в `TELEGRAM_BOT_TOKEN`
3. **Добавьте Telegram Login Widget** на фронтенд:

```html
<script async src="https://telegram.org/js/telegram-widget.js?22" 
        data-telegram-login="YourBotName" 
        data-size="large" 
        data-auth-url="http://localhost:3000/auth/telegram/callback"
        data-request-access="write">
</script>
```

4. **Настройте callback URL** в вашем приложении

### VKontakte OAuth

1. Создайте приложение на https://vk.com/dev
2. Получите Client ID и Client Secret
3. Настройте callback URL: `http://localhost:3000/auth/vk/callback`
4. Добавьте данные в переменные окружения

## API Endpoints

### SMS Авторизация

```bash
# Отправить SMS код
POST /auth/sms/send
{
  "phoneNumber": "+79001234567"
}

# Проверить SMS код и авторизоваться
POST /auth/sms/verify
{
  "phoneNumber": "+79001234567",
  "code": "1234"
}
```

### Telegram Login Widget

```bash
# Callback от Telegram Login Widget
GET /auth/telegram/callback?hash=...&id=...&first_name=...&last_name=...&username=...&photo_url=...&auth_date=...
```

### VKontakte OAuth

```bash
# Инициация OAuth (перенаправляет на VK)
GET /auth/vk

# Callback от VK
GET /auth/vk/callback
```

### Моковые эндпоинты для тестирования

```bash
# Моковая авторизация через Telegram
POST /auth/telegram/mock
{
  "id": "123456789",
  "username": "test_user",
  "first_name": "Иван",
  "last_name": "Иванов"
}

# Моковая авторизация через VK
POST /auth/vk/mock
{
  "id": "123456789",
  "first_name": "Иван",
  "last_name": "Иванов",
  "screen_name": "ivan_ivanov",
  "email": "ivan@example.com"
}
```

### Общие эндпоинты

```bash
# Обновить токены
POST /auth/refresh
{
  "refreshToken": "your-refresh-token"
}

# Выход из системы
POST /auth/logout
Authorization: Bearer your-access-token

# Получить данные пользователя
GET /auth/me
Authorization: Bearer your-access-token
```

## Структура ответа

Все эндпоинты авторизации возвращают одинаковую структуру:

```json
{
  "accessToken": "jwt-access-token",
  "refreshToken": "jwt-refresh-token",
  "user": {
    "id": "user-uuid",
    "name": "User Name",
    "phone": "+79001234567",
    "email": "user@example.com",
    "role": "USER",
    "authProvider": "telegram"
  }
}
```

## Реализация на фронтенде

### Telegram Login Widget

```html
<!DOCTYPE html>
<html>
<head>
    <title>Telegram Login</title>
</head>
<body>
    <script async src="https://telegram.org/js/telegram-widget.js?22" 
            data-telegram-login="YourBotName" 
            data-size="large" 
            data-auth-url="http://localhost:3000/auth/telegram/callback"
            data-request-access="write">
    </script>
</body>
</html>
```

### VK OAuth

```javascript
// Перенаправление на VK OAuth
window.location.href = 'http://localhost:3000/auth/vk';
```

## Кастомные стратегии

### Telegram Strategy

Использует `passport-custom` для обработки данных от Telegram Login Widget:

```typescript
@Injectable()
export class TelegramStrategy extends PassportStrategy(Strategy, 'telegram') {
  async validate(req: any, done: any) {
    // Проверяем подпись от Telegram
    const isValidSignature = this.verifyTelegramSignature(req.query);
    
    if (!isValidSignature) {
      return done(new Error('Invalid Telegram signature'), null);
    }

    // Авторизуем пользователя
    const authResult = await this.authService.authenticateWithTelegram(req.query);
    done(null, authResult);
  }
}
```

### VK Strategy

Использует `passport-oauth2` для OAuth flow:

```typescript
@Injectable()
export class VkStrategy extends PassportStrategy(Strategy, 'vkontakte') {
  async validate(accessToken: string, refreshToken: string, profile: any, done: any) {
    // Получаем данные пользователя из VK API
    const vkUserData = await this.getVkUserData(accessToken);
    
    // Авторизуем пользователя
    const authResult = await this.authService.authenticateWithVk(vkUserData);
    done(null, authResult);
  }
}
```

## Миграции

После изменения сущности User, создайте и выполните миграцию:

```bash
# Создать миграцию
npm run typeorm:create-migration -- -n UpdateUserEntity

# Выполнить миграцию
npm run typeorm:run-migrations
``` 