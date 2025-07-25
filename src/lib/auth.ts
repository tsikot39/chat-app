import GoogleProvider from "next-auth/providers/google";
import { isValidToken, sanitizeSessionForClient } from "./session-utils";

export const authOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async signIn({ user, account }: any) {
      try {
        if (!user || !account) {
          console.error("SignIn callback: Missing user or account");
          return false;
        }

        if (account.provider === "google") {
          console.log("Google sign-in attempt for:", user.email);

          // Dynamic import to avoid loading MongoDB connection at module level
          const connectDB = (await import("@/lib/mongodb")).default;
          const User = (await import("@/models/User")).default;

          await connectDB();

          // Check if user already exists
          let existingUser = await User.findOne({ email: user.email });

          if (existingUser) {
            console.log("Updating existing user:", user.email);

            // Check user's online status privacy setting
            const onlineStatusEnabled =
              existingUser.settings?.privacy?.onlineStatus !== false;

            // Update existing user with Google info
            await User.findByIdAndUpdate(existingUser._id, {
              name: user.name,
              image: user.image,
              provider: "google",
              isOnline: onlineStatusEnabled,
              lastSeen: new Date(),
            });
          } else {
            console.log("Creating new user:", user.email);
            // Create new user for Google sign-in (default privacy settings allow online status)
            existingUser = await User.create({
              email: user.email,
              name: user.name,
              image: user.image,
              provider: "google",
              isOnline: true,
              lastSeen: new Date(),
            });
          }

          console.log("Google sign-in successful for:", user.email);
          return true;
        }

        return false;
      } catch (error) {
        console.error("Error in signIn callback:", error);
        return false;
      }
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async jwt({ token, user, account }: any) {
      try {
        // If this is the initial sign-in (has account), process the user
        if (account?.provider === "google" && user?.email) {
          const email = user.email;

          // Dynamic import to avoid loading MongoDB connection at module level
          const connectDB = (await import("@/lib/mongodb")).default;
          const User = (await import("@/models/User")).default;

          await connectDB();
          const dbUser = await User.findOne({ email });

          if (dbUser) {
            return {
              userId: dbUser._id.toString(),
              email: dbUser.email,
              name: dbUser.name,
              picture: dbUser.image,
            };
          } else {
            console.error("JWT callback - user not found in database:", email);
            return {};
          }
        }

        // For subsequent requests, only process if we have a valid existing token
        if (token?.email && !account) {
          // Dynamic import to avoid loading MongoDB connection at module level
          const connectDB = (await import("@/lib/mongodb")).default;
          const User = (await import("@/models/User")).default;

          await connectDB();
          const dbUser = await User.findOne({ email: token.email });

          if (dbUser) {
            return {
              userId: dbUser._id.toString(),
              email: dbUser.email,
              name: dbUser.name,
              picture: dbUser.image,
            };
          } else {
            // If user doesn't exist in database, return empty token to force re-authentication
            return {};
          }
        }

        // If we get here with no valid conditions, return empty token
        return {};
      } catch (error) {
        console.error("Error in JWT callback:", error);
        return {};
      }
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async session({ session, token }: any) {
      try {
        console.log(
          "Session callback - token:",
          token
            ? {
                userId: token.userId,
                email: token.email,
              }
            : "No token"
        );

        // Early return for invalid tokens - return proper null session structure
        if (!isValidToken(token)) {
          console.log("No valid session found");
          return null;
        }

        // Ensure we have essential data before proceeding
        if (!token.userId || !token.email) {
          console.log("Session callback - missing essential token data");
          return null;
        }

        console.log("Session callback - set user ID:", token.userId);

        // Create a guaranteed valid session structure
        const validSession = {
          user: {
            id: String(token.userId),
            email: String(token.email),
            name: String(token.name || ""),
            image: String(token.picture || ""),
          },
          expires:
            session?.expires ||
            new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        };

        const finalSession = sanitizeSessionForClient(validSession);
        console.log(
          "Session callback - final session:",
          finalSession
            ? {
                userId: finalSession.user?.id,
                email: finalSession.user?.email,
              }
            : "No session"
        );

        // Ensure we never return undefined - always return null or valid session
        return finalSession || null;
      } catch (error) {
        console.error("Error in session callback:", error);
        return null;
      }
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async redirect({ url, baseUrl }: any) {
      try {
        console.log("Redirect callback - url:", url, "baseUrl:", baseUrl);

        // Redirect to chat after successful authentication
        if (url.startsWith(baseUrl)) {
          // If the URL is a relative URL, redirect to chat
          if (
            url === baseUrl ||
            url === `${baseUrl}/` ||
            url.includes("/auth/signin")
          ) {
            console.log("Redirecting to chat");
            return `${baseUrl}/chat`;
          }
        }

        // Default redirect to chat page
        return `${baseUrl}/chat`;
      } catch (error) {
        console.error("Error in redirect callback:", error);
        return `${baseUrl}/chat`;
      }
    },
  },
  pages: {
    signIn: "/auth/signin",
    signOut: "/",
    error: "/auth/error",
  },
  session: {
    strategy: "jwt" as const,
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  cookies: {
    sessionToken: {
      name: `next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: false, // Set to false for localhost
      },
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
  debug: false, // Disable debug to reduce console noise
};
