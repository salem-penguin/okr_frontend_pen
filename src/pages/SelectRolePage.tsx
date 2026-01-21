import { useState } from "react";
import { apiFetch } from "@/api/client";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function SelectRolePage() {
  const [loading, setLoading] = useState<"team_member" | "team_leader" | null>(null);
  const { refreshMe } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  async function choose(role: "team_member" | "team_leader") {
    setLoading(role);
    try {
      await apiFetch("/auth/select-role", { method: "POST", body: JSON.stringify({ role }) });
      const me = await refreshMe();

      if (!me) throw new Error("Not authenticated");
      // after role selection -> join team
      navigate("/join-team", { replace: true });
    } catch (e: any) {
      toast({
        title: "Role selection failed",
        description: e?.message ?? "Unexpected error",
        variant: "destructive",
      });
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="mx-auto max-w-2xl p-4">
      <Card>
        <CardHeader>
          <CardTitle>Select your role</CardTitle>
          <CardDescription>This choice is one-time and will be locked.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <Button className="h-24" onClick={() => choose("team_member")} disabled={!!loading}>
            {loading === "team_member" ? "Setting..." : "Team Member"}
          </Button>
          <Button variant="secondary" className="h-24" onClick={() => choose("team_leader")} disabled={!!loading}>
            {loading === "team_leader" ? "Setting..." : "Team Leader"}
          </Button>
          <div className="md:col-span-2 text-xs text-muted-foreground">
            CEO is not selectable here. It must be assigned by an administrator.
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
