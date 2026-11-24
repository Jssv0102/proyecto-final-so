const express = require('express');
const client = require('prom-client');

const app = express();
const PORT = process.env.PORT || 3000;
const INSTANCE = process.env.INSTANCE_ID || 'desconocida';

client.collectDefaultMetrics();

const httpRequests = new client.Counter({
  name: 'http_requests_total',
  help: 'Total de solicitudes HTTP',
  labelNames: ['method', 'route', 'status']
});

const httpDuration = new client.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Latencia de las solicitudes HTTP en segundos',
  labelNames: ['method', 'route', 'status'],
  buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5]
});

// Middleware de instrumentación
app.use((req, res, next) => {
  if (req.path === '/metrics') return next();
  const end = httpDuration.startTimer();
  res.on('finish', () => {
    const labels = { method: req.method, route: req.path, status: res.statusCode };
    httpRequests.inc(labels);
    end(labels);
  });
  next();
});

app.get('/', (req, res) => {
  res.json({
    mensaje: 'Respuesta del backend',
    instancia: INSTANCE,
    hostname: require('os').hostname(),
    hora: new Date().toISOString()
  });
});

// Endpoint con latencia variable y consumo de CPU, útil para pruebas de carga
app.get('/work', (req, res) => {
  let x = 0;
  for (let i = 0; i < 2e6; i++) x += Math.sqrt(i);
  setTimeout(() => res.json({ instancia: INSTANCE, resultado: x }), Math.random() * 100);
});

app.get('/health', (req, res) => res.send('ok'));

app.get('/metrics', async (req, res) => {
  res.set('Content-Type', client.register.contentType);
  res.end(await client.register.metrics());
});

app.listen(PORT, () => console.log(`Backend ${INSTANCE} escuchando en puerto ${PORT}`));
