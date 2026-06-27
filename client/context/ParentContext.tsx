"use client";

import React, { createContext, useContext, useEffect, useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { parentApi } from "@/services/parent.api";

type Child = {
  _id: string;
  name: string;
  batchId?: { _id: string; batchName: string; session: string };
};

type ParentContextType = {
  childrenList: Child[];
  selectedChildId: string | null;
  selectedChild: Child | null;
  setSelectedChildId: (id: string) => void;
  isLoading: boolean;
};

const ParentContext = createContext<ParentContextType | undefined>(undefined);

export function ParentProvider({ children }: { children: React.ReactNode }) {
  const [selectedChildId, setSelectedChildId] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["parent", "my-children"],
    queryFn: async () => {
      const res = await parentApi.getMyChildren();
      if (!res.ok) throw new Error("Failed to load children");
      return res.data as Child[];
    },
    retry: false,
  });

  const childrenList = data || [];

  useEffect(() => {
    if (childrenList.length > 0 && !selectedChildId) {
      setSelectedChildId(childrenList[0]._id);
    }
  }, [childrenList, selectedChildId]);

  const selectedChild = useMemo(() => {
    return childrenList.find((c) => c._id === selectedChildId) || null;
  }, [childrenList, selectedChildId]);

  return (
    <ParentContext.Provider
      value={{
        childrenList,
        selectedChildId,
        selectedChild,
        setSelectedChildId,
        isLoading,
      }}
    >
      {children}
    </ParentContext.Provider>
  );
}

export function useParentContext() {
  const ctx = useContext(ParentContext);
  if (!ctx) {
    throw new Error("useParentContext must be used within ParentProvider");
  }
  return ctx;
}
