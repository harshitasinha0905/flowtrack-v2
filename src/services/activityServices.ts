import { supabase } from "../lib/supabase";

type RecentActivity = {
  id: string;
  action: string;
  entity_type: string;
  entity_id: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  profiles: {
    full_name: string;
  } | null;
};

export async function getRecentActivity(): Promise<RecentActivity[]> {
  const { data, error } = await supabase
    .from("activity_logs")
    .select(
      `
      id,
      action,
      entity_type,
      entity_id,
      metadata,
      created_at,
      profiles!activity_logs_user_id_fkey (
        full_name
      )
    `,
    )
    .order("created_at", { ascending: false })
    .limit(8);

  if (error) {
    throw new Error("Recent activity could not be loaded");
  }

  return data.map((activity) => ({
    ...activity,
    profiles: Array.isArray(activity.profiles)
      ? (activity.profiles[0] ?? null)
      : activity.profiles,
  }));
}
