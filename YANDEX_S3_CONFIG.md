# Настройка Yandex Cloud Object Storage с easy-yandex-s3

## Установка

Библиотека `easy-yandex-s3` уже установлена в проекте. Это специализированная библиотека для работы с Yandex Cloud Object Storage.

## Переменные окружения

Добавьте следующие переменные в ваш `.env` файл:

```env
# Yandex Cloud Object Storage
YANDEX_S3_ACCESS_KEY_ID=your_access_key_id
YANDEX_S3_SECRET_ACCESS_KEY=your_secret_access_key
YANDEX_S3_BUCKET=your_bucket_name
```

## Как получить ключи доступа

1. **Войдите в Yandex Cloud Console**
2. **Перейдите в Object Storage**
3. **Создайте бакет** (если еще не создан)
4. **Создайте сервисный аккаунт**:
   - Перейдите в "Сервисные аккаунты"
   - Создайте новый сервисный аккаунт
   - Назначьте роль `storage.editor`
5. **Создайте статический ключ доступа**:
   - Выберите сервисный аккаунт
   - Создайте новый ключ
   - Сохраните `key_id` и `secret`

## API Endpoints

### Загрузка файлов

```bash
# Загрузить любой файл
POST /files/upload
Content-Type: multipart/form-data
Authorization: Bearer <jwt_token>

# Загрузить изображение
POST /files/upload-image
Content-Type: multipart/form-data
Authorization: Bearer <jwt_token>
```

### Управление файлами

```bash
# Получить список файлов в папке
GET /files/list
Authorization: Bearer <jwt_token>

# Скачать файл
GET /files/download/{key}
Authorization: Bearer <jwt_token>

# Получить информацию о файле
GET /files/info/{key}
Authorization: Bearer <jwt_token>

# Получить публичный URL файла
GET /files/url/{key}
Authorization: Bearer <jwt_token>

# Удалить файл
DELETE /files/{key}
Authorization: Bearer <jwt_token>

# Удалить все файлы из бакета
DELETE /files/cleanup/all
Authorization: Bearer <jwt_token>

# Проверить существование файла
GET /files/exists/{key}
Authorization: Bearer <jwt_token>
```

## Примеры использования

### Загрузка изображения профиля

```javascript
const formData = new FormData();
formData.append('image', file);
formData.append('folder', 'profile-images');

const response = await fetch('/files/upload-image', {
  method: 'POST',
  headers: {
    Authorization: `Bearer ${token}`,
  },
  body: formData,
});

const result = await response.json();
// result.data.url - публичный URL файла
// result.data.key - ключ файла в хранилище
// result.data.location - полный URL файла
```

### Получение списка файлов

```javascript
const response = await fetch('/files/list?folder=images', {
  headers: {
    Authorization: `Bearer ${token}`,
  },
});

const { data } = await response.json();
// data.Contents - список файлов
// data.CommonPrefixes - список папок
```

### Скачивание файла

```javascript
const response = await fetch(`/files/download/${fileKey}`, {
  headers: {
    Authorization: `Bearer ${token}`,
  },
});

const { data } = await response.json();
// data.buffer - файл в base64 формате
// data.size - размер файла
```

### Получение публичного URL

```javascript
const response = await fetch(`/files/url/${fileKey}`, {
  headers: {
    Authorization: `Bearer ${token}`,
  },
});

const { url } = await response.json();
// url - публичный URL файла
```

## Особенности easy-yandex-s3

- **Простая настройка** - минимум конфигурации
- **Автоматическое создание папок** - не нужно создавать папки заранее
- **Поддержка оригинальных имен файлов** - можно сохранить исходное имя
- **Генерация UUID имен** - автоматически для уникальности
- **Скачивание файлов** - как буфер или в файл
- **Массовые операции** - загрузка папок, очистка бакета
- **Отладочный режим** - включен в development

## Преимущества перед AWS SDK

- **Специализация** - создана именно для Yandex Cloud
- **Простота** - меньше кода для базовых операций
- **TypeScript поддержка** - встроенные типы
- **Документация на русском** - легче понять
- **Меньше зависимостей** - только необходимые пакеты

## Ссылки

- [easy-yandex-s3 на npm](https://www.npmjs.com/package/easy-yandex-s3)
- [Документация Yandex Cloud Object Storage](https://cloud.yandex.ru/docs/storage/s3/)
- [GitHub репозиторий](https://github.com/powerdot/easy-yandex-s3)
