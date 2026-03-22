import { createClient } from "@/infrastructure/supabase/server";

type CreateCreatorProfileInput = {
  userId: string;
};

function buildDefaultUsername(userId: string) {
  return `creator_${userId.slice(0, 8)}`;
}

export async function createCreatorProfile({
  userId,
}: CreateCreatorProfileInput) {
  const supabase = await createClient();

  const username = buildDefaultUsername(userId);

  const { data, error } = await supabase
    .from("creators")
    .insert({
      user_id: userId,
      username, // 👉 username은 URL 때문에 필수
    })
    .select()
    .single();

  if (error) {
    // 🔥 이미 존재하는 경우 (UNIQUE)
    if (error.code === "23505") {
      const { data: existing, error: fetchError } = await supabase
        .from("creators")
        .select("*")
        .eq("user_id", userId)
        .single();

      if (fetchError) {
        throw fetchError;
      }

      return existing;
    }

    console.error("createCreatorProfile error:", error);
    throw error;
  }

  return data;
}