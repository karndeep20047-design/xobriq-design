import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { MoreHorizontal, UserPlus } from "lucide-react";

import { PageShell } from "@/components/kyc/page-shell";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/team")({
  head: () => ({
    meta: [
      { title: "Team — XOBRIQ KYC" },
      {
        name: "description",
        content:
          "Invite teammates, assign KYC roles and manage access across your XOBRIQ KYC workspace.",
      },
      { property: "og:title", content: "Team — XOBRIQ KYC" },
      {
        property: "og:description",
        content: "Manage roles and permissions for your XOBRIQ KYC workspace.",
      },
    ],
  }),
  component: TeamPage,
});

type Role = "Owner" | "Admin" | "Reviewer" | "Developer" | "Viewer";
type Member = {
  id: string;
  name: string;
  email: string;
  role: Role;
  status: "Active" | "Invited" | "Suspended";
  lastActive: string;
};

const initialMembers: Member[] = [
  { id: "u_1", name: "Jane Mwikali", email: "jane@jumiapay.co.ke", role: "Owner", status: "Active", lastActive: "Now" },
  { id: "u_2", name: "Kevin Ochieng", email: "kevin@jumiapay.co.ke", role: "Admin", status: "Active", lastActive: "12 min ago" },
  { id: "u_3", name: "Aisha Noor", email: "aisha@jumiapay.co.ke", role: "Reviewer", status: "Active", lastActive: "1 h ago" },
  { id: "u_4", name: "Brian Karanja", email: "brian@jumiapay.co.ke", role: "Developer", status: "Active", lastActive: "Yesterday" },
  { id: "u_5", name: "Mercy Wanjiru", email: "mercy@jumiapay.co.ke", role: "Reviewer", status: "Active", lastActive: "2 days ago" },
  { id: "u_6", name: "Dennis Kip", email: "dennis@jumiapay.co.ke", role: "Viewer", status: "Invited", lastActive: "—" },
];

const roleStyles: Record<Role, string> = {
  Owner: "border-primary/30 bg-primary/10 text-primary",
  Admin: "border-info/20 bg-info/10 text-info",
  Reviewer: "border-success/30 bg-success/10 text-success",
  Developer: "border-warning/30 bg-warning/15 text-warning-foreground",
  Viewer: "border-border bg-muted text-muted-foreground",
};

function TeamPage() {
  const [members, setMembers] = useState(initialMembers);
  const [invite, setInvite] = useState({ email: "", role: "Reviewer" as Role });

  const send = () => {
    if (!invite.email) return;
    setMembers((prev) => [
      ...prev,
      {
        id: `u_${Date.now()}`,
        name: invite.email.split("@")[0],
        email: invite.email,
        role: invite.role,
        status: "Invited",
        lastActive: "—",
      },
    ]);
    setInvite({ email: "", role: "Reviewer" });
  };

  return (
    <PageShell
      activePath="/team"
      title="Team"
      subtitle="Manage members and role-based access"
    >
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="border-border/60 shadow-[var(--shadow-card)] lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Members</CardTitle>
            <Badge variant="outline" className="font-medium">
              {members.length} seats
            </Badge>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Member</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Last active</TableHead>
                    <TableHead className="text-right"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {members.map((m) => (
                    <TableRow key={m.id} className="hover:bg-muted/40">
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Avatar className="h-8 w-8">
                            <AvatarFallback className="bg-primary/10 text-[11px] text-primary">
                              {m.name.split(" ").map((n) => n[0]).join("")}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="text-sm font-medium">{m.name}</div>
                            <div className="text-xs text-muted-foreground">{m.email}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={cn("font-medium", roleStyles[m.role])}>
                          {m.role}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span
                          className={cn(
                            "text-xs font-medium",
                            m.status === "Active" && "text-success",
                            m.status === "Invited" && "text-warning-foreground",
                            m.status === "Suspended" && "text-destructive",
                          )}
                        >
                          {m.status}
                        </span>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {m.lastActive}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button size="icon" variant="ghost" className="h-7 w-7">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/60 shadow-[var(--shadow-card)]">
          <CardHeader>
            <div className="flex items-center gap-2">
              <UserPlus className="h-4 w-4 text-primary" />
              <CardTitle className="text-base">Invite teammate</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <Label className="text-xs">Work email</Label>
              <Input
                type="email"
                placeholder="name@company.co.ke"
                value={invite.email}
                onChange={(e) => setInvite((p) => ({ ...p, email: e.target.value }))}
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-xs">Role</Label>
              <Select
                value={invite.role}
                onValueChange={(v) => setInvite((p) => ({ ...p, role: v as Role }))}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(["Admin", "Reviewer", "Developer", "Viewer"] as Role[]).map((r) => (
                    <SelectItem key={r} value={r}>
                      {r}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button className="w-full" onClick={send}>
              Send invite
            </Button>
            <div className="rounded-lg bg-muted/50 p-3 text-xs text-muted-foreground">
              Roles govern access to verifications, API keys, billing and settings. Owners have full control.
            </div>
          </CardContent>
        </Card>
      </div>
    </PageShell>
  );
}
