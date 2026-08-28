/**
 * Standardized API response helpers.
 *
 * Usage:
 *   import { apiOk, apiError, apiPaginated } from "@/lib/api-response"
 *
 *   return apiOk({ trades })
 *   return apiError("Not found", 404)
 *   return apiPaginated({ items, total, page, pageSize })
 */

import { NextResponse } from "next/server"

export interface ApiSuccessResponse<T> {
  ok: true
  data: T
}

export interface ApiErrorResponse {
  ok: false
  error: string
  details?: Record<string, string[]>
}

export interface ApiPaginatedResponse<T> {
  ok: true
  data: T[]
  meta: {
    total: number
    page: number
    pageSize: number
    totalPages: number
  }
}

export function apiOk<T>(data: T, status = 200): NextResponse {
  return NextResponse.json({ ok: true, data } satisfies ApiSuccessResponse<T>, { status })
}

export function apiError(error: string, status = 400, details?: Record<string, string[]>): NextResponse {
  const body: ApiErrorResponse = { ok: false, error }
  if (details) body.details = details
  return NextResponse.json(body, { status })
}

export function apiPaginated<T>(
  items: T[],
  total: number,
  page: number,
  pageSize: number
): NextResponse {
  return NextResponse.json({
    ok: true,
    data: items,
    meta: {
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    },
  } satisfies ApiPaginatedResponse<T>)
}
