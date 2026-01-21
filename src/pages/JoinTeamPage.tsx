import { useState } from "react";
import { apiFetch } from "@/api/client";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function JoinTeamPage() {
  const [inviteCode, setInviteCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const { refreshMe, user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setIsLoading(true);
    try {
      await apiFetch("/auth/join-team", {
        method: "POST",
        body: JSON.stringify({ invite_code: inviteCode }),
      });

      const me = await refreshMe();
      const redirect =
        me?.role === "ceo" ? "/ceo" : me?.role === "team_leader" ? "/leader" : "/member";
      navigate(redirect, { replace: true });
    } catch (e: any) {
      toast({
        title: "Join team failed",
        description: e?.message ?? "Unexpected error",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-xl p-4">
      <Card>
        <CardHeader>
          <CardTitle>Join your team</CardTitle>
          <CardDescription>
            Enter the invite code provided by your admin or team leader.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={submit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="invite">Invite code</Label>
              <Input id="invite" value={inviteCode} onChange={(e) => setInviteCode(e.target.value)} required />
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Joining..." : "Join Team"}
            </Button>

            <p className="text-xs text-muted-foreground">
              Logged in as <span className="font-medium">{user?.email}</span>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
