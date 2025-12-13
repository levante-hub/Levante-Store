import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { swaggerUI } from '@hono/swagger-ui'
import mcps from './routes/mcps'
import { errorHandler, notFoundHandler } from './middleware/errorHandler'
import { openApiSpec } from './openapi'

const app = new Hono<{ Bindings: CloudflareBindings }>();

// CORS global - permite acceso desde cualquier origen
app.use(
  '*',
  cors({
    origin: '*',
    allowMethods: ['GET', 'OPTIONS'],
    allowHeaders: ['Content-Type'],
    maxAge: 86400,
  })
);

// Logger middleware - registra todas las peticiones
app.use('*', async (c, next) => {
  const start = Date.now();
  await next();
  const ms = Date.now() - start;
  console.log(`${c.req.method} ${c.req.url} - ${c.res.status} (${ms}ms)`);
});

// Error handler middleware
app.use('*', errorHandler);

// Montar rutas de API
app.route('/api', mcps);

// OpenAPI spec endpoint
app.get('/openapi.json', (c) => {
  return c.json(openApiSpec);
});

// Swagger UI at root
app.get('/', swaggerUI({ url: '/openapi.json' }))

// 404 handler - debe ir al final
app.notFound(notFoundHandler);

export default app
