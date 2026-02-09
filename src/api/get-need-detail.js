// src/api/get-need-detail.js
import { authFetch } from "./auth-fetch";

const API_URL = import.meta.env.VITE_API_URL;

function baseUrl() {
  return API_URL.endsWith("/") ? API_URL : `${API_URL}/`;
}

function endpointForType(type) {
  if (type === "money") return "money-needs/";
  if (type === "time") return "time-needs/";
  if (type === "item") return "item-needs/";
  throw new Error(`Unknown need type: ${type}`);
}

export default async function getNeedDetail(type, detailId) {
  const url = `${baseUrl()}${endpointForType(type)}${detailId}/`;

  const res = await authFetch(url, { method: "GET" });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data?.detail || "Could not load need detail.");
  }

  return data;
}
