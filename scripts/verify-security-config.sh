#!/bin/bash

# Script para verificar la configuración de seguridad
# Uso: ./scripts/verify-security-config.sh

echo "🔒 Verificando configuración de seguridad..."
echo "=========================================="

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Función para verificar variable
check_var() {
    local var_name=$1
    local var_value=$2
    local required=$3
    
    if [ -z "$var_value" ]; then
        if [ "$required" = "true" ]; then
            echo -e "${RED}❌ $var_name: NO CONFIGURADA (REQUERIDA)${NC}"
            return 1
        else
            echo -e "${YELLOW}⚠️  $var_name: NO CONFIGURADA (OPCIONAL)${NC}"
            return 0
        fi
    else
        echo -e "${GREEN}✅ $var_name: $var_value${NC}"
        return 0
    fi
}

# Cargar variables del .env
if [ -f ".env" ]; then
    echo "📁 Cargando variables desde .env..."
    export $(cat .env | grep -v '^#' | xargs)
else
    echo -e "${RED}❌ Archivo .env no encontrado${NC}"
    exit 1
fi

echo ""
echo "🔧 Variables de Seguridad:"
echo "---------------------------"

# Variables requeridas
required_vars=(
    "VALID_API_KEYS"
    "MAX_PAYLOAD_SIZE"
    "RATE_LIMIT_WINDOW_MS"
    "RATE_LIMIT_MAX_REQUESTS"
)

# Variables opcionales
optional_vars=(
    "SECURITY_LOG_LEVEL"
    "ENABLE_SECURITY_LOGGING"
)

# Verificar variables requeridas
echo "📋 Variables Requeridas:"
errors=0
for var in "${required_vars[@]}"; do
    if ! check_var "$var" "${!var}" "true"; then
        errors=$((errors + 1))
    fi
done

echo ""
echo "📋 Variables Opcionales:"
for var in "${optional_vars[@]}"; do
    check_var "$var" "${!var}" "false"
done

echo ""
echo "📊 Resumen de Configuración:"
echo "----------------------------"

# Verificar configuración de rate limiting
if [ -n "$RATE_LIMIT_WINDOW_MS" ] && [ -n "$RATE_LIMIT_MAX_REQUESTS" ]; then
    window_minutes=$((RATE_LIMIT_WINDOW_MS / 60000))
    echo -e "${GREEN}✅ Rate Limiting: $RATE_LIMIT_MAX_REQUESTS requests por $window_minutes minutos${NC}"
else
    echo -e "${RED}❌ Rate Limiting: No configurado correctamente${NC}"
    errors=$((errors + 1))
fi

# Verificar tamaño máximo de payload
if [ -n "$MAX_PAYLOAD_SIZE" ]; then
    payload_mb=$((MAX_PAYLOAD_SIZE / 1048576))
    echo -e "${GREEN}✅ Max Payload: ${payload_mb}MB${NC}"
else
    echo -e "${RED}❌ Max Payload: No configurado${NC}"
    errors=$((errors + 1))
fi

# Verificar API keys
if [ -n "$VALID_API_KEYS" ]; then
    key_count=$(echo "$VALID_API_KEYS" | tr ',' '\n' | wc -l)
    echo -e "${GREEN}✅ API Keys: $key_count keys configuradas${NC}"
else
    echo -e "${RED}❌ API Keys: No configuradas${NC}"
    errors=$((errors + 1))
fi

# Verificar logging
if [ "$ENABLE_SECURITY_LOGGING" = "true" ]; then
    echo -e "${GREEN}✅ Security Logging: Habilitado${NC}"
    if [ -n "$SECURITY_LOG_LEVEL" ]; then
        echo -e "${GREEN}✅ Log Level: $SECURITY_LOG_LEVEL${NC}"
    else
        echo -e "${YELLOW}⚠️  Log Level: Usando valor por defecto (info)${NC}"
    fi
else
    echo -e "${YELLOW}⚠️  Security Logging: Deshabilitado${NC}"
fi

echo ""
echo "=========================================="

if [ $errors -eq 0 ]; then
    echo -e "${GREEN}🎉 Configuración de seguridad VERIFICADA correctamente${NC}"
    echo ""
    echo "📝 Variables configuradas en .env:"
    echo "----------------------------------"
    echo "VALID_API_KEYS=$VALID_API_KEYS"
    echo "SECURITY_LOG_LEVEL=${SECURITY_LOG_LEVEL:-info}"
    echo "ENABLE_SECURITY_LOGGING=${ENABLE_SECURITY_LOGGING:-false}"
    echo "MAX_PAYLOAD_SIZE=${MAX_PAYLOAD_SIZE:-10485760}"
    echo "RATE_LIMIT_WINDOW_MS=${RATE_LIMIT_WINDOW_MS:-900000}"
    echo "RATE_LIMIT_MAX_REQUESTS=${RATE_LIMIT_MAX_REQUESTS:-100}"
    exit 0
else
    echo -e "${RED}❌ Se encontraron $errors errores en la configuración${NC}"
    echo ""
    echo "🔧 Para solucionar, agrega estas variables a tu .env:"
    echo "---------------------------------------------------"
    echo "VALID_API_KEYS=pritzio-dev-key,pritzio-prod-key"
    echo "SECURITY_LOG_LEVEL=info"
    echo "ENABLE_SECURITY_LOGGING=true"
    echo "MAX_PAYLOAD_SIZE=10485760"
    echo "RATE_LIMIT_WINDOW_MS=900000"
    echo "RATE_LIMIT_MAX_REQUESTS=100"
    exit 1
fi
