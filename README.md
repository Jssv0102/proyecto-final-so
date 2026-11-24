# Proyecto Final - Sistemas Operativos

Infraestructura containerizada con Docker Compose: Nginx (proxy inverso + balanceo), 3 backends Node.js con métricas Prometheus, Prometheus, Nginx Prometheus Exporter, cAdvisor y Grafana.

**Integrantes:** Johan Sebastian Sanchez Villa

## Arquitectura

```
Cliente --> Nginx :8080 --> backend1 / backend2 / backend3 (:3000, /metrics)
                 |
          stub_status :8080 interno --> nginx-exporter :9113 --+
backend*:/metrics ---------------------------------------------+--> Prometheus :9090 --> Grafana :3000
cAdvisor :8080 (interno) ---------------------------------------+
```
Todos los servicios comparten la red `monitoring-net`.

## Requisitos previos
- Docker y Docker Compose v2 (`docker --version`, `docker compose version`)
- (Opcional, para pruebas de carga) [k6](https://k6.io/docs/get-started/installation/)

## Levantar la infraestructura
```bash
docker compose up -d --build
docker compose ps
```

## URLs de acceso
| Servicio    | URL                               |
|-------------|-----------------------------------|
| Nginx       | http://localhost:8080             |
| Prometheus  | http://localhost:9090/targets     |
| Grafana     | http://localhost:3000 (admin/admin) |

El dashboard "Infraestructura - Proyecto Final" se carga automáticamente.

## Verificar el balanceo de carga
```bash
for i in $(seq 1 9); do curl -s http://localhost:8080/ ; echo; done
```
Cada respuesta indica la `instancia` (1, 2 o 3); deben alternarse (round-robin). También puedes ver el header `X-Upstream`:
```bash
curl -i http://localhost:8080/
```

## Verificar métricas
- En Prometheus → Status → Targets: `backend` (3), `nginx`, `cadvisor` y `prometheus` deben estar en estado **UP**.

## Pruebas de carga
```bash
k6 run loadtest/test.js
```
Mientras corre, observa el dashboard en Grafana (latencia, tasa de solicitudes, CPU, memoria, red y disco).

## Detener
```bash
docker compose down        # conserva volúmenes
docker compose down -v     # elimina también los datos
```

## Notas
- cAdvisor requiere acceso a `/var/lib/docker`; en Docker Desktop (Windows/Mac) algunas métricas por contenedor pueden variar. Se recomienda Linux o WSL2.
- Si el puerto 3000 u 8080 están ocupados, cambia el mapeo en `docker-compose.yml`.
