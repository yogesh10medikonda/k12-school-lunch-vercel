/**
 * Central API Client for School Lunch System
 * Supports:
 * - Mock/Real backend switch via NEXT_PUBLIC_USE_MOCKS (default: true for development)
 * - Standardized response envelopes (ApiResponse<T>)
 * - Centralized error handling and status codes
 * - Latency simulation for realistic demo states
 */

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  meta?: {
    total?: number;
    page?: number;
    pageSize?: number;
    totalPages?: number;
  };
}

export interface ApiError {
  message: string;
  code?: string;
  statusCode?: number;
  details?: Record<string, string[]>;
}

export class AppApiError extends Error {
  public statusCode: number;
  public details?: Record<string, string[]>;

  constructor(message: string, statusCode: number = 500, details?: Record<string, string[]>) {
    super(message);
    this.name = 'AppApiError';
    this.statusCode = statusCode;
    this.details = details;
  }
}

export const USE_MOCKS =
  process.env.NEXT_PUBLIC_USE_MOCKS === 'false' ? false : true;

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export async function simulateLatency(ms: number = 300): Promise<void> {
  if (process.env.NODE_ENV === 'test') return;
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function apiClient<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const url = `${API_BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    ...(options.headers || {}),
  };

  try {
    const response = await fetch(url, {
      ...options,
      headers,
    });

    const json = await response.json();

    if (!response.ok) {
      throw new AppApiError(
        json.message || `Request failed with status ${response.status}`,
        response.status,
        json.details ?? json.errors
      );
    }

    return json as ApiResponse<T>;
  } catch (error: unknown) {
    if (error instanceof AppApiError) {
      throw error;
    }
    const message = error instanceof Error ? error.message : 'Unknown network failure';
    throw new AppApiError(
      `Unable to communicate with the lunch management server: ${message}`,
      503
    );
  }
}
