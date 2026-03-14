"use client";

import type React from "react";
import { createContext, useContext } from "react";

export type SubscriptionContextValue = {
  subscriptionStatus: string | null;
  subscriptionStartDate: string | null;
  subscriptionEndDate: string | null;
  planType: string | null;
  blocked: boolean;
  blockedReason: string | null;
  loading: boolean;
};

const SubscriptionContext = createContext<SubscriptionContextValue | null>(null);

export const SubscriptionProvider = ({
  value,
  children,
}: {
  value: SubscriptionContextValue;
  children: React.ReactNode;
}) => {
  return <SubscriptionContext.Provider value={value}>{children}</SubscriptionContext.Provider>;
};

export const useSubscription = () => {
  const ctx = useContext(SubscriptionContext);
  if (!ctx) {
    return {
      subscriptionStatus: null,
      subscriptionStartDate: null,
      subscriptionEndDate: null,
      planType: null,
      blocked: false,
      blockedReason: null,
      loading: true,
      isActive: false,
      isPending: false,
      isBlocked: false,
    };
  }

  const isActive = ctx.subscriptionStatus === "active";
  const isPending = ctx.subscriptionStatus === "pending_payment";
  const isBlocked = ctx.subscriptionStatus === "blocked" || ctx.blocked;

  return {
    ...ctx,
    isActive,
    isPending,
    isBlocked,
  };
};
