"use client";

import { useState, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { Trash2, Eye, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import {
  getContactsAPI,
  getContactAPI,
  updateContactStatusAPI,
  deleteContactAPI,
} from "@/services/contact-service";
import logger from "@/lib/logger";
import type { Contact, PaginationInfo } from "@/types";

const STATUS_COLORS: Record<string, "default" | "secondary" | "outline" | "info" | "success"> = {
  new: "info",
  read: "default",
  replied: "success",
};

export default function AdminContactsPage() {
  const { t } = useTranslation("admin");
  const { toast } = useToast();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const [viewContact, setViewContact] = useState<Contact | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const fetchContacts = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await getContactsAPI({ page, limit: 20, status: statusFilter || undefined });
      setContacts(res.data.contacts);
      setPagination(res.data.pagination);
    } catch (err) {
      logger.error("fetchContacts error:", err);
      toast({ title: t("contacts.errorLoading"), variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }, [page, statusFilter, t, toast]);

  useEffect(() => {
    fetchContacts();
  }, [fetchContacts]);

  const handleView = async (id: string) => {
    try {
      const res = await getContactAPI(id);
      setViewContact(res.data);
      setDialogOpen(true);
      // Auto-mark as read if new
      if (res.data.status === "new") {
        await updateContactStatusAPI(id, "read");
        fetchContacts();
      }
    } catch {
      toast({ title: t("contacts.errorLoading"), variant: "destructive" });
    }
  };

  const handleStatusChange = async (id: string, status: "new" | "read" | "replied") => {
    try {
      await updateContactStatusAPI(id, status);
      toast({ title: t("contacts.statusUpdated") });
      fetchContacts();
      if (viewContact?.id === id) {
        setViewContact({ ...viewContact, status });
      }
    } catch {
      toast({ title: t("contacts.errorUpdating"), variant: "destructive" });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteContactAPI(id);
      toast({ title: t("contacts.deleted") });
      setDialogOpen(false);
      fetchContacts();
    } catch {
      toast({ title: t("contacts.errorDeleting"), variant: "destructive" });
    }
  };

  return (
    <div className="space-y-5">
      <h1 className="text-xl font-semibold text-polaris-text">{t("contacts.title")}</h1>

      <Card>
        {/* Filters */}
        <div className="flex gap-3 p-4 pb-0">
          <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v === "all" ? "" : v); setPage(1); }}>
            <SelectTrigger className="w-40"><SelectValue placeholder={t("contacts.allStatuses")} /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("contacts.allStatuses")}</SelectItem>
              <SelectItem value="new">{t("contacts.statusNew")}</SelectItem>
              <SelectItem value="read">{t("contacts.statusRead")}</SelectItem>
              <SelectItem value="replied">{t("contacts.statusReplied")}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Table */}
        <div className="overflow-x-auto mt-3">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-t border-polaris-border bg-polaris-surface-hovered text-polaris-text-subdued">
                <th className="px-4 py-3 text-left font-medium">{t("contacts.name")}</th>
                <th className="px-4 py-3 text-left font-medium">{t("contacts.email")}</th>
                <th className="px-4 py-3 text-left font-medium">{t("contacts.subject")}</th>
                <th className="px-4 py-3 text-left font-medium">{t("contacts.status")}</th>
                <th className="px-4 py-3 text-left font-medium">{t("contacts.date")}</th>
                <th className="px-4 py-3 text-right font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-b border-polaris-border-subdued">
                    <td colSpan={6} className="px-4 py-3"><Skeleton className="h-5 w-full" /></td>
                  </tr>
                ))
              ) : contacts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-polaris-text-subdued">
                    {t("contacts.empty")}
                  </td>
                </tr>
              ) : (
                contacts.map((contact) => (
                  <tr key={contact.id} className="border-b border-polaris-border-subdued hover:bg-polaris-surface-hovered transition-colors">
                    <td className="px-4 py-3 font-medium text-polaris-text">{contact.name}</td>
                    <td className="px-4 py-3 text-polaris-text-subdued">{contact.email}</td>
                    <td className="px-4 py-3 max-w-[200px] truncate text-polaris-text">{contact.subject}</td>
                    <td className="px-4 py-3">
                      <Badge variant={STATUS_COLORS[contact.status]}>{t(`contacts.status${contact.status.charAt(0).toUpperCase() + contact.status.slice(1)}`)}</Badge>
                    </td>
                    <td className="px-4 py-3 text-polaris-text-subdued">
                      {new Date(contact.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 text-right space-x-1">
                      <Button variant="ghost" size="icon" onClick={() => handleView(contact.id)} aria-label={t("contacts.view")}>
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(contact.id)} aria-label={t("contacts.delete")}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination && pagination.pages > 1 && (
          <div className="flex justify-center gap-2 p-4 border-t border-polaris-border">
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>
              {t("contacts.prev")}
            </Button>
            <span className="flex items-center text-sm text-polaris-text-subdued">{page} / {pagination.pages}</span>
            <Button variant="outline" size="sm" disabled={page >= pagination.pages} onClick={() => setPage(page + 1)}>
              {t("contacts.next")}
            </Button>
          </div>
        )}
      </Card>

      {/* View Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{viewContact?.subject}</DialogTitle>
          </DialogHeader>
          {viewContact && (
            <div className="space-y-4">
              <div className="flex justify-between text-sm">
                <span><strong>{t("contacts.from")}:</strong> {viewContact.name} ({viewContact.email})</span>
                <span className="text-polaris-text-subdued">{new Date(viewContact.createdAt).toLocaleString()}</span>
              </div>
              <div className="whitespace-pre-wrap bg-polaris-surface-hovered p-4 rounded-md text-sm text-polaris-text">{viewContact.message}</div>
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium">{t("contacts.status")}:</span>
                <Select value={viewContact.status} onValueChange={(v) => handleStatusChange(viewContact.id, v as "new" | "read" | "replied")}>
                  <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="new">{t("contacts.statusNew")}</SelectItem>
                    <SelectItem value="read">{t("contacts.statusRead")}</SelectItem>
                    <SelectItem value="replied">{t("contacts.statusReplied")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
