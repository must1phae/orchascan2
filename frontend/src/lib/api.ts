/**
 * OrchaScan 2.0 — API Client
 * Handles communication with the FastAPI backend.
 */

import type { Scan, ScanListResponse } from "@/types";
import { createClient } from "@/lib/supabase/client";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api";

async function getAuthHeaders(): Promise<HeadersInit> {
  const supabase = createClient();
  const { data: { session } } = await supabase.auth.getSession();
  
  const headers: Record<string, string> = {};
  if (session?.access_token) {
    headers["Authorization"] = `Bearer ${session.access_token}`;
  }
  return headers;
}

class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
    this.name = "ApiError";
  }
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const text = await response.text();
    throw new ApiError(
      `API Error (${response.status}): ${text}`,
      response.status
    );
  }
  if (response.status === 204) return {} as T;
  return response.json();
}

/**
 * Create a new scan by uploading 4 images.
 */
export async function createScan(
  name: string,
  description: string,
  images: { front: File; back: File; left: File; right: File },
  params?: { r_target?: number; g_target?: number; b_target?: number; color_tolerance?: number }
): Promise<Scan> {
  const formData = new FormData();
  formData.append("name", name);
  formData.append("description", description);
  formData.append("image_front", images.front);
  formData.append("image_back", images.back);
  formData.append("image_left", images.left);
  formData.append("image_right", images.right);

  if (params?.r_target !== undefined) formData.append("r_target", String(params.r_target));
  if (params?.g_target !== undefined) formData.append("g_target", String(params.g_target));
  if (params?.b_target !== undefined) formData.append("b_target", String(params.b_target));
  if (params?.color_tolerance !== undefined) formData.append("color_tolerance", String(params.color_tolerance));

  const headers = await getAuthHeaders();
  
  const response = await fetch(`${API_BASE}/scans`, {
    method: "POST",
    headers,
    body: formData,
  });

  return handleResponse<Scan>(response);
}

/**
 * Get all scans.
 */
export async function getScans(): Promise<ScanListResponse> {
  const headers = await getAuthHeaders();
  const response = await fetch(`${API_BASE}/scans`, { 
    headers,
    cache: "no-store" 
  });
  return handleResponse<ScanListResponse>(response);
}

/**
 * Get a single scan by ID.
 */
export async function getScan(scanId: string): Promise<Scan> {
  const headers = await getAuthHeaders();
  const response = await fetch(`${API_BASE}/scans/${scanId}`, { 
    headers,
    cache: "no-store" 
  });
  return handleResponse<Scan>(response);
}

/**
 * Delete a scan.
 */
export async function deleteScan(scanId: string): Promise<void> {
  const headers = await getAuthHeaders();
  const response = await fetch(`${API_BASE}/scans/${scanId}`, {
    method: "DELETE",
    headers,
  });
  await handleResponse<void>(response);
}

/**
 * Poll scan status until it reaches a terminal state.
 */
export async function pollScanStatus(
  scanId: string,
  onUpdate: (scan: Scan) => void,
  intervalMs = 3000
): Promise<Scan> {
  return new Promise((resolve, reject) => {
    const poll = async () => {
      try {
        const scan = await getScan(scanId);
        onUpdate(scan);

        if (scan.status === "completed" || scan.status === "failed") {
          resolve(scan);
          return;
        }

        setTimeout(poll, intervalMs);
      } catch (error) {
        reject(error);
      }
    };
    poll();
  });
}
