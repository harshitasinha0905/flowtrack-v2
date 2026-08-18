import { supabase } from "../lib/supabase";

export async function getProfiles() {
  const { data, error } = await supabase
    .from("profiles")
    .select("id, full_name,role");
  if (error) {
    throw new Error("Profiles could not be fetched");
  }
  return data;
}

export async function getCurrentProfile(user_id: string) {
  const { data, error } = await supabase
    .from("profiles")
    .select("id, full_name,role")
    .eq("id", user_id)
    .single();
  if (error) {
    throw new Error("Profiles could not be fetched");
  }
  return data;
}
