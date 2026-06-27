"use client";

import { useMemo, useState, useRef, useEffect } from "react";
import Link from "next/link";
import { Search, Send, UserX, UserCheck, MessageSquare } from "lucide-react";
import DataTable from "@/components/dashboard/DataTable";
import Modal from "@/components/dashboard/Modal";
import { Button } from "@/components/button";
import { useAuth } from "@/context/AuthContext";
import { showErrorToast, showSuccessToast } from "@/utils/toast";
import { useDebounce } from "@/hooks/useDebounce";
import { useInfiniteParents, useToggleParentAccess, useBulkBroadcast } from "@/hooks/useParents";
import type { ParentUser } from "@/types/parent/parentTypes";

export default function ParentsPage() {
  const { isOwner } = useAuth();
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 300);
  
  const [selectedParents, setSelectedParents] = useState<string[]>([]);
  const [broadcastModalOpen, setBroadcastModalOpen] = useState(false);
  const [quickMessageModalOpen, setQuickMessageModalOpen] = useState(false);
  const [messageContent, setMessageContent] = useState("");
  const [targetParent, setTargetParent] = useState<ParentUser | null>(null);

  const {
    data,
    isLoading,
    isFetchingNextPage,
    fetchNextPage,
    hasNextPage,
    refetch,
  } = useInfiniteParents({ search: debouncedSearch });

  const toggleAccess = useToggleParentAccess();
  const bulkBroadcast = useBulkBroadcast();

  // Infinite Scroll Hook via standard IntersectionObserver
  const viewportRef = useRef<HTMLDivElement>(null);
  const loadMoreRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { root: viewportRef.current, threshold: 0.1 }
    );

    const target = loadMoreRef.current;
    if (target) observer.observe(target);

    return () => {
      if (target) observer.unobserve(target);
    };
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const parents = useMemo(() => {
    return data?.pages.flatMap((page) => page.parents) ?? [];
  }, [data]);

  const handleToggleAccess = async (parent: ParentUser) => {
    if (!isOwner) return;
    const newStatus = parent.status === "active" ? "disabled" : "active";
    try {
      const res = await toggleAccess.mutateAsync({ parentId: parent.id, status: newStatus });
      if (res.ok) {
        showSuccessToast(`Parent access ${newStatus === "active" ? "granted" : "revoked"}`);
      } else {
        showErrorToast(res.msg || "Failed to update access");
      }
    } catch (err) {
      showErrorToast("Error updating access");
    }
  };

  const handleBroadcast = async () => {
    if (!messageContent.trim()) {
      showErrorToast("Message cannot be empty");
      return;
    }
    const targets = targetParent ? [targetParent.id] : selectedParents;
    if (targets.length === 0) {
      showErrorToast("No parents selected");
      return;
    }

    try {
      const res = await bulkBroadcast.mutateAsync({ parentIds: targets, message: messageContent });
      if (res.ok) {
        showSuccessToast(res.msg || "Message queued for delivery");
        setBroadcastModalOpen(false);
        setQuickMessageModalOpen(false);
        setMessageContent("");
        if (!targetParent) {
          setSelectedParents([]);
        }
      } else {
        showErrorToast(res.msg || "Failed to send message");
      }
    } catch (err) {
      showErrorToast("Error sending message");
    }
  };

  const openQuickMessage = (parent: ParentUser) => {
    setTargetParent(parent);
    setMessageContent("");
    setQuickMessageModalOpen(true);
  };

  const openBulkBroadcast = () => {
    if (selectedParents.length === 0) {
      showErrorToast("Select at least one parent to broadcast.");
      return;
    }
    setTargetParent(null);
    setMessageContent("");
    setBroadcastModalOpen(true);
  };

  const columns = [
    {
      key: "parentId",
      header: "Parent ID",
      render: (p: ParentUser) => (
        <span className="inline-flex items-center rounded-md bg-secondary/80 px-2 py-1 text-xs font-semibold text-secondary-foreground shadow-sm">
          {p.customId || "PAR-XXXXX"}
        </span>
      ),
    },
    { key: "parentName", header: "Parent Name", render: (p: ParentUser) => <span className="font-medium">{p.name}</span> },
    { key: "whatsapp", header: "WhatsApp Number", render: (p: ParentUser) => p.phone || "—" },
    {
      key: "linkedStudents",
      header: "Linked Students",
      render: (p: ParentUser) => {
        if (p.students.length === 0) {
          return <span className="text-muted-foreground text-xs italic">None</span>;
        }
        
        if (p.students.length === 1) {
          return (
            <span className="inline-flex items-center rounded-md bg-primary/10 border border-primary/20 px-2 py-1 text-xs font-semibold tracking-wide text-primary">
              {p.students[0].name}
            </span>
          );
        }

        return (
          <ul className="flex flex-col items-start gap-1.5 list-none p-0 m-0">
            {p.students.map((s) => (
              <li key={s.id} className="flex items-center gap-1.5">
                <span className="h-1 w-1 rounded-full bg-primary/50"></span>
                <span className="inline-flex items-center rounded-md bg-primary/10 border border-primary/20 px-2 py-0.5 text-[11px] font-semibold tracking-wide text-primary">
                  {s.name}
                </span>
              </li>
            ))}
          </ul>
        );
      },
    },
  ];

  if (!isOwner) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <p className="text-muted-foreground">You do not have permission to view this page.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Parents Directory</h1>
          <p className="text-sm text-muted-foreground">
            Manage portal access and broadcast messages to parents.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={openBulkBroadcast} disabled={selectedParents.length === 0}>
            <Send className="mr-2 h-4 w-4" /> Broadcast
          </Button>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="flex items-center justify-between rounded-xl border border-border bg-card p-4">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            placeholder="Search by name, ID, or phone..."
            className="w-full rounded-md border border-input bg-background py-2 pl-9 pr-4 text-sm outline-none focus:ring-2 focus:ring-primary/20"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Data Table */}
      <div className="rounded-xl border border-border bg-card shadow-sm">
        <div className="overflow-x-auto" ref={viewportRef}>
          <DataTable
            columns={columns}
            data={parents}
            isLoading={isLoading && !isFetchingNextPage}
            selectable
            onSelectionChange={setSelectedParents}
            emptyMessage="No parents found."
          />
          {/* Infinite Scroll trigger */}
          <div ref={loadMoreRef} className="h-1" />
          {isFetchingNextPage && (
            <div className="py-4 text-center text-sm text-muted-foreground">
              Loading more parents...
            </div>
          )}
        </div>
      </div>

      {/* Bulk Broadcast Modal */}
      <Modal open={broadcastModalOpen} onClose={() => setBroadcastModalOpen(false)} title="Bulk Broadcast">
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Send a WhatsApp broadcast to {selectedParents.length} selected parent(s). Messages are sent with a slight delay to prevent rate limits.
          </p>
          <textarea
            className="h-32 w-full rounded-md border border-input bg-background p-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
            placeholder="Type your announcement here..."
            value={messageContent}
            onChange={(e) => setMessageContent(e.target.value)}
          />
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setBroadcastModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleBroadcast} isLoading={bulkBroadcast.isPending}>
              <Send className="mr-2 h-4 w-4" /> Send Broadcast
            </Button>
          </div>
        </div>
      </Modal>

      {/* Quick Message Modal */}
      <Modal open={quickMessageModalOpen} onClose={() => setQuickMessageModalOpen(false)} title="Quick Message">
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Send a WhatsApp message directly to {targetParent?.name}.
          </p>
          <textarea
            className="h-32 w-full rounded-md border border-input bg-background p-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
            placeholder="Type your message here..."
            value={messageContent}
            onChange={(e) => setMessageContent(e.target.value)}
          />
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setQuickMessageModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleBroadcast} isLoading={bulkBroadcast.isPending}>
              <Send className="mr-2 h-4 w-4" /> Send Message
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
