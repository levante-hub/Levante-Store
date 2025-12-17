import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { swaggerUI } from '@hono/swagger-ui'
import mcpsModule from '@/modules/mcps/routes'
import { errorHandler, notFoundHandler } from '@/shared/middleware/errorHandler'
import { openApiSpec } from '@/openapi'

const app = new Hono();

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
app.route('/api', mcpsModule);

// OpenAPI spec endpoint
app.get('/openapi.json', (c) => {
  return c.json(openApiSpec);
});

// Swagger UI at root
app.get('/', swaggerUI({
  url: '/openapi.json',
  manuallySwaggerUIHtml: (asset) => `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <title>Levante Store API</title>
      ${asset.css.map((url) => `<link rel="stylesheet" href="${url}" />`).join('\n')}
    </head>
    <body>
      <div id="swagger-ui"></div>
      ${asset.js.map((url) => `<script src="${url}" crossorigin></script>`).join('\n')}
      <script>
        window.onload = () => {
          window.ui = SwaggerUIBundle({
            url: '/openapi.json',
            dom_id: '#swagger-ui',
            requestInterceptor: (req) => {
              req.headers['Cache-Control'] = 'no-cache';
              req.headers['Pragma'] = 'no-cache';
              return req;
            }
          });
        };
      </script>
    </body>
    </html>
  `
}))

// 404 handler - debe ir al final
app.notFound(notFoundHandler);

export default app
