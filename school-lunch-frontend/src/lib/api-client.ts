/**
 * Central API Client for School Lunch System
 * Re-exports everything from the original client for backward compatibility.
 * Supports:
 * - Mock/Real backend switch via NEXT_PUBLIC_USE_MOCKS (default: true for development)
 * - Standardized response envelopes (ApiResponse<T>)
 * - Centralized error handling and status codes
 * - Latency simulation for realistic demo states
 */

export type { ApiResponse, ApiError } from './api/client';
export { AppApiError, USE_MOCKS, API_BASE_URL, simulateLatency, apiClient } from './api/client';
