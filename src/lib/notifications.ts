// Desktop notification utilities for chat messages
import { authenticatedFetch } from "@/lib/fetch";

class DesktopNotifications {
  private static instance: DesktopNotifications;
  private isEnabled: boolean = false;
  private showPreview: boolean = true;

  constructor() {
    if (typeof window !== "undefined") {
      this.loadSettings();
    }
  }

  static getInstance(): DesktopNotifications {
    if (!DesktopNotifications.instance) {
      DesktopNotifications.instance = new DesktopNotifications();
    }
    return DesktopNotifications.instance;
  }

  private async loadSettings() {
    if (typeof window === "undefined") return;

    try {
      console.log("Loading notification settings from database...");

      const response = await authenticatedFetch("/api/user/settings");
      if (response.ok) {
        const data = await response.json();
        const settings = data.settings;

        console.log("Parsed settings from database:", settings);

        this.isEnabled = settings.notifications?.desktop ?? false;
        this.showPreview = settings.notifications?.messagePreview ?? true;

        console.log("Notification settings loaded:", {
          isEnabled: this.isEnabled,
          showPreview: this.showPreview,
        });
      } else {
        console.log("Failed to load settings from database, using defaults");
        this.isEnabled = false;
        this.showPreview = true;
      }
    } catch (error) {
      console.error("Error loading notification settings:", error);
      this.isEnabled = false;
      this.showPreview = true;
    }
  }

  updateSettings(enabled: boolean, showPreview?: boolean) {
    this.isEnabled = enabled;
    if (showPreview !== undefined) {
      this.showPreview = showPreview;
    }

    // Save to database
    this.saveSettings();
  }

  async reloadSettings() {
    await this.loadSettings();
  }

  private async saveSettings() {
    if (typeof window === "undefined") return;

    try {
      // First, get current settings from database
      const response = await authenticatedFetch("/api/user/settings");
      if (response.ok) {
        const data = await response.json();
        const currentSettings = data.settings;

        // Update only notification settings, preserve others
        const updatedSettings = {
          ...currentSettings,
          notifications: {
            ...currentSettings.notifications,
            desktop: this.isEnabled,
            messagePreview: this.showPreview,
          },
        };

        // Save back to database
        const saveResponse = await authenticatedFetch("/api/user/settings", {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ settings: updatedSettings }),
        });

        if (!saveResponse.ok) {
          console.error("Failed to save notification settings to database");
        } else {
          console.log("Notification settings saved to database successfully");
        }
      }
    } catch (error) {
      console.error("Error saving notification settings:", error);
    }
  }

  async requestPermission(): Promise<boolean> {
    if (!("Notification" in window)) {
      console.warn("Desktop notifications not supported");
      return false;
    }

    if (Notification.permission === "granted") {
      return true;
    }

    if (Notification.permission === "denied") {
      return false;
    }

    const permission = await Notification.requestPermission();
    return permission === "granted";
  }

  async showMessageNotification(
    senderName: string,
    message: string,
    senderAvatar?: string
  ): Promise<void> {
    console.log("showMessageNotification called:", {
      senderName,
      message,
      isEnabled: this.isEnabled,
    });

    // Reload settings to ensure we have the latest
    await this.loadSettings();

    if (!this.isEnabled) {
      console.log("Notifications disabled, skipping");
      return;
    }

    if (!("Notification" in window)) {
      console.warn("Desktop notifications not supported");
      return;
    }

    if (Notification.permission !== "granted") {
      console.warn(
        "Desktop notification permission not granted, current permission:",
        Notification.permission
      );
      return;
    }

    try {
      const notificationBody = this.showPreview
        ? message.length > 100
          ? message.substring(0, 100) + "..."
          : message
        : "You have a new message";

      console.log("Creating notification:", {
        title: `New message from ${senderName}`,
        body: notificationBody,
      });

      const notification = new Notification(`New message from ${senderName}`, {
        body: notificationBody,
        icon: senderAvatar || "/favicon.ico",
        tag: "nexuschat-message", // Prevents multiple notifications from stacking
        requireInteraction: false,
        silent: false, // Let the browser handle sound (we have our own sound system)
      });

      console.log("Notification created successfully");

      // Auto-close notification after 5 seconds
      setTimeout(() => {
        notification.close();
      }, 5000);

      // Focus the chat window when notification is clicked
      notification.onclick = () => {
        window.focus();
        notification.close();
      };
    } catch (error) {
      console.error("Error showing desktop notification:", error);
    }
  }

  async testNotification(): Promise<void> {
    console.log("Testing desktop notification...");

    // Reload settings to ensure we have the latest
    await this.loadSettings();

    console.log("isEnabled:", this.isEnabled);
    console.log("showPreview:", this.showPreview);
    console.log("Notification support:", "Notification" in window);
    console.log("Permission status:", Notification.permission);

    if (!this.isEnabled) {
      console.warn("Desktop notifications are disabled in settings");
      alert("Desktop notifications are disabled. Please enable them first.");
      return;
    }

    if (!("Notification" in window)) {
      console.warn("Desktop notifications not supported");
      alert("Desktop notifications are not supported in this browser.");
      return;
    }

    if (Notification.permission !== "granted") {
      console.warn("Notification permission not granted");
      alert(
        "Notification permission not granted. Please enable desktop notifications first."
      );
      return;
    }

    const testMessage = this.showPreview
      ? "Desktop notifications are working! 🎉"
      : "Test message preview setting";

    console.log("Showing test notification with message:", testMessage);
    await this.showMessageNotification("NexusChat", testMessage);
  }

  isSupported(): boolean {
    return "Notification" in window;
  }

  getPermissionStatus(): NotificationPermission {
    if (!("Notification" in window)) {
      return "denied";
    }
    return Notification.permission;
  }

  // Debug function to check current state
  debugStatus() {
    const status = {
      isSupported: "Notification" in window,
      permission: this.getPermissionStatus(),
      isEnabled: this.isEnabled,
      showPreview: this.showPreview,
      source: "database",
    };
    console.log("Desktop Notification Debug Status:", status);
    return status;
  }
}

// Singleton instance
export const desktopNotifications = DesktopNotifications.getInstance();

// Convenience functions
export const showMessageNotification = (
  senderName: string,
  message: string,
  senderAvatar?: string
) =>
  desktopNotifications.showMessageNotification(
    senderName,
    message,
    senderAvatar
  );

export const requestNotificationPermission = () =>
  desktopNotifications.requestPermission();

export const updateNotificationSettings = (
  enabled: boolean,
  showPreview?: boolean
) => desktopNotifications.updateSettings(enabled, showPreview);

export const reloadNotificationSettings = () =>
  desktopNotifications.reloadSettings();

export const testDesktopNotification = () =>
  desktopNotifications.testNotification();

export const isNotificationSupported = () => desktopNotifications.isSupported();

export const getNotificationPermission = () =>
  desktopNotifications.getPermissionStatus();

export const debugNotificationStatus = () => desktopNotifications.debugStatus();
