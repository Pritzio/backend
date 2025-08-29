#!/bin/bash

# Script de Verificación de Sincronización con GitHub
# Verifica que todos los tags locales estén sincronizados con GitHub

echo "🔍 Verificando sincronización de tags con GitHub..."
echo "=================================================="

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Verificar si estamos en un repositorio Git
if [ ! -d ".git" ]; then
    echo -e "${RED}❌ Error: No estás en un repositorio Git${NC}"
    exit 1
fi

# Verificar conexión con GitHub
echo "📡 Verificando conexión con GitHub..."
if ! git ls-remote origin > /dev/null 2>&1; then
    echo -e "${RED}❌ Error: No se puede conectar con GitHub${NC}"
    echo "Verifica tu conexión a internet y permisos del repositorio"
    exit 1
fi

echo -e "${GREEN}✅ Conexión con GitHub establecida${NC}"

# Obtener tags locales
echo ""
echo "🏷️  Tags locales:"
LOCAL_TAGS=$(git tag --list | sort -V)
if [ -z "$LOCAL_TAGS" ]; then
    echo "   No hay tags locales"
else
    echo "$LOCAL_TAGS" | sed 's/^/   /'
fi

# Obtener tags remotos
echo ""
echo "🌐 Tags en GitHub:"
REMOTE_TAGS=$(git ls-remote --tags origin | sed 's/.*refs\/tags\///' | sort -V)
if [ -z "$REMOTE_TAGS" ]; then
    echo "   No hay tags remotos"
else
    echo "$REMOTE_TAGS" | sed 's/^/   /'
fi

# Comparar tags
echo ""
echo "🔍 Comparando tags..."

# Encontrar tags locales que no están en GitHub
MISSING_IN_GITHUB=""
for tag in $LOCAL_TAGS; do
    if ! echo "$REMOTE_TAGS" | grep -q "^$tag$"; then
        MISSING_IN_GITHUB="$MISSING_IN_GITHUB $tag"
    fi
done

# Encontrar tags en GitHub que no están locales
MISSING_LOCAL=""
for tag in $REMOTE_TAGS; do
    if ! echo "$LOCAL_TAGS" | grep -q "^$tag$"; then
        MISSING_LOCAL="$MISSING_LOCAL $tag"
    fi
done

# Mostrar resultados
if [ -z "$MISSING_IN_GITHUB" ] && [ -z "$MISSING_LOCAL" ]; then
    echo -e "${GREEN}✅ Sincronización perfecta: Todos los tags están sincronizados${NC}"
else
    if [ -n "$MISSING_IN_GITHUB" ]; then
        echo -e "${YELLOW}⚠️  Tags locales que NO están en GitHub:${NC}"
        echo "$MISSING_IN_GITHUB" | sed 's/^/   /'
        echo ""
        echo "💡 Para sincronizar, ejecuta:"
        echo "   git push origin --tags"
    fi
    
    if [ -n "$MISSING_LOCAL" ]; then
        echo -e "${YELLOW}⚠️  Tags en GitHub que NO están locales:${NC}"
        echo "$MISSING_LOCAL" | sed 's/^/   /'
        echo ""
        echo "💡 Para sincronizar, ejecuta:"
        echo "   git fetch --tags"
    fi
fi

# Verificar commits pendientes
echo ""
echo "📝 Verificando commits pendientes..."
PENDING_COMMITS=$(git status --porcelain)
if [ -z "$PENDING_COMMITS" ]; then
    echo -e "${GREEN}✅ No hay cambios pendientes${NC}"
else
    echo -e "${YELLOW}⚠️  Hay cambios pendientes:${NC}"
    echo "$PENDING_COMMITS" | sed 's/^/   /'
    echo ""
    echo "💡 Para sincronizar cambios, ejecuta:"
    echo "   git add ."
    echo "   git commit -m 'tu mensaje'"
    echo "   git push origin main"
fi

# Verificar branch actual
echo ""
echo "🌿 Branch actual:"
CURRENT_BRANCH=$(git branch --show-current)
echo "   $CURRENT_BRANCH"

# Verificar si hay commits por delante del remoto
echo ""
echo "📊 Estado del branch:"
AHEAD=$(git rev-list --count origin/$CURRENT_BRANCH..HEAD 2>/dev/null || echo "0")
BEHIND=$(git rev-list --count HEAD..origin/$CURRENT_BRANCH 2>/dev/null || echo "0")

if [ "$AHEAD" -gt 0 ]; then
    echo -e "${YELLOW}⚠️  $AHEAD commits por delante del remoto${NC}"
    echo "💡 Para sincronizar, ejecuta: git push origin $CURRENT_BRANCH"
fi

if [ "$BEHIND" -gt 0 ]; then
    echo -e "${YELLOW}⚠️  $BEHIND commits por detrás del remoto${NC}"
    echo "💡 Para sincronizar, ejecuta: git pull origin $CURRENT_BRANCH"
fi

if [ "$AHEAD" -eq 0 ] && [ "$BEHIND" -eq 0 ]; then
    echo -e "${GREEN}✅ Branch sincronizado con el remoto${NC}"
fi

echo ""
echo "=================================================="
echo "🔗 Enlaces útiles:"
echo "   Tags: https://github.com/Pritzio/backend/tags"
echo "   Releases: https://github.com/Pritzio/backend/releases"
echo "   Commits: https://github.com/Pritzio/backend/commits/$CURRENT_BRANCH"
echo "=================================================="
