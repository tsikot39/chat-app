// Custom fetch wrapper that automatically includes auth headers

export async function authenticatedFetch(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  // Only try to get token on client side
  const token =
    typeof window !== "undefined"
      ? localStorage.getItem("nexuschat-token")
      : null;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...((options.headers as Record<string, string>) || {}),
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  return fetch(url, {
    ...options,
    headers,
  });
}

// Helper function to get current user from localStorage
export function getCurrentUser() {
  try {
    const storedUser = localStorage.getItem("nexuschat-user");
    if (storedUser) {
      return JSON.parse(storedUser);
    }
  } catch (error) {
    console.error("Error parsing current user:", error);
  }
  return null;
}
