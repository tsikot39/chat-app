/**
 * Session utilities to handle NextAuth session validation and error prevention
 */

export function isValidSession(session: any): boolean {
  return (
    session &&
    session.user &&
    typeof session.user === "object" &&
    session.user.id &&
    session.user.email
  );
}

export function isValidToken(token: any): boolean {
  return (
    token &&
    typeof token === "object" &&
    token.email &&
    typeof token.email === "string"
  );
}

export function createEmptySession() {
  return {
    user: {
      id: "",
      email: "",
      name: "",
      image: "",
    },
    expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
  };
}

export function sanitizeSessionForClient(session: any) {
  if (!isValidSession(session)) {
    return null; // Return null instead of undefined to prevent client errors
  }

  return {
    user: {
      id: session.user.id || "",
      email: session.user.email || "",
      name: session.user.name || "",
      image: session.user.image || "",
    },
    expires:
      session.expires ||
      new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
  };
}
