# Развертывание DockMap API в Yandex Cloud

Это руководство поможет развернуть ваше NestJS приложение в Yandex Cloud с использованием Serverless Containers.

## Архитектура развертывания

- **Yandex Container Registry** - для хранения Docker образов
- **Yandex Serverless Containers** - для запуска API
- **Yandex Managed PostgreSQL** - для базы данных
- **Yandex Object Storage** - для статических файлов
- **Yandex API Gateway** - для маршрутизации (опционально)

## Предварительная настройка

### 1. Установка Yandex Cloud CLI

```bash
# Установка через curl (Linux/macOS)
curl -sSL https://storage.yandexcloud.net/yandexcloud-yc/install.sh | bash

# Или через brew (macOS)
brew install yandex-cloud/tap/yc

# Перезагрузите терминал
exec -l $SHELL
```

### 2. Инициализация CLI

```bash
# Авторизация
yc init

# Проверка конфигурации
yc config list
```

### 3. Настройка переменных окружения

```bash
# Скопируйте шаблон
cp production.env.template .env.production

# Отредактируйте файл .env.production и заполните все значения
nano .env.production
```

## Настройка базы данных

### Создание Managed PostgreSQL

```bash
# Создание кластера PostgreSQL
yc managed-postgresql cluster create \
  --name dockmap-postgres \
  --environment production \
  --network-name default \
  --host zone-id=ru-central1-a,assign-public-ip=false \
  --resource-preset s2.micro \
  --disk-size 20 \
  --disk-type network-ssd \
  --user name=dockmap_user,password=YOUR_SECURE_PASSWORD \
  --database name=dockmap_prod,owner=dockmap_user

# Получение хоста базы данных
yc managed-postgresql cluster get dockmap-postgres
```

### Настройка сетевого доступа

```bash
# Создание группы безопасности для PostgreSQL
yc vpc security-group create \
  --name postgres-sg \
  --rule "direction=ingress,port=6432,protocol=tcp,v4-cidrs=[10.0.0.0/8]"

# Присвоение группы безопасности кластеру
yc managed-postgresql cluster update dockmap-postgres \
  --security-group-ids YOUR_SECURITY_GROUP_ID
```

## Развертывание приложения

### Автоматическое развертывание

```bash
# Полное развертывание одной командой
./deploy.sh

# Или поэтапно:
./deploy.sh registry  # Создание Container Registry
./deploy.sh build     # Сборка и загрузка образа
./deploy.sh deploy    # Развертывание контейнера
```

### Ручное развертывание

#### 1. Создание Container Registry

```bash
yc container registry create --name dockmap-registry
```

#### 2. Настройка Docker

```bash
yc container registry configure-docker
```

#### 3. Сборка и публикация образа

```bash
# Получение ID реестра
REGISTRY_ID=$(yc container registry get dockmap-registry --format json | jq -r '.id')

# Сборка образа
docker build -t cr.yandex/$REGISTRY_ID/dockmap-api:latest .

# Публикация образа
docker push cr.yandex/$REGISTRY_ID/dockmap-api:latest
```

#### 4. Создание Service Account

```bash
# Создание сервисного аккаунта
yc iam service-account create --name dockmap-service-account

# Получение ID аккаунта
SA_ID=$(yc iam service-account get dockmap-service-account --format json | jq -r '.id')

# Назначение ролей
yc resource-manager folder add-access-binding $(yc config get folder-id) \
  --role container-registry.images.puller \
  --subject serviceAccount:$SA_ID

yc resource-manager folder add-access-binding $(yc config get folder-id) \
  --role serverless-containers.invoker \
  --subject serviceAccount:$SA_ID
```

#### 5. Создание Serverless Container

```bash
# Создание контейнера
yc serverless container create --name dockmap-api

# Развертывание ревизии
yc serverless container revision deploy \
  --container-name dockmap-api \
  --image cr.yandex/$REGISTRY_ID/dockmap-api:latest \
  --cores 1 \
  --memory 1GB \
  --concurrency 16 \
  --execution-timeout 60s \
  --service-account-id $SA_ID \
  --environment NODE_ENV=production,PORT=3000
```

## Настройка домена (опционально)

### 1. Создание API Gateway

```bash
yc serverless api-gateway create \
  --name dockmap-gateway \
  --spec-from-file api-gateway-spec.yaml
```

### 2. Настройка SSL сертификата

```bash
# Создание сертификата
yc certificate-manager certificate request \
  --name dockmap-cert \
  --domains your-domain.com
```

## Мониторинг и логи

### Просмотр логов

```bash
# Логи контейнера
yc serverless container revision logs --container-name dockmap-api

# Логи с фильтрацией
yc logs read --group-id YOUR_LOG_GROUP_ID --filter 'level >= "ERROR"'
```

### Метрики

```bash
# Получение метрик контейнера
yc monitoring metric list --folder-id $(yc config get folder-id)
```

## Обновление приложения

```bash
# Пересборка и развертывание
./deploy.sh build
./deploy.sh deploy

# Или одной командой
./deploy.sh
```

## Масштабирование

### Настройка автомасштабирования

```bash
yc serverless container revision deploy \
  --container-name dockmap-api \
  --image cr.yandex/$REGISTRY_ID/dockmap-api:latest \
  --cores 2 \
  --memory 2GB \
  --concurrency 32 \
  --execution-timeout 60s \
  --provisioned-instances-count 1 \
  --service-account-id $SA_ID
```

## Безопасность

### Рекомендации

1. **Переменные окружения**: Используйте Yandex Lockbox для хранения секретов
2. **Сеть**: Настройте VPC и группы безопасности
3. **Мониторинг**: Включите аудит логи
4. **Backup**: Настройте резервное копирование базы данных

### Настройка Lockbox

```bash
# Создание секрета
yc lockbox secret create --name dockmap-secrets

# Добавление версии секрета
yc lockbox secret add-version --name dockmap-secrets \
  --payload '[{"key":"JWT_SECRET","textValue":"your-jwt-secret"}]'
```

## Стоимость

### Примерная стоимость в месяц (при средней нагрузке):

- **Serverless Container** (1 vCPU, 1GB): ~1000₽
- **Managed PostgreSQL** (s2.micro): ~3000₽
- **Object Storage** (10GB): ~30₽
- **Container Registry** (5GB): ~150₽

**Итого**: ~4200₽/месяц

## Проблемы и решения

### Проблема: Контейнер не запускается

```bash
# Проверка логов
yc serverless container revision logs --container-name dockmap-api

# Проверка образа
docker run --rm -it cr.yandex/$REGISTRY_ID/dockmap-api:latest /bin/sh
```

### Проблема: Нет доступа к базе данных

1. Проверьте группы безопасности
2. Убедитесь, что хост БД указан правильно
3. Проверьте подключение к VPC

### Проблема: Медленная работа

1. Увеличьте ресурсы контейнера
2. Настройте provisioned instances
3. Оптимизируйте код приложения

## Полезные команды

```bash
# Статус всех ресурсов
yc serverless container list
yc managed-postgresql cluster list
yc container registry list

# Удаление ресурсов
yc serverless container delete dockmap-api
yc managed-postgresql cluster delete dockmap-postgres
yc container registry delete dockmap-registry
```

## Документация

- [Yandex Cloud Serverless Containers](https://cloud.yandex.ru/docs/serverless-containers/)
- [Container Registry](https://cloud.yandex.ru/docs/container-registry/)
- [Managed PostgreSQL](https://cloud.yandex.ru/docs/managed-postgresql/)
- [Object Storage](https://cloud.yandex.ru/docs/storage/)
