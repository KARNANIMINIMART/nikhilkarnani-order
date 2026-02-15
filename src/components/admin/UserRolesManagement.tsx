import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Search, UserPlus, Trash2, Clock } from "lucide-react";
import { AppRole } from "@/hooks/useUserRoles";

const ROLES: AppRole[] = ["admin", "salesperson", "operations", "editor"];

export const UserRolesManagement = () => {
  const queryClient = useQueryClient();
  const [searchEmail, setSearchEmail] = useState("");
  const [targetUserId, setTargetUserId] = useState("");
  const [selectedRole, setSelectedRole] = useState<string>("");

  // Fetch all user_roles with basic info
  const { data: allRoles = [], isLoading } = useQuery({
    queryKey: ["admin-user-roles"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_roles")
        .select("id, user_id, role")
        .order("role");
      if (error) throw error;
      return data;
    },
  });

  // Fetch audit logs
  const { data: auditLogs = [] } = useQuery({
    queryKey: ["role-audit-logs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("role_audit_logs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return data;
    },
  });

  const handleAssignRole = async () => {
    if (!targetUserId.trim() || !selectedRole) {
      toast.error("Enter a user ID and select a role");
      return;
    }

    try {
      const { error } = await supabase.from("user_roles").insert({
        user_id: targetUserId.trim(),
        role: selectedRole as AppRole,
      });
      if (error) throw error;

      // Log the action
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from("role_audit_logs").insert({
          admin_user_id: user.id,
          target_user_id: targetUserId.trim(),
          action: "assigned",
          role: selectedRole,
        });
      }

      toast.success(`Role "${selectedRole}" assigned`);
      queryClient.invalidateQueries({ queryKey: ["admin-user-roles"] });
      queryClient.invalidateQueries({ queryKey: ["role-audit-logs"] });
      setTargetUserId("");
      setSelectedRole("");
    } catch (err: any) {
      toast.error(err.message || "Failed to assign role");
    }
  };

  const handleRemoveRole = async (id: string, userId: string, role: string) => {
    if (!confirm(`Remove "${role}" from this user?`)) return;
    try {
      const { error } = await supabase.from("user_roles").delete().eq("id", id);
      if (error) throw error;

      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from("role_audit_logs").insert({
          admin_user_id: user.id,
          target_user_id: userId,
          action: "removed",
          role,
        });
      }

      toast.success(`Role "${role}" removed`);
      queryClient.invalidateQueries({ queryKey: ["admin-user-roles"] });
      queryClient.invalidateQueries({ queryKey: ["role-audit-logs"] });
    } catch (err: any) {
      toast.error(err.message || "Failed to remove role");
    }
  };

  const filteredRoles = searchEmail
    ? allRoles.filter((r) => r.user_id.includes(searchEmail))
    : allRoles;

  return (
    <div className="space-y-6">
      {/* Assign role */}
      <div className="rounded-lg border border-border p-4 space-y-3">
        <h3 className="font-semibold text-foreground">Assign Role</h3>
        <div className="flex gap-2 flex-wrap">
          <Input
            placeholder="User ID (UUID)"
            value={targetUserId}
            onChange={(e) => setTargetUserId(e.target.value)}
            className="flex-1 min-w-[200px]"
          />
          <Select value={selectedRole} onValueChange={setSelectedRole}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Select role" />
            </SelectTrigger>
            <SelectContent>
              {ROLES.map((r) => (
                <SelectItem key={r} value={r}>{r}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button onClick={handleAssignRole} className="gap-2">
            <UserPlus className="h-4 w-4" /> Assign
          </Button>
        </div>
      </div>

      {/* Current roles */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <h3 className="font-semibold text-foreground">Current Roles</h3>
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Filter by user ID..."
              value={searchEmail}
              onChange={(e) => setSearchEmail(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {isLoading ? (
          <p className="text-sm text-muted-foreground">Loading...</p>
        ) : (
          <div className="space-y-2">
            {filteredRoles.map((r) => (
              <div key={r.id} className="flex items-center justify-between rounded-lg border border-border p-3">
                <div>
                  <p className="text-sm font-mono text-foreground">{r.user_id}</p>
                  <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-primary/10 text-primary">{r.role}</span>
                </div>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleRemoveRole(r.id, r.user_id, r.role)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
            {filteredRoles.length === 0 && (
              <p className="text-sm text-muted-foreground">No roles found</p>
            )}
          </div>
        )}
      </div>

      {/* Audit log */}
      <div>
        <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
          <Clock className="h-4 w-4" /> Audit Log
        </h3>
        <div className="space-y-1 max-h-64 overflow-y-auto">
          {auditLogs.map((log) => (
            <div key={log.id} className="text-xs text-muted-foreground border-b border-border py-2">
              <span className="font-mono">{log.admin_user_id.slice(0, 8)}...</span>
              {" "}{log.action}{" "}
              <span className="font-medium text-foreground">{log.role}</span>
              {" → "}
              <span className="font-mono">{log.target_user_id.slice(0, 8)}...</span>
              {" • "}
              {new Date(log.created_at).toLocaleString()}
            </div>
          ))}
          {auditLogs.length === 0 && <p className="text-sm text-muted-foreground">No audit logs yet</p>}
        </div>
      </div>
    </div>
  );
};
