// Utility functions for handling user avatars

export const getUserAvatar = (sessionImage?: string | null): string => {
  // Only use Google profile image from session
  return sessionImage || "";
};

export const getCurrentUserAvatar = (): string => {
  // For consistency, return empty string since we only use Google avatars
  return "";
};
