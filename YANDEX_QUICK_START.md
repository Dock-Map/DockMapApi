# 🚀 Быстрый старт в Yandex Cloud

## Подготовка (5 минут)

1. **Установка Yandex Cloud CLI**
   ```bash
   curl -sSL https://storage.yandexcloud.net/yandexcloud-yc/install.sh | bash
   exec -l $SHELL
   ```

2. **Авторизация**
   ```bash
   yc init
   ```

3. **Настройка переменных окружения**
   ```bash
   cp production.env.template .env.production
   # Отредактируйте .env.production с вашими данными
   ```

## Развертывание (1 команда)

```bash
./deploy.sh
```

## Проверка статуса

```bash
./status.sh
```

## Что создается

- ✅ **Container Registry** - для Docker образов
- ✅ **Serverless Container** - для запуска API  
- ✅ **Service Account** - для доступа к ресурсам
- ⚠️ **PostgreSQL** - создайте вручную (см. полную документацию)

## После развертывания

1. Создайте PostgreSQL кластер:
   ```bash
   yc managed-postgresql cluster create \
     --name dockmap-postgres \
     --environment production \
     --resource-preset s2.micro \
     --disk-size 20 \
     --user name=dockmap_user,password=YOUR_PASSWORD \
     --database name=dockmap_prod,owner=dockmap_user
   ```

2. Обновите `.env.production` с данными БД

3. Пересоберите контейнер:
   ```bash
   ./deploy.sh build
   ./deploy.sh deploy
   ```

## Полезные команды

- `./status.sh` - проверка всех сервисов
- `./status.sh logs` - просмотр логов
- `./deploy.sh build` - только сборка образа
- `yc serverless container revision logs --container-name dockmap-api` - детальные логи

## Стоимость

~4200₽/месяц при средней нагрузке

## Проблемы?

1. Проверьте логи: `./status.sh logs`
2. Убедитесь, что `.env.production` заполнен
3. Проверьте доступ к БД
4. См. полную документацию: `YANDEX_CLOUD_DEPLOYMENT.md`
