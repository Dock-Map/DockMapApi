#!/bin/bash

# Скрипт для развертывания DockMap API в Yandex Cloud
# Убедитесь, что у вас установлен и настроен Yandex Cloud CLI (yc)

set -e  # Выходить при любой ошибке

# Цвета для вывода
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Функция для вывода сообщений
log() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1"
    exit 1
}

# Проверка зависимостей
check_dependencies() {
    log "Проверка зависимостей..."
    
    if ! command -v yc &> /dev/null; then
        error "Yandex Cloud CLI не установлен. Установите его из https://cloud.yandex.ru/docs/cli/quickstart"
    fi
    
    if ! command -v docker &> /dev/null; then
        error "Docker не установлен"
    fi
    
    if [[ ! -f ".env.production" ]]; then
        error "Файл .env.production не найден. Скопируйте production.env.template в .env.production и заполните значения"
    fi
    
    log "Все зависимости установлены ✓"
}

# Настройка переменных
setup_variables() {
    log "Настройка переменных..."
    
    # Получаем текущий folder-id
    FOLDER_ID=$(yc config get folder-id)
    if [[ -z "$FOLDER_ID" ]]; then
        error "Folder ID не настроен. Выполните: yc config set folder-id YOUR_FOLDER_ID"
    fi
    
    # Основные переменные
    REGISTRY_NAME="dockmap-registry"
    CONTAINER_NAME="dockmap-api"
    IMAGE_NAME="dockmap-api"
    SERVICE_ACCOUNT_NAME="dockmap-service-account"
    
    # Получаем registry ID
    REGISTRY_ID=$(yc container registry get $REGISTRY_NAME --format json 2>/dev/null | jq -r '.id' || echo "")
    
    log "Folder ID: $FOLDER_ID"
    log "Registry: $REGISTRY_NAME"
    log "Container: $CONTAINER_NAME"
}

# Создание Container Registry
create_registry() {
    if [[ -z "$REGISTRY_ID" ]]; then
        log "Создание Container Registry..."
        yc container registry create --name $REGISTRY_NAME
        REGISTRY_ID=$(yc container registry get $REGISTRY_NAME --format json | jq -r '.id')
        log "Registry создан: $REGISTRY_ID"
    else
        log "Registry уже существует: $REGISTRY_ID"
    fi
}

# Создание Service Account
create_service_account() {
    log "Создание Service Account..."
    
    SA_ID=$(yc iam service-account get $SERVICE_ACCOUNT_NAME --format json 2>/dev/null | jq -r '.id' || echo "")
    
    if [[ -z "$SA_ID" ]]; then
        yc iam service-account create --name $SERVICE_ACCOUNT_NAME --description "Service account for DockMap"
        SA_ID=$(yc iam service-account get $SERVICE_ACCOUNT_NAME --format json | jq -r '.id')
        log "Service Account создан: $SA_ID"
    else
        log "Service Account уже существует: $SA_ID"
    fi
    
    # Назначение ролей
    log "Назначение ролей Service Account..."
    yc resource-manager folder add-access-binding $FOLDER_ID \
        --role container-registry.images.puller \
        --subject serviceAccount:$SA_ID || true
        
    yc resource-manager folder add-access-binding $FOLDER_ID \
        --role serverless-containers.invoker \
        --subject serviceAccount:$SA_ID || true
}

# Сборка и публикация Docker образа
build_and_push_image() {
    log "Сборка Docker образа..."
    
    # Настройка Docker для работы с Yandex Container Registry
    yc container registry configure-docker
    
    # Тег для образа
    IMAGE_TAG="cr.yandex/$REGISTRY_ID/$IMAGE_NAME:latest"
    
    # Сборка образа
    docker build -t $IMAGE_TAG .
    
    log "Публикация образа в Container Registry..."
    docker push $IMAGE_TAG
    
    log "Образ опубликован: $IMAGE_TAG"
}

# Создание Serverless Container
create_serverless_container() {
    log "Создание Serverless Container..."
    
    IMAGE_TAG="cr.yandex/$REGISTRY_ID/$IMAGE_NAME:latest"
    
    # Проверяем, существует ли контейнер
    CONTAINER_ID=$(yc serverless container get $CONTAINER_NAME --format json 2>/dev/null | jq -r '.id' || echo "")
    
    if [[ -z "$CONTAINER_ID" ]]; then
        # Создаем новый контейнер
        yc serverless container create --name $CONTAINER_NAME
        CONTAINER_ID=$(yc serverless container get $CONTAINER_NAME --format json | jq -r '.id')
        log "Serverless Container создан: $CONTAINER_ID"
    else
        log "Serverless Container уже существует: $CONTAINER_ID"
    fi
    
    # Создаем ревизию контейнера
    log "Создание ревизии контейнера..."
    yc serverless container revision deploy \
        --container-name $CONTAINER_NAME \
        --image $IMAGE_TAG \
        --cores 1 \
        --memory 1GB \
        --concurrency 16 \
        --execution-timeout 60s \
        --service-account-id $SA_ID \
        --environment NODE_ENV=production,PORT=3000
        
    log "Ревизия контейнера создана"
}

# Получение URL контейнера
get_container_url() {
    log "Получение URL контейнера..."
    
    CONTAINER_URL=$(yc serverless container get $CONTAINER_NAME --format json | jq -r '.url')
    
    if [[ "$CONTAINER_URL" != "null" && -n "$CONTAINER_URL" ]]; then
        log "URL контейнера: $CONTAINER_URL"
        echo ""
        echo "🚀 Развертывание завершено!"
        echo "📍 URL API: $CONTAINER_URL"
        echo "🔗 Проверьте API: $CONTAINER_URL/api"
        echo ""
    else
        warn "Не удалось получить URL контейнера"
    fi
}

# Основная функция
main() {
    log "Начало развертывания DockMap API в Yandex Cloud..."
    
    check_dependencies
    setup_variables
    create_registry
    create_service_account
    build_and_push_image
    create_serverless_container
    get_container_url
    
    log "Развертывание завершено успешно! 🎉"
}

# Обработка аргументов командной строки
case "${1:-}" in
    "registry")
        setup_variables
        create_registry
        ;;
    "build")
        setup_variables
        build_and_push_image
        ;;
    "deploy")
        setup_variables
        create_serverless_container
        ;;
    "")
        main
        ;;
    *)
        echo "Использование: $0 [registry|build|deploy]"
        echo ""
        echo "Команды:"
        echo "  registry  - Создать только Container Registry"
        echo "  build     - Собрать и загрузить образ"
        echo "  deploy    - Развернуть Serverless Container"
        echo "  (без параметров) - Полное развертывание"
        exit 1
        ;;
esac
