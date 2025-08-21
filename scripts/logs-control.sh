#!/bin/bash

# Script para controlar logs de la aplicación Pritzio Backend
# Uso: ./scripts/logs-control.sh [on|off|typeorm-on|typeorm-off|nestjs-on|nestjs-off|status]

set -e

ENV_FILE=".env"

# Función para mostrar ayuda
show_help() {
    echo "🎛️  Control de Logs - Pritzio Backend"
    echo ""
    echo "Uso: $0 [comando]"
    echo ""
    echo "Comandos disponibles:"
    echo "  on          - Activar TODOS los logs (TypeORM + NestJS)"
    echo "  off         - Desactivar TODOS los logs (solo errores y warnings)"
    echo "  typeorm-on  - Activar solo logs de TypeORM (SQL queries)"
    echo "  typeorm-off - Desactivar logs de TypeORM"
    echo "  nestjs-on   - Activar logs de NestJS (aplicación)"
    echo "  nestjs-off  - Desactivar logs de NestJS"
    echo "  status      - Mostrar estado actual de los logs"
    echo "  help        - Mostrar esta ayuda"
    echo ""
    echo "Ejemplos:"
    echo "  $0 on          # Activar todos los logs"
    echo "  $0 typeorm-off # Desactivar logs SQL"
    echo "  $0 status      # Ver configuración actual"
}



# Función para actualizar variable en .env
update_env_var() {
    local var_name="$1"
    local var_value="$2"
    
    # Remover línea existente si existe
    if grep -q "^${var_name}=" "$ENV_FILE"; then
        sed -i '' "/^${var_name}=/d" "$ENV_FILE"
    fi
    
    # Agregar nueva línea
    echo "${var_name}=${var_value}" >> "$ENV_FILE"
    echo "✅ ${var_name}=${var_value}"
}

# Función para mostrar estado actual
show_status() {
    echo "📊 Estado Actual de Logs:"
    echo ""
    
    echo "🔧 Configuración en .env:"
    if [ -f "$ENV_FILE" ]; then
        if grep -q "^ENABLE_LOGGING=" "$ENV_FILE"; then
            echo "  ENABLE_LOGGING=$(grep "^ENABLE_LOGGING=" "$ENV_FILE" | cut -d'=' -f2)"
        else
            echo "  ENABLE_LOGGING=no configurado"
        fi
        
        if grep -q "^TYPEORM_LOGGING=" "$ENV_FILE"; then
            echo "  TYPEORM_LOGGING=$(grep "^TYPEORM_LOGGING=" "$ENV_FILE" | cut -d'=' -f2)"
        else
            echo "  TYPEORM_LOGGING=no configurado"
        fi
        
        if grep -q "^NESTJS_LOG_LEVELS=" "$ENV_FILE"; then
            echo "  NESTJS_LOG_LEVELS=$(grep "^NESTJS_LOG_LEVELS=" "$ENV_FILE" | cut -d'=' -f2)"
        fi
    else
        echo "❌ Archivo .env no encontrado"
    fi
    
    echo ""
    echo "💡 Para aplicar cambios, reinicia la aplicación:"
    echo "   npm run start:dev"
}

# Función para activar todos los logs
enable_all_logs() {
    echo "🚀 Activando TODOS los logs..."
    update_env_var "ENABLE_LOGGING" "true"
    update_env_var "TYPEORM_LOGGING" "true"
    update_env_var "NESTJS_LOG_LEVELS" "error,warn,log,debug,verbose"
    echo ""
    echo "✅ Todos los logs activados. Reinicia la aplicación para aplicar cambios."
}

# Función para desactivar todos los logs
disable_all_logs() {
    echo "🔇 Desactivando TODOS los logs..."
    update_env_var "ENABLE_LOGGING" "false"
    update_env_var "TYPEORM_LOGGING" "false"
    update_env_var "NESTJS_LOG_LEVELS" "error,warn"
    echo ""
    echo "✅ Todos los logs desactivados. Solo se mostrarán errores y warnings."
    echo "   Reinicia la aplicación para aplicar cambios."
}

# Función para controlar logs de TypeORM
control_typeorm_logs() {
    local action="$1"
    
    if [ "$action" = "on" ]; then
        echo "📊 Activando logs de TypeORM (SQL queries)..."
        update_env_var "TYPEORM_LOGGING" "true"
        echo "✅ Logs de TypeORM activados. Reinicia la aplicación para aplicar cambios."
    else
        echo "🔇 Desactivando logs de TypeORM (SQL queries)..."
        update_env_var "TYPEORM_LOGGING" "false"
        echo "✅ Logs de TypeORM desactivados. Reinicia la aplicación para aplicar cambios."
    fi
}

# Función para controlar logs de NestJS
control_nestjs_logs() {
    local action="$1"
    
    if [ "$action" = "on" ]; then
        echo "🐦 Activando logs de NestJS (aplicación)..."
        update_env_var "ENABLE_LOGGING" "true"
        update_env_var "NESTJS_LOG_LEVELS" "error,warn,log,debug,verbose"
        echo "✅ Logs de NestJS activados. Reinicia la aplicación para aplicar cambios."
    else
        echo "🔇 Desactivando logs de NestJS (aplicación)..."
        update_env_var "ENABLE_LOGGING" "false"
        update_env_var "NESTJS_LOG_LEVELS" "error,warn"
        echo "✅ Logs de NestJS desactivados. Solo se mostrarán errores y warnings."
        echo "   Reinicia la aplicación para aplicar cambios."
    fi
}

# Función principal
main() {
    case "${1:-help}" in
        "on")
            enable_all_logs
            ;;
        "off")
            disable_all_logs
            ;;
        "typeorm-on")
            control_typeorm_logs "on"
            ;;
        "typeorm-off")
            control_typeorm_logs "off"
            ;;
        "nestjs-on")
            control_nestjs_logs "on"
            ;;
        "nestjs-off")
            control_nestjs_logs "off"
            ;;
        "status")
            show_status
            ;;
        "help"|*)
            show_help
            ;;
    esac
}

# Ejecutar función principal
main "$@"
