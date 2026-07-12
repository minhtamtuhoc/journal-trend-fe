import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { AppLayout, PageHeader } from "@/components/AppLayout";
import { Card } from "@/components/Card";
import { useAuth, isSuperAdminUser } from "@/auth";
import { useEffect, useState } from "react";
import { useListAdmins, useSearchUsers, useGrantAdmin, useRevokeAdmin, useUpdateUserRole } from "@/hooks/data/use-super-admin";
import { toast } from "sonner";
import { ApiError } from "@/api/errors";
import { Search, ArrowLeft, ArrowRight as ArrowRightIcon } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Role } from "@/services/interfaces/super-admin.service";
import type { UserAdminResponse } from "@/types/domain";

export const Route = createFileRoute("/admin/users")({
  component: SuperAdminUsersPage,
});

const ROLES: Role[] = ["STUDENT", "LECTURER", "RESEARCHER", "ADMIN", "SUPER_ADMIN"];

function SuperAdminUsersPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user && !isSuperAdminUser(user)) {
      toast.error("Access denied. Super Admin role required.");
      void navigate({ to: "/admin" });
    }
  }, [user, navigate]);

  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [page, setPage] = useState(0);

  // Debounce search query
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(searchQuery);
      setPage(0);
    }, 400);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  const { data: admins = [], isLoading: isLoadingAdmins } = useListAdmins();
  const { data: usersPage, isLoading: isLoadingUsers } = useSearchUsers(debouncedQuery, page, 8);

  const grantAdminMutation = useGrantAdmin();
  const revokeAdminMutation = useRevokeAdmin();
  const updateRoleMutation = useUpdateUserRole();

  const [confirmTarget, setConfirmTarget] = useState<{
    user: UserAdminResponse;
    action: "grant" | "revoke" | "changeRole";
    newRole?: Role;
  } | null>(null);

  if (!user || !isSuperAdminUser(user)) {
    return null;
  }

  const handleAction = async () => {
    if (!confirmTarget) return;
    const { user: targetUser, action, newRole } = confirmTarget;

    // Safety checks
    if (targetUser.email === user.email) {
      toast.error("You cannot change your own permissions!");
      setConfirmTarget(null);
      return;
    }

    try {
      if (action === "grant") {
        await grantAdminMutation.mutateAsync(targetUser.id);
        toast.success(`Granted Admin rights to ${targetUser.fullName}`);
      } else if (action === "revoke") {
        await revokeAdminMutation.mutateAsync(targetUser.id);
        toast.success(`Revoked Admin rights from ${targetUser.fullName}`);
      } else if (action === "changeRole" && newRole) {
        await updateRoleMutation.mutateAsync({ userId: targetUser.id, role: newRole });
        toast.success(`Updated role of ${targetUser.fullName} to ${newRole}`);
      }
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "Action failed";
      toast.error(msg);
    } finally {
      setConfirmTarget(null);
    }
  };

  return (
    <AppLayout>
      <PageHeader
        title="User & Admin Management"
        subtitle="Manage user roles, grant administrator rights, and oversee access controls."
      />

      <div className="space-y-8">
        {/* Section 1: Admins List */}
        <Card
          title="System Administrators"
          className="overflow-hidden"
        >
          <div className="text-xs text-muted-foreground mb-4 -mt-3">
            Users with elevated ADMIN or SUPER_ADMIN access privileges.
          </div>
          {isLoadingAdmins ? (
            <div className="py-8 text-center text-sm text-muted-foreground">Loading administrators list...</div>
          ) : admins.length === 0 ? (
            <div className="py-8 text-center text-sm text-muted-foreground">No administrators found.</div>
          ) : (
            <div className="border border-border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-secondary/20">
                    <TableHead className="w-12">ID</TableHead>
                    <TableHead>Full Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {admins.map((admin) => (
                    <TableRow key={admin.id}>
                      <TableCell className="font-mono text-xs">{admin.id}</TableCell>
                      <TableCell className="font-medium text-foreground">{admin.fullName}</TableCell>
                      <TableCell className="text-muted-foreground text-sm">{admin.email}</TableCell>
                      <TableCell>
                        <span className={`inline-flex items-center gap-1 text-xs px-2.5 py-0.5 rounded-full font-semibold ${
                          admin.role === "SUPER_ADMIN"
                            ? "bg-rose-500/10 text-rose-500 border border-rose-500/25"
                            : "bg-amber-500/10 text-amber-500 border border-amber-500/25"
                        }`}>
                          {admin.role}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        {admin.email === user.email ? (
                          <span className="text-xs text-muted-foreground italic pr-3">Current User</span>
                        ) : (
                          <div className="flex justify-end items-center gap-2">
                            <Select
                              value={admin.role}
                              onValueChange={(val) => {
                                setConfirmTarget({
                                  user: admin,
                                  action: "changeRole",
                                  newRole: val as Role,
                                });
                              }}
                              disabled={updateRoleMutation.isPending}
                            >
                              <SelectTrigger className="w-36 h-8 text-xs bg-secondary/30">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {ROLES.map((r) => (
                                  <SelectItem key={r} value={r} className="text-xs">
                                    {r}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>

                            <Button
                              variant="destructive"
                              size="sm"
                              className="h-8 text-xs font-semibold"
                              onClick={() => {
                                setConfirmTarget({
                                  user: admin,
                                  action: "revoke",
                                });
                              }}
                              disabled={revokeAdminMutation.isPending}
                            >
                              Revoke Admin
                            </Button>
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </Card>

        {/* Section 2: Search Users */}
        <Card
          title="All Users Database"
        >
          <div className="text-xs text-muted-foreground mb-4 -mt-3">
            Search and modify roles for students, lecturers, researchers, and other users.
          </div>
          <div className="flex items-center gap-2 mb-4 relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search users by name or email..."
              className="pl-10 h-10 w-full"
            />
          </div>

          {isLoadingUsers ? (
            <div className="py-8 text-center text-sm text-muted-foreground">Searching for users...</div>
          ) : !usersPage || usersPage.content.length === 0 ? (
            <div className="py-12 text-center text-sm text-muted-foreground">
              No matching users found.
            </div>
          ) : (
            <div className="space-y-4">
              <div className="border border-border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-secondary/20">
                      <TableHead className="w-12">ID</TableHead>
                      <TableHead>Full Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {usersPage.content.map((u) => (
                      <TableRow key={u.id}>
                        <TableCell className="font-mono text-xs">{u.id}</TableCell>
                        <TableCell className="font-medium text-foreground">{u.fullName}</TableCell>
                        <TableCell className="text-muted-foreground text-sm">{u.email}</TableCell>
                        <TableCell>
                          <span className={`inline-flex items-center gap-1 text-xs px-2.5 py-0.5 rounded-full font-medium ${
                            u.role === "SUPER_ADMIN"
                              ? "bg-rose-500/10 text-rose-500 border border-rose-500/25 font-bold"
                              : u.role === "ADMIN"
                              ? "bg-amber-500/10 text-amber-500 border border-amber-500/25 font-bold"
                              : "bg-blue-500/10 text-blue-400 border border-blue-500/25"
                          }`}>
                            {u.role}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          {u.email === user.email ? (
                            <span className="text-xs text-muted-foreground italic pr-3">Current User</span>
                          ) : (
                            <div className="flex justify-end items-center gap-2">
                              <Select
                                value={u.role}
                                onValueChange={(val) => {
                                  setConfirmTarget({
                                    user: u,
                                    action: "changeRole",
                                    newRole: val as Role,
                                  });
                                }}
                                disabled={updateRoleMutation.isPending}
                              >
                                <SelectTrigger className="w-36 h-8 text-xs bg-secondary/30">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {ROLES.map((r) => (
                                    <SelectItem key={r} value={r} className="text-xs">
                                      {r}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>

                              {u.role !== "ADMIN" && u.role !== "SUPER_ADMIN" ? (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="h-8 text-xs font-semibold hover:bg-brand/10 hover:text-brand border-border"
                                  onClick={() => {
                                    setConfirmTarget({
                                      user: u,
                                      action: "grant",
                                    });
                                  }}
                                  disabled={grantAdminMutation.isPending}
                                >
                                  Grant Admin
                                </Button>
                              ) : (
                                <Button
                                  variant="destructive"
                                  size="sm"
                                  className="h-8 text-xs font-semibold"
                                  onClick={() => {
                                    setConfirmTarget({
                                      user: u,
                                      action: "revoke",
                                    });
                                  }}
                                  disabled={revokeAdminMutation.isPending}
                                >
                                  Revoke Admin
                                </Button>
                              )}
                            </div>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {usersPage.totalPages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <span className="text-xs text-muted-foreground">
                    Page {usersPage.page + 1} of {usersPage.totalPages} (Total {usersPage.totalElements} results)
                  </span>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => Math.max(0, p - 1))}
                      disabled={usersPage.first}
                      className="h-8 px-2 border-border text-xs"
                    >
                      <ArrowLeft className="size-3.5 mr-1" /> Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => Math.min(usersPage.totalPages - 1, p + 1))}
                      disabled={usersPage.last}
                      className="h-8 px-2 border-border text-xs"
                    >
                      Next <ArrowRightIcon className="size-3.5 ml-1" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </Card>
      </div>

      {/* Confirmation Dialog */}
      <AlertDialog
        open={Boolean(confirmTarget)}
        onOpenChange={(open) => {
          if (!open) setConfirmTarget(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm action?</AlertDialogTitle>
            <AlertDialogDescription>
              {confirmTarget?.action === "grant" && (
                <span>
                  Are you sure you want to grant <strong>ADMIN</strong> role to user{" "}
                  <strong>{confirmTarget?.user.fullName}</strong> ({confirmTarget?.user.email})?
                </span>
              )}
              {confirmTarget?.action === "revoke" && (
                <span>
                  Are you sure you want to revoke Admin rights from user{" "}
                  <strong>{confirmTarget?.user.fullName}</strong> ({confirmTarget?.user.email})? Role will revert to STUDENT.
                </span>
              )}
              {confirmTarget?.action === "changeRole" && (
                <span>
                  Are you sure you want to change the role of user{" "}
                  <strong>{confirmTarget?.user.fullName}</strong> from <strong>{confirmTarget?.user.role}</strong> to{" "}
                  <strong>{confirmTarget?.newRole}</strong>?
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleAction}
              className="bg-brand text-brand-foreground hover:bg-brand/90 font-semibold"
            >
              Confirm
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppLayout>
  );
}
