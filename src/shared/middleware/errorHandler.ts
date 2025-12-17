import type { Context, Next } from 'hono';

export const errorHandler = async (c: Context, next: Next) => {
  try {
    await next();
  } catch (err) {
    console.error('Error handling request:', err);

    const error = err as Error;

    return c.json(
      {
        error: 'Internal Server Error',
        message: error.message,
        timestamp: new Date().toISOString(),
      },
      500
    );
  }
};

// Handler para rutas no encontradas (404)
export const notFoundHandler = (c: Context) => {
  return c.json(
    {
      error: 'Not Found',
      message: `Route ${c.req.method} ${c.req.path} not found`,
      timestamp: new Date().toISOString(),
    },
    404
  );
};
