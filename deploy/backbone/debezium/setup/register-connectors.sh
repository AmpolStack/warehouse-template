#!/bin/bash
set -e

DEBEZIUM_URL="http://debezium-connect:8083"

echo ">>> Esperando a que Debezium Connect esté disponible..."
until curl -sf "${DEBEZIUM_URL}/connectors" > /dev/null; do
  echo "    Debezium aún no está listo. Reintentando en 5s..."
  sleep 5
done
echo ">>> Debezium Connect está listo."

# Función para registrar o actualizar un conector
register_connector() {
  local name=$1
  local config_file=$2

  echo ">>> Registrando conector: ${name}"

  # Si ya existe, eliminarlo para garantizar una configuración limpia
  if curl -sf "${DEBEZIUM_URL}/connectors/${name}" > /dev/null 2>&1; then
    echo "    El conector '${name}' ya existe. Eliminando para recrearlo..."
    curl -sf -X DELETE "${DEBEZIUM_URL}/connectors/${name}"
    sleep 2
  fi

  # Registrar el conector
  HTTP_STATUS=$(curl -s -o /tmp/response.txt -w "%{http_code}" \
    -X POST \
    -H "Content-Type: application/json" \
    --data "@${config_file}" \
    "${DEBEZIUM_URL}/connectors")

  if [ "${HTTP_STATUS}" -ge 200 ] && [ "${HTTP_STATUS}" -lt 300 ]; then
    echo "    Conector '${name}' registrado exitosamente (HTTP ${HTTP_STATUS})."
  else
    echo "    ERROR al registrar '${name}' (HTTP ${HTTP_STATUS}):"
    cat /tmp/response.txt
    exit 1
  fi
}

# Registrar todos los conectores Source (CDC)
register_connector "user-database-connector"    "/connectors/user-database-config.json"
register_connector "product-database-connector" "/connectors/product-database-config.json"
register_connector "sales-database-connector"   "/connectors/sales-database.json"

# Registrar el conector Sink (S3/RustFS)
register_connector "s3-sink" "/connectors/s3-sink-config.json"

echo ""
echo ">>> Todos los conectores fueron registrados exitosamente."
