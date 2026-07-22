import { NextResponse } from 'next/server';

type RouteHandler = (req: Request, context?: any) => Promise<NextResponse>;

/**
 * Wrapper terpusat untuk API route handler.
 * Menangkap semua error dan mengembalikan respons JSON yang konsisten.
 */
export function catchAsync(handler: RouteHandler): RouteHandler {
  return async (req: Request, context?: any) => {
    try {
      return await handler(req, context);
    } catch (error: any) {
      const isDev = process.env.NODE_ENV === 'development';
      console.error(`[API Error] ${req.method} ${req.url}:`, error);

      const statusCode = error.statusCode || error.status || 500;
      const message = error.message || 'Terjadi kesalahan internal pada server.';

      return NextResponse.json(
        {
          success: false,
          message,
          ...(isDev && { stack: error.stack }),
        },
        { status: statusCode }
      );
    }
  };
}

/**
 * Custom error class dengan status code
 */
export class ApiError extends Error {
  statusCode: number;
  constructor(message: string, statusCode = 400) {
    super(message);
    this.statusCode = statusCode;
    this.name = 'ApiError';
  }
}

/**
 * Helper untuk respons sukses yang konsisten
 */
export function successResponse<T>(data: T, status = 200) {
  return NextResponse.json({ success: true, data }, { status });
}
