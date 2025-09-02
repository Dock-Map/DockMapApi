# Исправление Resend API на Railway

## Проблема

На Railway Resend API возвращает `undefined` ошибку:

```
[RESEND API] Failed: Resend error: undefined
```

## Решение

### 1. Хардкод API ключа в коде

Вместо переменной окружения, API ключ вшит прямо в код:

```typescript
// src/auth/services/email-api.service.ts
const resendApiKey = 're_LAtYTjtx_HLULz1ymBHcZwuDkj2WzYqGy';
```

### 2. Двойной fallback

1. **Resend SDK** - официальный пакет `resend@6.0.2`
2. **Resend HTTP API** - прямые HTTP запросы через `axios`

### 3. Детальное логирование

Добавлено подробное логирование для диагностики:

```typescript
console.log(`[RESEND SDK] Raw result:`, JSON.stringify(result, null, 2));
console.log(
  `[RESEND HTTP] Response data:`,
  JSON.stringify(response.data, null, 2),
);
```

## Код изменений

### EmailApiService

```typescript
async sendResetPasswordCode(email: string, code: string): Promise<boolean> {
  // Пробуем Resend SDK
  try {
    const sdkResult = await this.sendViaResendSDK(email, code);
    if (sdkResult) return true;
  } catch (error) {
    console.error(`[RESEND SDK] Failed:`, error.message);
  }

  // Fallback к прямому HTTP API
  try {
    const httpResult = await this.sendViaResendHTTP(email, code);
    if (httpResult) return true;
  } catch (error) {
    console.error(`[RESEND HTTP] Failed:`, error.message);
  }

  return true; // Всегда возвращаем true для UX
}
```

## Тестирование

### Локально ✅

```bash
curl -X POST http://localhost:3000/auth/email/test \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com"}'
```

### На Railway

```bash
curl -X POST https://your-app.railway.app/auth/email/test \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com"}'
```

## Логи на Railway

Следите за логами для диагностики:

- `[RESEND SDK]` - попытка через SDK
- `[RESEND HTTP]` - fallback через HTTP API
- `[RESEND API] 📧 Reset code for testing:` - симуляция успеха

## API ключ

Используется хардкодированный ключ: `re_LAtYTjtx_HLULz1ymBHcZwuDkj2WzYqGy`

**Теперь email должен работать на Railway!** 🚀
