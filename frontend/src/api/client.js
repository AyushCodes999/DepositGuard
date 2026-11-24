/**
 * API Client for DepositGuard
 * Connects React frontend to FastAPI backend.
 * Run 2: Added GuardBot, Note Structuring, Comparison, Settlement, and PDF export endpoints.
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000/api";

function getHeaders() {
  const token = localStorage.getItem("depositguard_token");
  const headers = {};
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  return headers;
}

async function request(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  const headers = {
    ...getHeaders(),
    ...(options.headers || {})
  };

  if (!(options.body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
  }

  const response = await fetch(url, {
    ...options,
    headers
  });

  if (!response.ok) {
    let errorDetail = "An unexpected error occurred.";
    let errorCode = "unknown_error";
    try {
      const errorJson = await response.json();
      errorDetail = errorJson.detail || errorDetail;
      errorCode = errorJson.error_code || errorCode;
    } catch (e) {
      errorDetail = await response.text();
    }
    // Auth-free mode: Never purge local user session on unexpected status codes
    const err = new Error(errorDetail);
    err.status = response.status;
    err.errorCode = errorCode;
    throw err;
  }

  return response.json();
}

export const api = {
  // Auth & Email OTP Verification
  register: (data) => request("/auth/register", { method: "POST", body: JSON.stringify(data) }),
  login: (data) => request("/auth/login", { method: "POST", body: JSON.stringify(data) }),
  getMe: () => request("/auth/me", { method: "GET" }),
  sendOtp: (data) => request("/auth/send-otp", { method: "POST", body: JSON.stringify(data) }),
  verifyOtp: (data) => request("/auth/verify-otp", { method: "POST", body: JSON.stringify(data) }),

  // Properties
  listProperties: () => request("/properties", { method: "GET" }),
  getExploreProperties: () => request("/properties/explore", { method: "GET" }),
  createProperty: (data) => request("/properties", { method: "POST", body: JSON.stringify(data) }),
  joinProperty: (inviteCode) => request("/properties/join", { method: "POST", body: JSON.stringify({ invite_code: inviteCode }) }),
  getProperty: (id) => request(`/properties/${id}`, { method: "GET" }),

  // Inspections
  createInspection: (data) => request("/inspections", { method: "POST", body: JSON.stringify(data) }),
  getInspection: (id) => request(`/inspections/${id}`, { method: "GET" }),
  listInspectionsForProperty: (propertyId) => request(`/inspections/by-property/${propertyId}`, { method: "GET" }),
  updateRoomItem: (inspectionId, itemId, data) => request(`/inspections/${inspectionId}/items/${itemId}`, { method: "PATCH", body: JSON.stringify(data) }),
  requestApproval: (inspectionId) => request(`/inspections/${inspectionId}/request-approval`, { method: "POST" }),
  exportInspectionPdfUrl: (inspectionId) => `${API_BASE_URL}/inspections/${inspectionId}/export-pdf`,

  // Photos
  uploadPhoto: async (inspectionId, itemId, file) => {
    const formData = new FormData();
    formData.append("inspection_id", inspectionId);
    formData.append("item_id", itemId);
    formData.append("file", file);

    return request("/photos/upload", {
      method: "POST",
      body: formData
    });
  },

  // Approvals & Dual-Confirmation Lock
  submitApproval: (inspectionId, decision, comments = "") =>
    request(`/approvals/${inspectionId}`, {
      method: "POST",
      body: JSON.stringify({ decision, comments })
    }),

  // Amendments
  createAmendment: (inspectionId, reason, changedFields) =>
    request(`/amendments/${inspectionId}`, {
      method: "POST",
      body: JSON.stringify({ reason, changed_fields: changedFields })
    }),
  acknowledgeAmendment: (amendmentId) =>
    request(`/amendments/item/${amendmentId}/acknowledge`, { method: "POST" }),

  // Verification
  verifyInspection: (inspectionId) => request(`/inspections/${inspectionId}/verify`, { method: "GET" }),

  // Run 2: GuardBot Chatbot
  guardbotChat: (message, history = []) =>
    request("/guardbot/chat", {
      method: "POST",
      body: JSON.stringify({ message, history })
    }),

  // Run 2: Fast Note Structuring (gemini-3.5-flash-lite)
  structureNote: (roughNotes, itemName = "") =>
    request("/guardbot/structure-note", {
      method: "POST",
      body: JSON.stringify({ rough_notes: roughNotes, item_name: itemName })
    }),

  // Run 2: Before & After AI Comparison (gemini-3.8-flash)
  runComparison: (moveOutInspectionId) =>
    request(`/comparison/${moveOutInspectionId}`, { method: "POST" }),
  getStoredComparisons: (inspectionId) =>
    request(`/comparison/${inspectionId}`, { method: "GET" }),

  // Run 2: Settlement & ReportLab PDF Export
  getSettlement: (propertyId) => request(`/settlements/${propertyId}`, { method: "GET" }),
  createOrUpdateSettlement: (propertyId, data) =>
    request(`/settlements/${propertyId}`, { method: "POST", body: JSON.stringify(data) }),
  patchSettlement: (propertyId, data) =>
    request(`/settlements/${propertyId}`, { method: "PATCH", body: JSON.stringify(data) }),
  exportSettlementPdfUrl: (propertyId) => `${API_BASE_URL}/settlements/${propertyId}/export-pdf`,

  // Authenticated Blob PDF Download Helpers (Sends Bearer token without exposing JWT in URL)
  downloadPdf: async (url, defaultFilename = "DepositGuard_Document.pdf") => {
    const token = localStorage.getItem("depositguard_token");
    const headers = {};
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
    const response = await fetch(url, { headers });
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to download PDF (${response.status}): ${errorText}`);
    }
    const blob = await response.blob();
    const disposition = response.headers.get("content-disposition");
    let filename = defaultFilename;
    if (disposition && disposition.includes("filename=")) {
      const match = disposition.match(/filename="?([^";]+)"?/);
      if (match && match[1]) {
        filename = match[1].trim();
      }
    }
    const objectUrl = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = objectUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(objectUrl);
    document.body.removeChild(a);
  },
  downloadInspectionPdf: (inspectionId) => {
    return api.downloadPdf(
      `${API_BASE_URL}/inspections/${inspectionId}/export-pdf`,
      `DepositGuard_Inspection_${inspectionId.slice(0, 8)}.pdf`
    );
  },
  downloadSettlementPdf: (propertyId) => {
    return api.downloadPdf(
      `${API_BASE_URL}/settlements/${propertyId}/export-pdf`,
      `DepositGuard_Settlement_${propertyId.slice(0, 8)}.pdf`
    );
  }
};
