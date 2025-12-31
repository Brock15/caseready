import type { User } from "@supabase/supabase-js";

export type UserPlan = "free" | "solo" | "firm";

export const getUserPlan = (user?: User | null): UserPlan => {
  const FALLBACK_FIRM_EMAILS = new Set(["brockstar1215@gmail.com"]);
  const FALLBACK_FIRM_IDS = new Set(["c46c028c-0e2c-41a0-bad4-900740c4a895"]);

  const planValue =
    String(
      user?.user_metadata?.plan ||
        user?.app_metadata?.plan ||
        user?.user_metadata?.tier ||
        ""
    ).toLowerCase() || "";

  const firmFlags =
    planValue === "firm" ||
    planValue === "enterprise" ||
    user?.user_metadata?.firmAccess === true ||
    user?.user_metadata?.org_role === "admin" ||
    (user?.email && FALLBACK_FIRM_EMAILS.has(user.email)) ||
    (user?.id && FALLBACK_FIRM_IDS.has(user.id));

  if (firmFlags) {
    return "firm";
  }

  const soloFlags =
    planValue === "solo" ||
    planValue === "paid" ||
    planValue === "premium" ||
    user?.user_metadata?.isPaid === true ||
    user?.user_metadata?.premiumAccess === true ||
    user?.user_metadata?.hasUnlimitedExports === true ||
    user?.user_metadata?.isBetaTester === true;

  if (soloFlags) {
    return "solo";
  }

  return "free";
};

export const getUserFormatPermissions = (user?: User | null) => {
  const plan = getUserPlan(user);
  return {
    plan,
    allowPresets:
      plan === "firm"
        ? (["quick", "formal", "firm_branded"] as const)
        : plan === "solo"
        ? (["quick", "formal"] as const)
        : (["quick"] as const),
    allowAdvanced: plan !== "free",
  };
};
