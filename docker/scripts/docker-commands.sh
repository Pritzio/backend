#!/bin/bash

# ========================================
# Script de Comandos Docker para Pritzio Backend
# ========================================

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Función para mostrar ayuda
show_help() {
    echo -e "${BLUE}Comandos Docker disponibles para Pritzio Backend:${NC}"
    echo ""
    echo -e "${GREEN}Desarrollo:${NC}"
    echo "  ./docker-commands.sh dev          - Iniciar entorno de desarrollo"
    echo "  ./docker-commands.sh dev-build    - Construir e iniciar entorno de desarrollo"
    echo "  ./docker-commands.sh dev-logs     - Ver logs del entorno de desarrollo"
    echo "  ./docker-commands.sh dev-stop     - Detener entorno de desarrollo"
    echo ""
    echo -e "${GREEN}Producción:${NC}"
    echo "  ./docker-commands.sh prod         - Iniciar entorno de producción"
    echo "  ./docker-commands.sh prod-build   - Construir e iniciar entorno de producción"
    echo "  ./docker-commands.sh prod-logs    - Ver logs del entorno de producción"
    echo "  ./docker-commands.sh prod-stop    - Detener entorno de producción"
    echo ""
    echo -e "${GREEN}Base de Datos:${NC}"
    echo "  ./docker-commands.sh db-start     - Solo iniciar PostgreSQL"
    echo "  ./docker-commands.sh db-stop      - Solo detener PostgreSQL"
    echo "  ./docker-commands.sh db-reset     - Resetear base de datos"
    echo "  ./docker-commands.sh db-backup    - Hacer backup de la base de datos"
    echo ""
    echo -e "${GREEN}Redis:${NC}"
    echo "  ./docker-commands.sh redis-start  - Solo iniciar Redis"
    echo "  ./docker-commands.sh redis-stop   - Solo detener Redis"
    echo "  ./docker-commands.sh redis-cli    - Acceder a Redis CLI"
    echo ""
    echo -e "${GREEN}Utilidades:${NC}"
    echo "  ./docker-commands.sh logs         - Ver logs de todos los servicios"
    echo "  ./docker-commands.sh status       - Estado de todos los servicios"
    echo "  ./docker-commands.sh clean        - Limpiar contenedores e imágenes no utilizadas"
    echo "  ./docker-commands.sh help         - Mostrar esta ayuda"
}

# Función para verificar si Docker está corriendo
check_docker() {
    if ! docker info > /dev/null 2>&1; then
        echo -e "${RED}Error: Docker no está corriendo. Inicia Docker Desktop primero.${NC}"
        exit 1
    fi
}

# Función para verificar si docker-compose está disponible
check_compose() {
    if ! command -v docker-compose &> /dev/null; then
        echo -e "${RED}Error: docker-compose no está instalado.${NC}"
        exit 1
    fi
}

# Función para mostrar estado de servicios
show_status() {
    echo -e "${BLUE}Estado de los servicios Docker:${NC}"
    echo ""
    docker-compose ps
    echo ""
    echo -e "${BLUE}Uso de recursos:${NC}"
    docker stats --no-stream --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.NetIO}}"
}

# Función para mostrar logs
show_logs() {
    echo -e "${BLUE}Logs de todos los servicios:${NC}"
    docker-compose logs -f
}

# Función para limpiar Docker
clean_docker() {
    echo -e "${YELLOW}Limpiando contenedores e imágenes no utilizadas...${NC}"
    docker system prune -f
    docker volume prune -f
    echo -e "${GREEN}Limpieza completada.${NC}"
}

# Función para desarrollo
dev_start() {
    echo -e "${GREEN}Iniciando entorno de desarrollo...${NC}"
    docker-compose -f docker-compose.dev.yml up -d
    echo -e "${GREEN}Base de datos y Redis iniciados.${NC}"
    echo -e "${BLUE}Para desarrollo local, ejecuta: npm run start:dev${NC}"
}

dev_build() {
    echo -e "${GREEN}Construyendo e iniciando entorno de desarrollo...${NC}"
    docker-compose -f docker-compose.dev.yml up -d --build
}

dev_logs() {
    docker-compose -f docker-compose.dev.yml logs -f
}

dev_stop() {
    echo -e "${YELLOW}Deteniendo entorno de desarrollo...${NC}"
    docker-compose -f docker-compose.dev.yml down
}

# Función para producción
prod_start() {
    echo -e "${GREEN}Iniciando entorno de producción...${NC}"
    docker-compose -f docker-compose.yml up -d
}

prod_build() {
    echo -e "${GREEN}Construyendo e iniciando entorno de producción...${NC}"
    docker-compose -f docker-compose.yml up -d --build
}

prod_logs() {
    docker-compose logs -f
}

prod_stop() {
    echo -e "${YELLOW}Deteniendo entorno de producción...${NC}"
    docker-compose down
}

# Función para base de datos
db_start() {
    echo -e "${GREEN}Iniciando solo PostgreSQL...${NC}"
    docker-compose up -d postgres
}

db_stop() {
    echo -e "${YELLOW}Deteniendo PostgreSQL...${NC}"
    docker-compose stop postgres
}

db_reset() {
    echo -e "${RED}⚠️  ADVERTENCIA: Esto eliminará todos los datos de la base de datos.${NC}"
    read -p "¿Estás seguro? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo -e "${YELLOW}Reseteando base de datos...${NC}"
        docker-compose down -v
        docker-compose up -d postgres
        echo -e "${GREEN}Base de datos reseteada.${NC}"
    else
        echo -e "${BLUE}Operación cancelada.${NC}"
    fi
}

db_backup() {
    echo -e "${GREEN}Creando backup de la base de datos...${NC}"
    mkdir -p ./backups
    docker-compose exec postgres pg_dump -U pritzio_user pritzio > "./backups/backup_$(date +%Y%m%d_%H%M%S).sql"
    echo -e "${GREEN}Backup creado en ./backups/${NC}"
}

# Función para Redis
redis_start() {
    echo -e "${GREEN}Iniciando solo Redis...${NC}"
    docker-compose up -d redis
}

redis_stop() {
    echo -e "${YELLOW}Deteniendo Redis...${NC}"
    docker-compose stop redis
}

redis_cli() {
    echo -e "${GREEN}Accediendo a Redis CLI...${NC}"
    docker-compose exec redis redis-cli
}

# Verificar Docker y docker-compose
check_docker
check_compose

# Procesar argumentos
case "$1" in
    "dev")
        dev_start
        ;;
    "dev-build")
        dev_build
        ;;
    "dev-logs")
        dev_logs
        ;;
    "dev-stop")
        dev_stop
        ;;
    "prod")
        prod_start
        ;;
    "prod-build")
        prod_build
        ;;
    "prod-logs")
        prod_logs
        ;;
    "prod-stop")
        prod_stop
        ;;
    "db-start")
        db_start
        ;;
    "db-stop")
        db_stop
        ;;
    "db-reset")
        db_reset
        ;;
    "db-backup")
        db_backup
        ;;
    "redis-start")
        redis_start
        ;;
    "redis-stop")
        redis_stop
        ;;
    "redis-cli")
        redis_cli
        ;;
    "logs")
        show_logs
        ;;
    "status")
        show_status
        ;;
    "clean")
        clean_docker
        ;;
    "help"|"--help"|"-h"|"")
        show_help
        ;;
    *)
        echo -e "${RED}Comando no reconocido: $1${NC}"
        echo "Usa './docker-commands.sh help' para ver comandos disponibles."
        exit 1
        ;;
esac
