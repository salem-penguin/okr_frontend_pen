// import { useState } from 'react';
// import { useNavigate } from 'react-router-dom';
// import { useAuth } from '@/contexts/AuthContext';
// import { Button } from '@/components/ui/button';
// import { Input } from '@/components/ui/input';
// import { Label } from '@/components/ui/label';
// import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
// import { useToast } from '@/hooks/use-toast';

// export default function LoginPage() {
//   const [email, setEmail] = useState('');
//   const [password, setPassword] = useState('');
//   const [isLoading, setIsLoading] = useState(false);
//   const { login } = useAuth();
//   const navigate = useNavigate();
//   const { toast } = useToast();

// const handleSubmit = async (e: React.FormEvent) => {
//   e.preventDefault();
//   setIsLoading(true);

//   try {
//     const result = await login(email, password);

//     if (result.success) {
//       // IMPORTANT: do NOT read "currentUser" from localStorage anymore (you don't set it)
//       const role = result.user?.role; // if your login returns user
//       const redirectPath =
//         { ceo: '/ceo', team_leader: '/leader', team_member: '/member' }[role] || '/';

//       navigate(redirectPath);
//     } else {
//       toast({ title: 'Login Failed', description: result.success, variant: 'destructive' });
//     }
//   } catch (err: any) {
//     toast({
//       title: 'Login Failed',
//       description: err?.message ?? 'Unexpected error',
//       variant: 'destructive',
//     });
//   } finally {
//     setIsLoading(false);
//   }
// };

//   return (
//     <div className="flex min-h-screen items-center justify-center bg-background p-4">
//       <Card className="w-full max-w-md">
//         <CardHeader className="text-center">
//           <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold text-xl">WR</div>
//           <CardTitle className="text-2xl">Weekly Reports</CardTitle>
//           <CardDescription>Sign in to access your dashboard</CardDescription>
//         </CardHeader>
//         <CardContent>
//           <form onSubmit={handleSubmit} className="space-y-4">
//             <div className="space-y-2">
//               <Label htmlFor="email">Email</Label>
//               <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@company.com" required />
//             </div>
//             <div className="space-y-2">
//               <Label htmlFor="password">Password</Label>
//               <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required />
//             </div>
//             <Button type="submit" className="w-full" disabled={isLoading}>
//               {isLoading ? 'Signing in...' : 'Sign In'}
//             </Button>
//           </form>
//           <div className="mt-6 rounded-lg bg-muted/50 p-4 text-sm">
//             <p className="font-medium mb-2">Demo Accounts:</p>
//             <p className="text-muted-foreground">CEO: ceo@company.com</p>
//             <p className="text-muted-foreground">Leader: alex@company.com</p>
//             <p className="text-muted-foreground">Member: john@company.com</p>
//             <p className="text-xs text-muted-foreground mt-2">(Any password works)</p>
//           </div>
//         </CardContent>
//       </Card>
//     </div>
//   );
// }
import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { apiFetch } from "@/api/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { PageBackdrop } from "@/components/layout/PageBackdrop";

const container = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.06, delayChildren: 0.1 },
  },
};

const item = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0 },
};

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const result = await login(email, password);

      if (!result.success) {
        toast({
          title: "Login Failed",
          variant: "destructive",
        });
        return;
      }

      // cookie is set -> now get role/team from /me
      const me = await apiFetch<any>("/me");

      // ✅ CEO: always go directly to dashboard (no onboarding)
      if (me?.role === "ceo") {
        navigate("/ceo", { replace: true });
        return;
      }

      // 1) Role not selected yet -> onboarding
      if (!me?.role) {
        navigate("/select-role", { replace: true });
        return;
      }

      // 2) Team not joined yet -> onboarding (only for member/leader)
      const teamId = me?.team?.id ?? me?.teamId ?? null;
      if (!teamId) {
        navigate("/join-team", { replace: true });
        return;
      }

      // 3) Normal dashboards
      const redirectPath =
        { team_leader: "/leader", team_member: "/member" }[me.role] || "/login";

      navigate(redirectPath, { replace: true });
    } catch (err: any) {
      toast({
        title: "Login Failed",
        description: err?.message ?? "Unexpected error",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center p-4">
      <PageBackdrop />
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 28, mass: 0.8 }}
        className="w-full max-w-md"
      >
        <Card className="overflow-hidden">
          <CardHeader className="text-center">
            <motion.div
              variants={container}
              initial="hidden"
              animate="visible"
              className="flex flex-col items-center"
            >
              <motion.div
                variants={item}
                className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold text-xl shadow-lg"
              >
                WR
              </motion.div>
              <motion.div variants={item}>
                <CardTitle className="text-2xl">Weekly Reports</CardTitle>
              </motion.div>
              <motion.div variants={item}>
                <CardDescription>Sign in to access your dashboard</CardDescription>
              </motion.div>
            </motion.div>
          </CardHeader>

          <CardContent>
            <motion.form
              onSubmit={handleSubmit}
              className="space-y-4"
              variants={container}
              initial="hidden"
              animate="visible"
            >
              <motion.div className="space-y-2" variants={item}>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@company.com"
                  required
                />
              </motion.div>

              <motion.div className="space-y-2" variants={item}>
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                />
              </motion.div>

              <motion.div variants={item}>
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? "Signing in..." : "Sign In"}
                </Button>
              </motion.div>
            </motion.form>

            <motion.div
              className="mt-4 text-center text-sm text-muted-foreground"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              Don't have an account?{" "}
              <Link to="/signup" className="underline text-foreground hover:text-primary transition-colors">
                Create one
              </Link>
            </motion.div>

          {/* <div className="mt-6 rounded-lg bg-muted/50 p-4 text-sm">
            <p className="font-medium mb-2">Demo Accounts:</p>
            <p className="text-muted-foreground">CEO: ceo@company.com</p>
            <p className="text-muted-foreground">Leader: alex@company.com</p>
            <p className="text-muted-foreground">Member: john@company.com</p>
            <p className="text-xs text-muted-foreground mt-2">(Any password works)</p>
          </div> */}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}