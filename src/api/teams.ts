import { apiFetch } from "@/api/client";
import type { TeamCreationRequest } from "@/types";

function unwrapArray(data: any): TeamCreationRequest[] {
  if (Array.isArray(data)) return data;
  if (data && Array.isArray(data.requests)) return data.requests;
  return [];
}

export function requestCreateTeam(team_name: string) {
  return apiFetch<TeamCreationRequest>("/teams/request-create", {
    method: "POST",
    body: JSON.stringify({ team_name }),
  });
}

export async function getMyTeamRequests(): Promise<TeamCreationRequest[]> {
  const data = await apiFetch<any>("/teams/requests/me");
  return unwrapArray(data);
}

export async function getTeamRequests(status?: string): Promise<TeamCreationRequest[]> {
  const query = status ? `?status=${status}` : "";
  const data = await apiFetch<any>(`/teams/requests${query}`);
  return unwrapArray(data);
}

export function approveTeamRequest(requestId: string) {
  return apiFetch<any>(
    `/teams/requests/${requestId}/approve`,
    { method: "POST" }
  );
}

export function rejectTeamRequest(requestId: string, admin_note?: string) {
  return apiFetch<TeamCreationRequest>(
    `/teams/requests/${requestId}/reject`,
    {
      method: "POST",
      body: JSON.stringify({ admin_note: admin_note || undefined }),
    }
  );
}
