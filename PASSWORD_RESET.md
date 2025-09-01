# Сброс пароля через Email

## Описание

Функционал сброса пароля позволяет пользователям, зарегистрированным через email, восстановить доступ к аккаунту с помощью 6-значного кода, отправляемого на электронную почту.

## Схема работы

1. **Запрос сброса пароля**: Пользователь вводит email → нажимает «Сбросить пароль»
2. **Генерация кода**: Бэкенд генерирует 6-значный код (123456)
3. **Сохранение**: Код сохраняется в базе данных с TTL 10 минут
4. **Отправка email**: Email с красивым шаблоном отправляется пользователю
5. **Ввод кода**: Пользователь вводит код в приложении
6. **Проверка**: Бэкенд проверяет код → если ОК, разрешает задать новый пароль
7. **Установка пароля**: Пользователь устанавливает новый пароль
8. **Безопасность**: Все токены пользователя отзываются

## API Endpoints

### 1. Запросить сброс пароля
```http
POST /auth/password/reset-request
Content-Type: application/json

{
  "email": "user@example.com"
}
```

**Ответ:**
```json
{
  "success": true,
  "message": "Код для сброса пароля отправлен на email"
}
```

### 2. Проверить код (опционально)
```http
POST /auth/password/verify-code
Content-Type: application/json

{
  "email": "user@example.com",
  "code": "123456"
}
```

**Ответ:**
```json
{
  "success": true,
  "message": "Код подтвержден. Можете установить новый пароль"
}
```

### 3. Установить новый пароль
```http
POST /auth/password/reset
Content-Type: application/json

{
  "email": "user@example.com",
  "code": "123456",
  "newPassword": "NewSecurePassword123!"
}
```

**Ответ:**
```json
{
  "success": true,
  "message": "Пароль успешно изменен"
}
```

### 4. Очистить истекшие коды (админ)
```http
POST /auth/password/cleanup-expired
Authorization: Bearer {jwt_token}
```

## Настройка Email

### Переменные окружения

Добавьте в `.env.production`:

```env
# Email настройки
EMAIL_USER=your_email@gmail.com
EMAIL_PASSWORD=your_app_password
EMAIL_FROM=DockMap <noreply@dockmap.com>
```

### Получение App Password для Gmail

1. Включите 2FA в Google аккаунте
2. Перейдите в [Google App Passwords](https://myaccount.google.com/apppasswords)
3. Создайте новый App Password для "Mail"
4. Используйте полученный пароль в `EMAIL_PASSWORD`

## Безопасность

### ✅ Реализованные меры:
- **TTL кодов**: 10 минут жизни кода
- **Одноразовые коды**: Код нельзя использовать повторно
- **Очистка старых кодов**: Автоматическое удаление при создании нового
- **Отзыв токенов**: Все JWT токены отзываются после смены пароля
- **Скрытие информации**: Не раскрывается, существует ли email в системе
- **Проверка провайдера**: Работает только для пользователей с `authProvider: EMAIL`

### 🔧 Дополнительные настройки:
- **Rate limiting**: Рекомендуется добавить лимит на количество запросов
- **CAPTCHA**: Для защиты от ботов
- **Логирование**: Все попытки сброса логируются

## База данных

### Обновленная VerificationCode entity:

```typescript
{
  id: string;              // UUID
  email?: string;          // Email для сброса пароля
  phoneNumber?: string;    // Телефон для SMS (существующий)
  code: string;            // 6-значный код
  type: 'SMS' | 'EMAIL' | 'PASSWORD_RESET';  // Тип кода
  isUsed: boolean;         // Использован ли код
  expiresAt: Date;         // Время истечения
  createdAt: Date;         // Время создания
}
```

## Тестирование

### 1. Swagger UI
Доступно по адресу: `GET /api`
- Раздел: **Password Reset**
- Все 4 endpoint'а с примерами

### 2. Postman/Curl примеры:

```bash
# 1. Запросить код
curl -X POST http://localhost:3000/auth/password/reset-request \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com"}'

# 2. Проверить код (опционально)
curl -X POST http://localhost:3000/auth/password/verify-code \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "code": "123456"}'

# 3. Сбросить пароль
curl -X POST http://localhost:3000/auth/password/reset \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "code": "123456", "newPassword": "NewPassword123!"}'
```

## Ошибки и их решение

### Ошибка отправки email:
```json
{
  "success": false,
  "message": "Ошибка отправки email. Попробуйте позже"
}
```
**Решение**: Проверить настройки EMAIL_USER и EMAIL_PASSWORD

### Неверный код:
```json
{
  "success": false,
  "message": "Неверный код или код не найден"
}
```
**Решение**: Код неверный, истек или уже использован

### Email не найден:
```json
{
  "success": true,
  "message": "Если указанный email существует в системе, код был отправлен"
}
```
**Примечание**: Из соображений безопасности всегда возвращается успешный ответ

## Интеграция с фронтендом

### Пример React компонента:

```typescript
const resetPassword = async (email: string, code: string, newPassword: string) => {
  try {
    const response = await fetch('/auth/password/reset', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, code, newPassword })
    });
    
    const result = await response.json();
    
    if (result.success) {
      // Перенаправить на страницу входа
      router.push('/login');
      toast.success('Пароль успешно изменен');
    } else {
      toast.error(result.message);
    }
  } catch (error) {
    toast.error('Произошла ошибка');
  }
};
```

---

✅ **Функционал полностью готов к использованию!**
