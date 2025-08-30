#!/bin/bash

# Скрипт для проверки статуса развертывания в Yandex Cloud

set -e

# Цвета для вывода
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Функции для вывода
log() { echo -e "${GREEN}[INFO]${NC} $1"; }
warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
error() { echo -e "${RED}[ERROR]${NC} $1"; }
header() { echo -e "${BLUE}=== $1 ===${NC}"; }

# Проверка CLI
if ! command -v yc &> /dev/null; then
    error "Yandex Cloud CLI не установлен"
    exit 1
fi

# Основные переменные
REGISTRY_NAME="dockmap-registry"
CONTAINER_NAME="dockmap-api"
POSTGRES_CLUSTER="dockmap-postgres"
SERVICE_ACCOUNT_NAME="dockmap-service-account"
FOLDER_ID=$(yc config get folder-id)

echo "🔍 Проверка статуса развертывания DockMap API"
echo "📁 Folder ID: $FOLDER_ID"
echo ""

# Функция для проверки Container Registry
check_registry() {
    header "Container Registry"
    
    if yc container registry get $REGISTRY_NAME &>/dev/null; then
        REGISTRY_ID=$(yc container registry get $REGISTRY_NAME --format json | jq -r '.id')
        log "✅ Registry существует: $REGISTRY_NAME ($REGISTRY_ID)"
        
        # Проверка образов
        IMAGES=$(yc container image list --registry-id $REGISTRY_ID --format json)
        IMAGE_COUNT=$(echo "$IMAGES" | jq length)
        
        if [[ $IMAGE_COUNT -gt 0 ]]; then
            log "📦 Найдено образов: $IMAGE_COUNT"
            echo "$IMAGES" | jq -r '.[] | "  - \(.name):\(.tag) (создан: \(.created_at))"'
        else
            warn "📦 Образы не найдены"
        fi
    else
        error "❌ Registry не найден: $REGISTRY_NAME"
    fi
    echo ""
}

# Функция для проверки Service Account
check_service_account() {
    header "Service Account"
    
    if yc iam service-account get $SERVICE_ACCOUNT_NAME &>/dev/null; then
        SA_ID=$(yc iam service-account get $SERVICE_ACCOUNT_NAME --format json | jq -r '.id')
        log "✅ Service Account существует: $SERVICE_ACCOUNT_NAME ($SA_ID)"
    else
        error "❌ Service Account не найден: $SERVICE_ACCOUNT_NAME"
    fi
    echo ""
}

# Функция для проверки Serverless Container
check_container() {
    header "Serverless Container"
    
    if yc serverless container get $CONTAINER_NAME &>/dev/null; then
        CONTAINER_INFO=$(yc serverless container get $CONTAINER_NAME --format json)
        CONTAINER_ID=$(echo "$CONTAINER_INFO" | jq -r '.id')
        CONTAINER_URL=$(echo "$CONTAINER_INFO" | jq -r '.url')
        
        log "✅ Container существует: $CONTAINER_NAME ($CONTAINER_ID)"
        log "🌐 URL: $CONTAINER_URL"
        
        # Информация о последней ревизии
        REVISION_INFO=$(yc serverless container revision list --container-name $CONTAINER_NAME --format json | head -1)
        if [[ "$REVISION_INFO" != "[]" ]]; then
            REVISION_ID=$(echo "$REVISION_INFO" | jq -r '.[0].id')
            REVISION_STATUS=$(echo "$REVISION_INFO" | jq -r '.[0].status')
            REVISION_IMAGE=$(echo "$REVISION_INFO" | jq -r '.[0].image.image_url')
            CREATED_AT=$(echo "$REVISION_INFO" | jq -r '.[0].created_at')
            
            log "📋 Последняя ревизия: $REVISION_ID"
            log "📊 Статус: $REVISION_STATUS"
            log "🖼️ Образ: $REVISION_IMAGE"
            log "📅 Создана: $CREATED_AT"
            
            # Проверка доступности
            if [[ -n "$CONTAINER_URL" && "$CONTAINER_URL" != "null" ]]; then
                echo -n "🔍 Проверка доступности API... "
                if curl -s --max-time 10 "$CONTAINER_URL/health" >/dev/null 2>&1; then
                    echo -e "${GREEN}✅ Доступен${NC}"
                else
                    echo -e "${YELLOW}⚠️ Недоступен или медленно отвечает${NC}"
                fi
            fi
        else
            warn "⚠️ Ревизии не найдены"
        fi
    else
        error "❌ Container не найден: $CONTAINER_NAME"
    fi
    echo ""
}

