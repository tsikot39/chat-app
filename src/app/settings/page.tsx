"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { authenticatedFetch } from "@/lib/fetch";
import {
  ArrowLeft,
  Moon,
  Sun,
  Bell,
  User,
  Shield,
  MessageCircle,
  Palette,
  Save,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { testNotificationSound, updateSoundSettings } from "@/lib/sounds";
import {
  testDesktopNotification,
  updateNotificationSettings,
  requestNotificationPermission as requestPermission,
} from "@/lib/notifications";
import { useUserStatus } from "@/hooks/useUserStatus";

interface UserSettings {
  notifications: {
    sound: boolean;
    desktop: boolean;
    messagePreview: boolean;
    newMessages: boolean;
    mentions: boolean;
  };
  privacy: {
    onlineStatus: boolean;
    readReceipts: boolean;
    whoCanMessage: "everyone" | "contacts";
    typing: boolean;
  };
  chat: {
    enterToSend: boolean;
    fontSize: "small" | "medium" | "large";
    showTimestamps: boolean;
    messageHistory: number;
  };
  profile: {
    displayName: string;
    statusMessage: string;
  };
}

const defaultSettings: UserSettings = {
  notifications: {
    sound: true,
    desktop: true,
    messagePreview: true,
    newMessages: true,
    mentions: true,
  },
  privacy: {
    onlineStatus: true,
    readReceipts: true,
    whoCanMessage: "everyone",
    typing: true,
  },
  chat: {
    enterToSend: true,
    fontSize: "medium",
    showTimestamps: true,
    messageHistory: 30,
  },
  profile: {
    displayName: "",
    statusMessage: "",
  },
};

export default function SettingsPage() {
  const { data: session } = useSession();
  const { theme, setTheme } = useTheme();
  const router = useRouter();
  const [settings, setSettings] = useState<UserSettings>(defaultSettings);
  const [isSaving, setIsSaving] = useState(false);
  const [isCleaningUp, setIsCleaningUp] = useState(false);
  const [cleanupStats, setCleanupStats] = useState<{
    totalMessages: number;
    oldMessages: number;
    lastCleanup?: string;
  } | null>(null);
  const [mounted, setMounted] = useState(false);
  const { updateStatus } = useUserStatus();

  useEffect(() => {
    setMounted(true);
  }, []);

  const loadSettingsFromDatabase = useCallback(async () => {
    try {
      // Load user settings
      const settingsResponse = await authenticatedFetch("/api/user/settings");
      let loadedSettings = null;

      if (settingsResponse.ok) {
        const settingsData = await settingsResponse.json();
        loadedSettings = settingsData.settings;
        console.log("Settings loaded from database:", loadedSettings);
      } else {
        console.log("No settings found in database, using defaults");
      }

      // Load user profile data
      const profileResponse = await authenticatedFetch("/api/user/profile");
      let profileData = null;

      if (profileResponse.ok) {
        const profileResponseData = await profileResponse.json();
        profileData = profileResponseData.user;
        console.log("Profile loaded from database:", profileData);
      }

      // Update settings with both database data and profile data
      setSettings((prev) => ({
        ...prev,
        ...(loadedSettings || {}),
        profile: {
          ...prev.profile,
          displayName: profileData?.name || session?.user?.name || "",
          statusMessage: profileData?.statusMessage || "",
        },
      }));
    } catch (error) {
      console.error("Error loading settings from database:", error);
    }
  }, [session?.user?.name]);

  useEffect(() => {
    if (session?.user) {
      // Load user settings and profile data from database
      loadSettingsFromDatabase();
    }
  }, [session, loadSettingsFromDatabase]);

  const saveSettings = async () => {
    setIsSaving(true);
    try {
      // Save settings to database
      const response = await authenticatedFetch("/api/user/settings", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ settings }),
      });

      if (!response.ok) {
        throw new Error("Failed to save settings to database");
      }

      // Always update profile when saving settings (to ensure status message is saved)
      await updateProfile();

      toast.success("Settings saved successfully");
    } catch (error) {
      console.error("Error saving settings:", error);
      toast.error("Failed to save settings");
    } finally {
      setIsSaving(false);
    }
  };

  const updateProfile = async () => {
    try {
      const response = await authenticatedFetch("/api/user/profile", {
        method: "PUT",
        body: JSON.stringify({
          name: settings.profile.displayName,
          statusMessage: settings.profile.statusMessage,
          // Remove customAvatar since we only use Google profile images
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update profile");
      }

      await response.json();
    } catch (error) {
      console.error("Error updating profile:", error);
      throw error;
    }
  };

  const updateSetting = (
    category: keyof UserSettings,
    key: string,
    value: unknown
  ) => {
    setSettings((prev) => ({
      ...prev,
      [category]: {
        ...prev[category],
        [key]: value,
      },
    }));
  };

  const handleOnlineStatusChange = async (checked: boolean) => {
    updateSetting("privacy", "onlineStatus", checked);
    // Immediately update the user's online status based on the new setting
    if (checked) {
      // If enabling online status, set user as online
      await updateStatus(true);
    } else {
      // If disabling online status, set user as offline
      await updateStatus(false);
    }
  };

  const requestNotificationPermission = async () => {
    try {
      const granted = await requestPermission();
      if (granted) {
        updateSetting("notifications", "desktop", true);
        updateNotificationSettings(true, settings.notifications.messagePreview);
        toast.success("Desktop notifications enabled");
      } else {
        updateSetting("notifications", "desktop", false);
        updateNotificationSettings(
          false,
          settings.notifications.messagePreview
        );
        toast.error("Desktop notifications denied");
      }
    } catch (error) {
      console.error("Error requesting notification permission:", error);
      toast.error("Failed to request notification permission");
    }
  };

  const loadCleanupStats = async () => {
    try {
      const response = await authenticatedFetch("/api/messages/cleanup");
      if (response.ok) {
        const data = await response.json();
        setCleanupStats({
          totalMessages: data.totalMessages,
          oldMessages: data.oldMessages,
          lastCleanup: new Date().toISOString(),
        });
      }
    } catch (error) {
      console.error("Error loading cleanup stats:", error);
    }
  };

  const handleCleanupMessages = async () => {
    setIsCleaningUp(true);
    try {
      const response = await authenticatedFetch("/api/messages/cleanup", {
        method: "POST",
      });

      if (response.ok) {
        const data = await response.json();
        toast.success(`Cleaned up ${data.deletedCount} old messages`);
        await loadCleanupStats(); // Refresh stats
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || "Failed to cleanup messages");
      }
    } catch (error) {
      console.error("Error cleaning up messages:", error);
      toast.error("Failed to cleanup messages");
    } finally {
      setIsCleaningUp(false);
    }
  };

  // Load cleanup stats when component mounts
  useEffect(() => {
    if (mounted) {
      loadCleanupStats();
    }
  }, [mounted]);

  if (!session) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p>Please sign in to access settings</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto max-w-4xl p-6">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.back()}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Settings</h1>
            <p className="text-muted-foreground">
              Manage your NexusChat preferences
            </p>
          </div>
        </div>

        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
            <TabsTrigger value="privacy">Privacy</TabsTrigger>
            <TabsTrigger value="chat">Chat</TabsTrigger>
            <TabsTrigger value="appearance">Appearance</TabsTrigger>
          </TabsList>

          {/* Profile Settings */}
          <TabsContent value="profile" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Profile Information
                </CardTitle>
                <CardDescription>
                  Update your profile information and status
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center gap-4">
                  <Avatar className="h-20 w-20">
                    <AvatarImage
                      src={session?.user?.image || ""}
                      alt="Profile"
                    />
                    <AvatarFallback>
                      {settings.profile.displayName?.charAt(0) ||
                        session.user?.name?.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <p className="text-sm text-muted-foreground">
                      Your profile picture is automatically provided by Google
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="displayName">Display Name</Label>
                    <Input
                      id="displayName"
                      value={settings.profile.displayName}
                      onChange={(e) =>
                        updateSetting("profile", "displayName", e.target.value)
                      }
                      placeholder="Enter your display name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      value={session.user?.email || ""}
                      disabled
                      className="bg-muted"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="statusMessage">Status Message</Label>
                  <Input
                    id="statusMessage"
                    value={settings.profile.statusMessage}
                    onChange={(e) =>
                      updateSetting("profile", "statusMessage", e.target.value)
                    }
                    placeholder="What's on your mind?"
                    maxLength={100}
                  />
                  <p className="text-xs text-muted-foreground">
                    {settings.profile.statusMessage.length}/100 characters
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Notifications Settings */}
          <TabsContent value="notifications" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="h-5 w-5" />
                  Notification Preferences
                </CardTitle>
                <CardDescription>
                  Control how you receive notifications
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label>Sound Notifications</Label>
                    <p className="text-sm text-muted-foreground">
                      Play sound when receiving messages
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        testNotificationSound().catch(console.error)
                      }
                    >
                      Test Sound
                    </Button>
                    <Switch
                      checked={settings.notifications.sound}
                      onCheckedChange={(checked) => {
                        updateSetting("notifications", "sound", checked);
                        updateSoundSettings(checked);
                      }}
                    />
                  </div>
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label>Desktop Notifications</Label>
                    <p className="text-sm text-muted-foreground">
                      Show desktop notifications for new messages
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        testDesktopNotification().catch(console.error)
                      }
                      disabled={!settings.notifications.desktop}
                    >
                      Test Notification
                    </Button>
                    <Switch
                      checked={settings.notifications.desktop}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          requestNotificationPermission();
                        } else {
                          updateSetting("notifications", "desktop", false);
                          updateNotificationSettings(
                            false,
                            settings.notifications.messagePreview
                          );
                        }
                      }}
                    />
                  </div>
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label>Message Preview</Label>
                    <p className="text-sm text-muted-foreground">
                      Show message content in notifications
                    </p>
                  </div>
                  <Switch
                    checked={settings.notifications.messagePreview}
                    onCheckedChange={(checked) => {
                      updateSetting("notifications", "messagePreview", checked);
                      updateNotificationSettings(
                        settings.notifications.desktop,
                        checked
                      );
                    }}
                  />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label>New Messages</Label>
                    <p className="text-sm text-muted-foreground">
                      Notify for all new messages
                    </p>
                  </div>
                  <Switch
                    checked={settings.notifications.newMessages}
                    onCheckedChange={(checked) =>
                      updateSetting("notifications", "newMessages", checked)
                    }
                  />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label>Mentions Only</Label>
                    <p className="text-sm text-muted-foreground">
                      Only notify when mentioned or replied to
                    </p>
                  </div>
                  <Switch
                    checked={settings.notifications.mentions}
                    onCheckedChange={(checked) =>
                      updateSetting("notifications", "mentions", checked)
                    }
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Privacy Settings */}
          <TabsContent value="privacy" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Privacy & Security
                </CardTitle>
                <CardDescription>
                  Control your privacy and security settings
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label>Online Status</Label>
                    <p className="text-sm text-muted-foreground">
                      Show when you&apos;re online to other users
                    </p>
                  </div>
                  <Switch
                    checked={settings.privacy.onlineStatus}
                    onCheckedChange={handleOnlineStatusChange}
                  />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label>Read Receipts</Label>
                    <p className="text-sm text-muted-foreground">
                      Let others know when you&apos;ve read their messages
                    </p>
                  </div>
                  <Switch
                    checked={settings.privacy.readReceipts}
                    onCheckedChange={(checked) =>
                      updateSetting("privacy", "readReceipts", checked)
                    }
                  />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label>Typing Indicators</Label>
                    <p className="text-sm text-muted-foreground">
                      Show when you&apos;re typing to others
                    </p>
                  </div>
                  <Switch
                    checked={settings.privacy.typing}
                    onCheckedChange={(checked) =>
                      updateSetting("privacy", "typing", checked)
                    }
                  />
                </div>

                <Separator />

                <div className="space-y-3">
                  <Label>Who can message you</Label>
                  <Select
                    value={settings.privacy.whoCanMessage}
                    onValueChange={(value: "everyone" | "contacts") =>
                      updateSetting("privacy", "whoCanMessage", value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="everyone">Everyone</SelectItem>
                      <SelectItem value="contacts">Contacts only</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-sm text-muted-foreground">
                    Control who can send you messages
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Chat Settings */}
          <TabsContent value="chat" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageCircle className="h-5 w-5" />
                  Chat Preferences
                </CardTitle>
                <CardDescription>
                  Customize your chat experience
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label>Enter to Send</Label>
                    <p className="text-sm text-muted-foreground">
                      Press Enter to send messages (Shift+Enter for new line)
                    </p>
                  </div>
                  <Switch
                    checked={settings.chat.enterToSend}
                    onCheckedChange={(checked) =>
                      updateSetting("chat", "enterToSend", checked)
                    }
                  />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label>Show Timestamps</Label>
                    <p className="text-sm text-muted-foreground">
                      Display timestamps on messages
                    </p>
                  </div>
                  <Switch
                    checked={settings.chat.showTimestamps}
                    onCheckedChange={(checked) =>
                      updateSetting("chat", "showTimestamps", checked)
                    }
                  />
                </div>

                <Separator />

                <div className="space-y-3">
                  <Label>Font Size</Label>
                  <Select
                    value={settings.chat.fontSize}
                    onValueChange={(value: "small" | "medium" | "large") =>
                      updateSetting("chat", "fontSize", value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="small">Small</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="large">Large</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-sm text-muted-foreground">
                    Adjust the font size for messages
                  </p>
                </div>

                <Separator />

                <div className="space-y-3">
                  <Label>Message History</Label>
                  <Select
                    value={settings.chat.messageHistory.toString()}
                    onValueChange={(value) =>
                      updateSetting("chat", "messageHistory", parseInt(value))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="7">7 days</SelectItem>
                      <SelectItem value="30">30 days</SelectItem>
                      <SelectItem value="90">90 days</SelectItem>
                      <SelectItem value="365">1 year</SelectItem>
                      <SelectItem value="0">Never delete</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-sm text-muted-foreground">
                    How long to keep message history. Messages older than this
                    will be automatically deleted.
                  </p>

                  {/* Cleanup Stats and Manual Cleanup */}
                  {cleanupStats && (
                    <div className="mt-4 p-4 bg-muted rounded-lg">
                      <div className="space-y-2">
                        <p className="text-sm">
                          <strong>Total messages:</strong>{" "}
                          {cleanupStats.totalMessages}
                        </p>
                        {settings.chat.messageHistory > 0 && (
                          <p className="text-sm">
                            <strong>Messages that will be cleaned:</strong>{" "}
                            {cleanupStats.oldMessages}
                          </p>
                        )}
                        <Button
                          onClick={handleCleanupMessages}
                          disabled={isCleaningUp}
                          size="sm"
                          variant="outline"
                          className="mt-2"
                        >
                          {isCleaningUp ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              Cleaning up...
                            </>
                          ) : (
                            "Clean up old messages now"
                          )}
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Appearance Settings */}
          <TabsContent value="appearance" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Palette className="h-5 w-5" />
                  Appearance
                </CardTitle>
                <CardDescription>
                  Customize the look and feel of NexusChat
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-3">
                  <Label>Theme</Label>
                  {mounted ? (
                    <div className="flex gap-2">
                      <Button
                        variant={theme === "light" ? "default" : "outline"}
                        size="sm"
                        onClick={() => setTheme("light")}
                        className="flex items-center gap-2"
                      >
                        <Sun className="h-4 w-4" />
                        Light
                      </Button>
                      <Button
                        variant={theme === "dark" ? "default" : "outline"}
                        size="sm"
                        onClick={() => setTheme("dark")}
                        className="flex items-center gap-2"
                      >
                        <Moon className="h-4 w-4" />
                        Dark
                      </Button>
                      <Button
                        variant={theme === "system" ? "default" : "outline"}
                        size="sm"
                        onClick={() => setTheme("system")}
                        className="flex items-center gap-2"
                      >
                        System
                      </Button>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        disabled
                        className="flex items-center gap-2"
                      >
                        <Sun className="h-4 w-4" />
                        Light
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled
                        className="flex items-center gap-2"
                      >
                        <Moon className="h-4 w-4" />
                        Dark
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled
                        className="flex items-center gap-2"
                      >
                        System
                      </Button>
                    </div>
                  )}
                  <p className="text-sm text-muted-foreground">
                    Choose your preferred theme
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Save Button */}
        <div className="flex justify-end pt-6">
          <Button onClick={saveSettings} disabled={isSaving} size="lg">
            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            <Save className="mr-2 h-4 w-4" />
            {isSaving ? "Saving..." : "Save Settings"}
          </Button>
        </div>
      </div>
    </div>
  );
}
