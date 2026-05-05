import { useQuery } from "@tanstack/react-query";
import { api } from "@shared/routes";
import { apiBase } from "@/lib/queryClient";

export function useLeaderboard() {
  return useQuery({
    queryKey: [api.leaderboard.list.path],
    queryFn: async () => {
      const res = await fetch(`${apiBase}${api.leaderboard.list.path}`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch leaderboard");
      return res.json();
    },
  });
}
