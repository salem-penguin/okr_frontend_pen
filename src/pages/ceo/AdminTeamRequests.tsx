import { useState, useEffect, useCallback } from "react";
import { getTeamRequests, approveTeamRequest, rejectTeamRequest } from "@/api/teams";
import type { TeamCreationRequest, TeamRequestStatus } from "@/types";
import { useToast } from "@/hooks/use-toast";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { LoadingState } from "@/components/shared/LoadingState";
import { EmptyState } from "@/components/shared/EmptyState";
import { RequestStatusBadge } from "@/components/shared/RequestStatusBadge";
import {
  CheckCircle2,
  XCircle,
  Copy,
  Inbox,
} from "lucide-react";

export default function AdminTeamRequests() {
  const { toast } = useToast();

  const [statusFilter, setStatusFilter] = useState<TeamRequestStatus>("pending");
  const [requests, setRequests] = useState<TeamCreationRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Approve dialog
  const [approveTarget, setApproveTarget] = useState<TeamCreationRequest | null>(null);
  const [isApproving, setIsApproving] = useState(false);

  // Reject dialog
  const [rejectTarget, setRejectTarget] = useState<TeamCreationRequest | null>(null);
  const [rejectNote, setRejectNote] = useState("");
  const [isRejecting, setIsRejecting] = useState(false);

  // Success dialog for showing invite code after approval
  const [approvalResult, setApprovalResult] = useState<{
    teamName: string;
    inviteCode: string;
  } | null>(null);

  const fetchRequests = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await getTeamRequests(statusFilter);
      setRequests(data);
    } catch (err: any) {
      toast({
        title: "Failed to load requests",
        description: err?.message ?? "An unexpected error occurred.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [statusFilter, toast]);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  async function handleApprove() {
    if (!approveTarget) return;
    setIsApproving(true);
    try {
      const result = await approveTeamRequest(approveTarget.id);
      setApproveTarget(null);
      setApprovalResult({
        teamName: result.team?.name ?? approveTarget.team_name,
        inviteCode: result.team?.invite_code ?? "",
      });
      fetchRequests();
    } catch (err: any) {
      toast({
        title: "Failed to approve",
        description: err?.message ?? "An unexpected error occurred.",
        variant: "destructive",
      });
    } finally {
      setIsApproving(false);
    }
  }

  async function handleReject() {
    if (!rejectTarget) return;
    setIsRejecting(true);
    try {
      await rejectTeamRequest(rejectTarget.id, rejectNote.trim() || undefined);
      setRejectTarget(null);
      setRejectNote("");
      toast({
        title: "Request rejected",
        description: `The request for "${rejectTarget.team_name}" has been rejected.`,
      });
      fetchRequests();
    } catch (err: any) {
      toast({
        title: "Failed to reject",
        description: err?.message ?? "An unexpected error occurred.",
        variant: "destructive",
      });
    } finally {
      setIsRejecting(false);
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

  const emptyMessages: Record<TeamRequestStatus, { title: string; desc: string }> = {
    pending: {
      title: "No pending requests",
      desc: "There are no team creation requests awaiting your review.",
    },
    approved: {
      title: "No approved requests",
      desc: "No team creation requests have been approved yet.",
    },
    rejected: {
      title: "No rejected requests",
      desc: "No team creation requests have been rejected.",
    },
  };

  return (
    <div className="app-page-enter mx-auto max-w-5xl space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">Team Creation Requests</h1>

      {/* ── Filter tabs ── */}
      <Tabs
        value={statusFilter}
        onValueChange={(v) => setStatusFilter(v as TeamRequestStatus)}
      >
        <TabsList>
          <TabsTrigger value="pending">Pending</TabsTrigger>
          <TabsTrigger value="approved">Approved</TabsTrigger>
          <TabsTrigger value="rejected">Rejected</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* ── Request list ── */}
      <Card>
        <CardHeader>
          <CardTitle className="capitalize">{statusFilter} Requests</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <LoadingState type="table" />
          ) : requests.length === 0 ? (
            <EmptyState
              icon={Inbox}
              title={emptyMessages[statusFilter].title}
              description={emptyMessages[statusFilter].desc}
            />
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Team Name</TableHead>
                    <TableHead>Requester</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Requested</TableHead>
                    <TableHead>Reviewed</TableHead>
                    <TableHead>Note</TableHead>
                    {statusFilter === "approved" && <TableHead>Team Info</TableHead>}
                    {statusFilter === "pending" && (
                      <TableHead className="text-right">Actions</TableHead>
                    )}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {requests.map((req) => (
                    <TableRow key={req.id}>
                      <TableCell className="font-medium">{req.team_name}</TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="text-sm">
                            {req.requester_name ?? "—"}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {req.requester_email ?? req.requested_by}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <RequestStatusBadge status={req.status} />
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                        {formatDate(req.requested_at)}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                        {formatDate(req.reviewed_at)}
                      </TableCell>
                      <TableCell className="max-w-[200px] truncate text-sm text-muted-foreground">
                        {req.admin_note || "—"}
                      </TableCell>

                      {statusFilter === "approved" && (
                        <TableCell>
                          {req.approved_team ? (
                            <div className="flex flex-col gap-1">
                              <span className="text-sm font-medium">
                                {req.approved_team.name}
                              </span>
                              {req.approved_team.invite_code && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    copyToClipboard(req.approved_team!.invite_code!)
                                  }
                                  className="inline-flex items-center gap-1 rounded bg-muted px-2 py-0.5 text-xs font-mono hover:bg-muted/80 transition-colors w-fit"
                                >
                                  <Copy className="h-3 w-3" />
                                  {req.approved_team.invite_code}
                                </button>
                              )}
                            </div>
                          ) : (
                            "—"
                          )}
                        </TableCell>
                      )}

                      {statusFilter === "pending" && (
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-green-600 border-green-600/30 hover:bg-green-500/10"
                              onClick={() => setApproveTarget(req)}
                            >
                              <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" />
                              Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-red-600 border-red-600/30 hover:bg-red-500/10"
                              onClick={() => setRejectTarget(req)}
                            >
                              <XCircle className="mr-1.5 h-3.5 w-3.5" />
                              Reject
                            </Button>
                          </div>
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Approve confirmation dialog ── */}
      <Dialog
        open={!!approveTarget}
        onOpenChange={(open) => !open && setApproveTarget(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Approve Team Request</DialogTitle>
            <DialogDescription>
              Are you sure you want to approve the team{" "}
              <span className="font-semibold text-foreground">
                "{approveTarget?.team_name}"
              </span>
              ? This will create the team, generate an invite code, and assign the
              requester as team leader.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setApproveTarget(null)}
              disabled={isApproving}
            >
              Cancel
            </Button>
            <Button onClick={handleApprove} disabled={isApproving}>
              {isApproving ? "Approving..." : "Approve"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Reject dialog ── */}
      <Dialog
        open={!!rejectTarget}
        onOpenChange={(open) => {
          if (!open) {
            setRejectTarget(null);
            setRejectNote("");
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Team Request</DialogTitle>
            <DialogDescription>
              Reject the request for team{" "}
              <span className="font-semibold text-foreground">
                "{rejectTarget?.team_name}"
              </span>
              . You may optionally provide a reason.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="rejectNote">Rejection Reason (optional)</Label>
            <Textarea
              id="rejectNote"
              placeholder="Provide a reason for the rejection..."
              value={rejectNote}
              onChange={(e) => setRejectNote(e.target.value)}
              rows={3}
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setRejectTarget(null);
                setRejectNote("");
              }}
              disabled={isRejecting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleReject}
              disabled={isRejecting}
            >
              {isRejecting ? "Rejecting..." : "Reject"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Approval success dialog (shows invite code) ── */}
      <Dialog
        open={!!approvalResult}
        onOpenChange={(open) => !open && setApprovalResult(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-500" />
              Team Created Successfully
            </DialogTitle>
            <DialogDescription>
              The team <span className="font-semibold text-foreground">"{approvalResult?.teamName}"</span>{" "}
              has been created. Share the invite code with team members.
            </DialogDescription>
          </DialogHeader>

          {approvalResult?.inviteCode && (
            <div className="rounded-lg border bg-muted/50 p-4 text-center">
              <p className="text-xs text-muted-foreground mb-2">Invite Code</p>
              <div className="flex items-center justify-center gap-2">
                <code className="text-xl font-mono font-bold tracking-wider">
                  {approvalResult.inviteCode}
                </code>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => copyToClipboard(approvalResult.inviteCode)}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button onClick={() => setApprovalResult(null)}>Done</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
