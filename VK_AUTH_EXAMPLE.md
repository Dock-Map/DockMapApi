# VK Авторизация - Пример использования

## Настройка

1. Создайте приложение в VK ID: https://id.vk.com/apps
2. Настройте redirect URI: `https://your-domain.com/auth/vk/callback`
3. Добавьте переменные окружения в `.env`:

```env
VK_CLIENT_ID=your_vk_client_id
VK_CLIENT_SECRET=your_vk_client_secret
VK_REDIRECT_URI=https://your-domain.com/auth/vk/callback
```

## Использование

### 1. Создание URL для авторизации

```javascript
const clientId = 'your_vk_client_id';
const redirectUri = 'https://your-domain.com/auth/vk/callback';
const scope = 'email phone';
const state = 'random_state_string';

const authUrl = `https://id.vk.com/authorize?response_type=code&client_id=${clientId}&scope=${scope}&redirect_uri=${encodeURIComponent(redirectUri)}&state=${state}`;
```

### 2. Обработка callback'а

После авторизации VK перенаправит пользователя на ваш callback URL с параметрами:

```
https://your-domain.com/auth/vk/callback?payload=eyJjb2RlIjoi...&state=random_state_string
```

### 3. API Endpoint

```
GET /auth/vk/callback
```

**Query параметры:**
- `payload` (обязательный) - закодированные в base64 данные авторизации
- `state` (опциональный) - состояние для проверки безопасности

**Пример ответа:**
```json
{
  "accessToken": "jwt_access_token",
  "refreshToken": "jwt_refresh_token",
  "user": {
    "id": "user_id",
    "name": "User Name",
    "phone": "vk_user_id",
    "email": "user@example.com",
    "role": "OWNER",
    "authProvider": "VK",
    "isPhoneVerified": true,
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

## Обработка ошибок

- `401 Unauthorized` - Ошибка авторизации через VK
- `400 Bad Request` - Неверный формат данных
- `500 Internal Server Error` - Ошибка сервера

## Безопасность

1. Проверяйте `state` параметр для предотвращения CSRF атак
2. Используйте HTTPS для всех запросов
3. Храните `client_secret` в безопасном месте
4. Валидируйте все входящие данные 