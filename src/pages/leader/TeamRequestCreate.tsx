import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { requestCreateTeam, getMyTeamRequests } from "@/api/teams";
import type { TeamCreationRequest } from "@/types";
import { useToast } from "@/hooks/use-toast";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LoadingState } from "@/components/shared/LoadingState";
import { EmptyState } from "@/components/shared/EmptyState";
import { RequestStatusBadge } from "@/components/shared/RequestStatusBadge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { AlertCircle, CheckCircle2, Clock, Copy, Info } from "lucide-react";

const TEAM_NAME_MIN = 2;
const TEAM_NAME_MAX = 100;

export default function TeamRequestCreate() {
  const { user } = useAuth();
  const { toast } = useToast();

  const [teamName, setTeamName] = useState("");
  const [fieldError, setFieldError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [requests, setRequests] = useState<TeamCreationRequest[]>([]);
  const [isLoadingRequests, setIsLoadingRequests] = useState(true);

  const teamId = (user as any)?.team?.id ?? user?.teamId ?? null;
  const hasPendingRequest = requests.some((r) => r.status === "pending");

  const fetchRequests = useCallback(async () => {
    try {
      const data = await getMyTeamRequests();
      setRequests(data);
    } catch {
      // silently ignore – the list is secondary
    } finally {
      setIsLoadingRequests(false);
    }
  }, []);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  function validate(name: string): string {
    const trimmed = name.trim();
    if (!trimmed) return "Team name is required.";
    if (trimmed.length < TEAM_NAME_MIN)
      return `Team name must be at least ${TEAM_NAME_MIN} characters.`;
    if (trimmed.length > TEAM_NAME_MAX)
      return `Team name must be at most ${TEAM_NAME_MAX} characters.`;
    return "";
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const error = validate(teamName);
    if (error) {
      setFieldError(error);
      return;
    }
    setFieldError("");
    setIsSubmitting(true);

    try {
      await requestCreateTeam(teamName.trim());
      toast({
        title: "Request submitted",
        description:
          "Your team creation request has been sent. You'll be notified once it's reviewed.",
      });
      setTeamName("");
      fetchRequests();
    } catch (err: any) {
      toast({
        title: "Failed to submit request",
        description: err?.message ?? "An unexpected error occurred.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  function copyToClipboard(text: string) {
    navigator.clipboard.writeText(text);
    toast({ title: "Copied!", description: "Invite code copied to clipboard." });
  }

  function formatDate(dateStr?: string | null) {
    if (!dateStr) return "—";
    return new Date(dateStr).toLocaleString();
  }

  // If user already belongs to a team
  if (teamId) {
    return (
      <div className="app-page-enter mx-auto max-w-2xl space-y-6">
        <h1 className="text-2xl font-bold tracking-tight">Request New Team</h1>
        <Card>
          <CardContent className="flex items-center gap-3 py-8">
            <Info className="h-5 w-5 shrink-0 text-blue-500" />
            <p className="text-sm text-muted-foreground">
              You already belong to a team. You cannot create a new team request while
              assigned to an existing team.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="app-page-enter mx-auto max-w-3xl space-y-8">
      <h1 className="text-2xl font-bold tracking-tight">Request New Team</h1>

      {/* ── Create request form ── */}
      <Card>
        <CardHeader>
          <CardTitle>Create Team Request</CardTitle>
          <CardDescription>
            Submit a request to create a new team. A CEO will review and approve or reject it.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {hasPendingRequest && (
            <div className="mb-4 flex items-start gap-3 rounded-lg border border-yellow-500/30 bg-yellow-500/5 p-3">
              <Clock className="mt-0.5 h-4 w-4 shrink-0 text-yellow-500" />
              <p className="text-sm text-yellow-700 dark:text-yellow-400">
                You already have a pending request. Please wait for it to be reviewed
                before submitting a new one.
              </p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="teamName">Team Name</Label>
              <Input
                id="teamName"
                placeholder="e.g. AI & RPA Team"
                value={teamName}
                onChange={(e) => {
                  setTeamName(e.target.value);
                  if (fieldError) setFieldError(validate(e.target.value));
                }}
                maxLength={TEAM_NAME_MAX}
                disabled={isSubmitting || hasPendingRequest}
              />
              {fieldError && (
                <p className="flex items-center gap-1 text-sm text-destructive">
                  <AlertCircle className="h-3.5 w-3.5" />
                  {fieldError}
                </p>
              )}
            </div>

            <Button
              type="submit"
              disabled={isSubmitting || hasPendingRequest}
              className="w-full sm:w-auto"
            >
              {isSubmitting ? "Submitting..." : "Submit Request"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* ── My requests history ── */}
      <Card>
        <CardHeader>
          <CardTitle>My Team Creation Requests</CardTitle>
          <CardDescription>Track the status of your submitted requests.</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoadingRequests ? (
            <LoadingState type="table" />
          ) : requests.length === 0 ? (
            <EmptyState
              title="No requests yet"
              description="You haven't submitted any team creation requests."
            />
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Team Name</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Requested</TableHead>
                    <TableHead>Reviewed</TableHead>
                    <TableHead>Note</TableHead>
                    <TableHead>Team Info</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {requests.map((req) => (
                    <TableRow key={req.id}>
                      <TableCell className="font-medium">{req.team_name}</TableCell>
                      <TableCell>
                        <RequestStatusBadge status={req.status} />
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatDate(req.requested_at)}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatDate(req.reviewed_at)}
                      </TableCell>
                      <TableCell className="max-w-[200px] truncate text-sm text-muted-foreground">
                        {req.admin_note || "—"}
                      </TableCell>
                      <TableCell>
                        {req.status === "approved" && req.approved_team ? (
                          <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-1 text-sm">
                              <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
                              <span>{req.approved_team.name}</span>
                            </div>
                            {req.approved_team.invite_code && (
                              <button
                                type="button"
                                onClick={() =>
                                  copyToClipboard(req.approved_team!.invite_code!)
                                }
                                className="inline-flex items-center gap-1 rounded bg-muted px-2 py-0.5 text-xs font-mono hover:bg-muted/80 transition-colors"
                              >
                                <Copy className="h-3 w-3" />
                                {req.approved_team.invite_code}
                              </button>
                            )}
                          </div>
                        ) : (
                          <span className="text-sm text-muted-foreground">—</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
