"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useTranslation } from "react-i18next";
import { MoreHorizontal, AlertCircle } from "lucide-react";
import { getAllUsersAPI, updateUserRoleAPI, banUserAPI } from "@/services/user-service";
import type { AuthUser } from "@/services/auth-service";
import type { PaginationInfo } from "@/services/user-service";
import { DataTable, type DataTableColumn } from "@/components/ui/data-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Alert } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import logger from "@/lib/logger";

type RoleChangeState = { user: AuthUser; newRole: "customer" | "admin" } | null;
type BanState = { user: AuthUser } | null;

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

export default function AdminUsersPage() {
  const { t } = useTranslation(["dashboard", "common"]);
  const { toast } = useToast();

  const [users, setUsers] = useState<AuthUser[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo>({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [roleDialog, setRoleDialog] = useState<RoleChangeState>(null);
  const [banDialog, setBanDialog] = useState<BanState>(null);
  const [isActionLoading, setIsActionLoading] = useState(false);

  // Debounce search to avoid firing on every keystroke
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [debouncedSearch, setDebouncedSearch] = useState("");

  useEffect(() => {
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => setDebouncedSearch(search), 400);
    return () => {
      if (searchTimer.current) clearTimeout(searchTimer.current);
    };
  }, [search]);

  const fetchUsers = useCallback(
    async (page = 1) => {
      setIsLoading(true);
      setError(null);
      try {
        const res = await getAllUsersAPI({ page, limit: 10, search: debouncedSearch });
        setUsers(res.data.users);
        setPagination(res.data.pagination);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : t("common:errors.generic");
        setError(msg);
        logger.error("getAllUsers failed:", err);
      } finally {
        setIsLoading(false);
      }
    },
    [debouncedSearch, t]
  );

  // Reset to page 1 when search changes
  useEffect(() => {
    fetchUsers(1);
  }, [fetchUsers]);

  const handleRoleChange = async () => {
    if (!roleDialog) return;
    setIsActionLoading(true);
    try {
      const updated = await updateUserRoleAPI(roleDialog.user.id, roleDialog.newRole);
      setUsers((prev) => prev.map((u) => (u.id === updated.data.id ? updated.data : u)));
      toast({ title: t("dashboard:admin.users.successRoleChanged") });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : t("common:errors.generic");
      toast({ title: msg, variant: "destructive" });
      logger.error("updateUserRole failed:", err);
    } finally {
      setIsActionLoading(false);
      setRoleDialog(null);
    }
  };

  const handleBanToggle = async () => {
    if (!banDialog) return;
    setIsActionLoading(true);
    try {
      const updated = await banUserAPI(banDialog.user.id);
      setUsers((prev) => prev.map((u) => (u.id === updated.data.id ? updated.data : u)));
      const key = updated.data.isActive
        ? "dashboard:admin.users.successUnbanned"
        : "dashboard:admin.users.successBanned";
      toast({ title: t(key) });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : t("common:errors.generic");
      toast({ title: msg, variant: "destructive" });
      logger.error("banUser failed:", err);
    } finally {
      setIsActionLoading(false);
      setBanDialog(null);
    }
  };

  const columns: DataTableColumn<AuthUser>[] = [
    {
      key: "name",
      header: t("dashboard:admin.users.columns.name"),
      render: (row) => (
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-xs font-semibold overflow-hidden flex-shrink-0">
            {row.avatar ? (
              <img
                src={`${API_URL}${row.avatar}`}
                alt={row.name}
                className="h-full w-full object-cover"
              />
            ) : (
              row.name
                .split(" ")
                .map((w) => w[0])
                .join("")
                .toUpperCase()
                .slice(0, 2)
            )}
          </div>
          <span className="font-medium truncate max-w-[140px]">{row.name}</span>
        </div>
      ),
    },
    {
      key: "email",
      header: t("dashboard:admin.users.columns.email"),
      render: (row) => (
        <span className="text-muted-foreground truncate max-w-[180px] block">{row.email}</span>
      ),
    },
    {
      key: "role",
      header: t("dashboard:admin.users.columns.role"),
      render: (row) => (
        <Badge variant={row.role === "admin" ? "default" : "secondary"}>
          {t(`dashboard:admin.users.roles.${row.role}`)}
        </Badge>
      ),
    },
    {
      key: "isActive",
      header: t("dashboard:admin.users.columns.status"),
      render: (row) => (
        <Badge variant={row.isActive ? "success" : "destructive"}>
          {row.isActive
            ? t("dashboard:admin.users.status.active")
            : t("dashboard:admin.users.status.banned")}
        </Badge>
      ),
    },
    {
      key: "createdAt",
      header: t("dashboard:admin.users.columns.joined"),
      render: (row) => (
        <span className="text-muted-foreground text-xs">
          {new Date(row.createdAt).toLocaleDateString()}
        </span>
      ),
    },
    {
      key: "actions",
      header: t("dashboard:admin.users.columns.actions"),
      className: "w-12",
      render: (row) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              aria-label={t("dashboard:admin.users.columns.actions")}
            >
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              onClick={() =>
                setRoleDialog({
                  user: row,
                  newRole: row.role === "admin" ? "customer" : "admin",
                })
              }
            >
              {t("dashboard:admin.users.actions.changeRole")}
            </DropdownMenuItem>
            <DropdownMenuItem
              className={row.isActive ? "text-destructive focus:text-destructive" : ""}
              onClick={() => setBanDialog({ user: row })}
            >
              {row.isActive
                ? t("dashboard:admin.users.actions.ban")
                : t("dashboard:admin.users.actions.unban")}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{t("dashboard:admin.users.title")}</h1>
        <p className="text-muted-foreground text-sm mt-1">{t("dashboard:admin.users.subtitle")}</p>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <p className="ml-2 text-sm">{error}</p>
        </Alert>
      )}

      <DataTable
        columns={columns}
        data={users}
        isLoading={isLoading}
        pagination={pagination}
        onPageChange={(page) => fetchUsers(page)}
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder={t("dashboard:admin.users.searchPlaceholder")}
        emptyMessage={t("dashboard:admin.users.empty")}
      />

      {/* Role change confirmation dialog */}
      <Dialog open={!!roleDialog} onOpenChange={(open) => !open && setRoleDialog(null)}>
        <DialogContent>
          <h2 className="text-lg font-semibold mb-2">
            {t("dashboard:admin.users.actions.changeRole")}
          </h2>
          {roleDialog && (
            <p className="text-sm text-muted-foreground mb-4">
              Change <strong>{roleDialog.user.name}</strong> to{" "}
              <strong>{t(`dashboard:admin.users.roles.${roleDialog.newRole}`)}</strong>?
            </p>
          )}
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => setRoleDialog(null)} disabled={isActionLoading}>
              {t("common:actions.cancel")}
            </Button>
            <Button onClick={handleRoleChange} disabled={isActionLoading}>
              {isActionLoading ? t("common:actions.loading") : t("common:actions.save")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Ban confirmation dialog */}
      <Dialog open={!!banDialog} onOpenChange={(open) => !open && setBanDialog(null)}>
        <DialogContent>
          <h2 className="text-lg font-semibold mb-2">
            {banDialog?.user.isActive
              ? t("dashboard:admin.users.confirmBan")
              : t("dashboard:admin.users.confirmUnban")}
          </h2>
          {banDialog && (
            <p className="text-sm text-muted-foreground mb-4">
              User: <strong>{banDialog.user.name}</strong>
            </p>
          )}
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => setBanDialog(null)} disabled={isActionLoading}>
              {t("common:actions.cancel")}
            </Button>
            <Button
              variant={banDialog?.user.isActive ? "destructive" : "default"}
              onClick={handleBanToggle}
              disabled={isActionLoading}
            >
              {isActionLoading
                ? t("common:actions.loading")
                : banDialog?.user.isActive
                ? t("dashboard:admin.users.actions.ban")
                : t("dashboard:admin.users.actions.unban")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