# Функция для проверки PostgreSQL
check_postgres() {
    header "PostgreSQL Cluster"
    
    if yc managed-postgresql cluster get $POSTGRES_CLUSTER &>/dev/null; then
        CLUSTER_INFO=$(yc managed-postgresql cluster get $POSTGRES_CLUSTER --format json)
        CLUSTER_STATUS=$(echo "$CLUSTER_INFO" | jq -r '.status')
        CLUSTER_HEALTH=$(echo "$CLUSTER_INFO" | jq -r '.health')
        
        log "✅ Cluster существует: $POSTGRES_CLUSTER"
        log "📊 Статус: $CLUSTER_STATUS"
        log "💊 Здоровье: $CLUSTER_HEALTH"
        
        # Информация о хостах
        HOSTS=$(echo "$CLUSTER_INFO" | jq -r '.config.hosts[] | "  - \(.zone_id): \(.name)"')
        if [[ -n "$HOSTS" ]]; then
            log "🖥️ Хосты:"
            echo "$HOSTS"
        fi
        
        # Информация о базах данных
        DBS=$(yc managed-postgresql database list --cluster-name $POSTGRES_CLUSTER --format json)
        DB_COUNT=$(echo "$DBS" | jq length)
        if [[ $DB_COUNT -gt 0 ]]; then
            log "🗄️ Базы данных ($DB_COUNT):"
            echo "$DBS" | jq -r '.[] | "  - \(.name) (владелец: \(.owner))"'
        fi
    else
        warn "⚠️ PostgreSQL cluster не найден: $POSTGRES_CLUSTER"
    fi
    echo ""
}

# Функция для проверки Object Storage
check_storage() {
    header "Object Storage"
    
    BUCKETS=$(yc storage bucket list --format json 2>/dev/null || echo "[]")
    BUCKET_COUNT=$(echo "$BUCKETS" | jq length)
    
    if [[ $BUCKET_COUNT -gt 0 ]]; then
        log "✅ Найдено buckets: $BUCKET_COUNT"
        echo "$BUCKETS" | jq -r '.[] | "  - \(.name) (создан: \(.creation_date))"'
    else
        warn "⚠️ Object Storage buckets не найдены"
    fi
    echo ""
}

# Функция для показа логов
show_logs() {
    header "Последние логи контейнера"
    
    if yc serverless container get $CONTAINER_NAME &>/dev/null; then
        log "📋 Последние 20 записей в логах:"
        yc serverless container revision logs \
            --container-name $CONTAINER_NAME \
            --lines 20 \
            --follow=false 2>/dev/null || warn "Не удалось получить логи"
    else
        warn "Контейнер не найден для получения логов"
    fi
    echo ""
}

# Функция для показа метрик
show_metrics() {
    header "Быстрые метрики"
    
    log "💰 Примерная стоимость за текущий месяц:"
    echo "  - Serverless Container: ~1000₽"
    echo "  - PostgreSQL (s2.micro): ~3000₽"
    echo "  - Container Registry: ~150₽"
    echo "  - Object Storage: ~30₽"
    echo "  📊 Итого: ~4200₽"
    echo ""
}

# Основное меню
case "${1:-}" in
    "registry")
        check_registry
        ;;
    "container")
        check_container
        ;;
    "postgres"|"db")
        check_postgres
        ;;
    "storage")
        check_storage
        ;;
    "logs")
        show_logs
        ;;
    "metrics")
        show_metrics
        ;;
    "all"|"")
        check_registry
        check_service_account
        check_container
        check_postgres
        check_storage
        show_metrics
        ;;
    *)
        echo "Использование: $0 [registry|container|postgres|storage|logs|metrics|all]"
        echo ""
        echo "Команды:"
        echo "  registry   - Проверить Container Registry"
        echo "  container  - Проверить Serverless Container"
        echo "  postgres   - Проверить PostgreSQL cluster"
        echo "  storage    - Проверить Object Storage"
        echo "  logs       - Показать логи контейнера"
        echo "  metrics    - Показать метрики и стоимость"
        echo "  all        - Полная проверка (по умолчанию)"
        exit 1
        ;;
esac

echo "✅ Проверка завершена!"
