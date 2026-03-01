"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import Sidebar from "@/components/dashboard/Sidebar";
import DashboardHeader from "@/components/dashboard/Header";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import { useProfile } from "@/hooks/useProfile";
import { useSettings } from "@/hooks/useSettings";
import { useAuth } from "@/components/providers/AuthProvider";

export default function SettingsPage() {
  const { user, signOut } = useAuth();
  const {
    profile,
    isLoading: profileLoading,
    updateProfile,
    uploadAvatar,
  } = useProfile();
  const {
    settings,
    isLoading: settingsLoading,
    updateSettings,
  } = useSettings();

  // Track whether user has edited each field
  const [nameEdited, setNameEdited] = useState(false);
  const [localName, setLocalName] = useState("");

  // Derived values: use local state if edited, otherwise use server data
  const name = nameEdited ? localName : profile?.full_name || "";
  const email = user?.email || "";

  const setName = (value: string) => {
    setNameEdited(true);
    setLocalName(value);
  };

  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveMessage(null);

    const { error } = await updateProfile({ full_name: name });

    if (error) {
      setSaveMessage({ type: "error", text: error.message });
    } else {
      setSaveMessage({
        type: "success",
        text: "Profile updated successfully!",
      });
      // Reset edited state so it syncs with server data
      setNameEdited(false);
    }

    setIsSaving(false);
    setTimeout(() => setSaveMessage(null), 3000);
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      setSaveMessage({
        type: "error",
        text: "File size must be less than 2MB",
      });
      return;
    }

    setIsSaving(true);
    const { error } = await uploadAvatar(file);

    if (error) {
      setSaveMessage({ type: "error", text: error.message });
    } else {
      setSaveMessage({ type: "success", text: "Avatar updated!" });
    }

    setIsSaving(false);
    setTimeout(() => setSaveMessage(null), 3000);
  };

  const handleNotificationToggle = async (
    key: "notifications_enabled" | "email_notifications",
    value: boolean,
  ) => {
    await updateSettings({ [key]: value });
  };

  const handleDeleteAccount = async () => {
    if (
      confirm(
        "Are you sure you want to delete your account? This action cannot be undone.",
      )
    ) {
      // Note: Account deletion would require a server action with proper auth
      alert("Please contact support to delete your account.");
    }
  };

  const getInitials = () => {
    if (profile?.full_name) {
      return profile.full_name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);
    }
    return user?.email?.slice(0, 2).toUpperCase() || "??";
  };

  if (profileLoading || settingsLoading) {
    return (
      <div className="flex h-screen bg-zinc-50 dark:bg-zinc-950">
        <Sidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          <DashboardHeader />
          <main className="flex-1 overflow-y-auto p-6 flex items-center justify-center">
            <div className="animate-spin w-8 h-8 border-4 border-violet-500 border-t-transparent rounded-full" />
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-zinc-50 dark:bg-zinc-950">
      <Sidebar />

      <div className="flex-1 flex flex-col overflow-hidden">
        <DashboardHeader />

        <main className="flex-1 overflow-y-auto p-6">
          {/* Page Header */}
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">
              Settings
            </h1>
            <p className="text-zinc-600 dark:text-zinc-400">
              Manage your account settings and preferences.
            </p>
          </div>

          {/* Save Message */}
          {saveMessage && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`mb-6 p-4 rounded-lg ${
                saveMessage.type === "success"
                  ? "bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-400"
                  : "bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400"
              }`}
            >
              {saveMessage.text}
            </motion.div>
          )}

          <div className="max-w-3xl space-y-8">
            {/* Profile Settings */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-6"
            >
              <h2 className="text-lg font-semibold text-zinc-900 dark:text-white mb-6">
                Profile Settings
              </h2>

              <form onSubmit={handleSaveProfile} className="space-y-6">
                <div className="flex items-center gap-6">
                  {profile?.avatar_url ? (
                    <Image
                      src={profile.avatar_url}
                      alt="Avatar"
                      width={80}
                      height={80}
                      className="w-20 h-20 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-20 h-20 rounded-full bg-linear-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-white text-2xl font-bold">
                      {getInitials()}
                    </div>
                  )}
                  <div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarChange}
                      className="hidden"
                    />
                    <Button
                      variant="secondary"
                      size="sm"
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isSaving}
                    >
                      Change Avatar
                    </Button>
                    <p className="mt-2 text-xs text-zinc-500">
                      JPG, GIF or PNG. Max size of 2MB.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Input
                    label="Full Name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                  <Input
                    label="Email Address"
                    type="email"
                    value={email}
                    disabled
                  />
                </div>

                <div className="flex justify-end">
                  <Button type="submit" disabled={isSaving}>
                    {isSaving ? "Saving..." : "Save Changes"}
                  </Button>
                </div>
              </form>
            </motion.div>

            {/* Notification Settings */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-6"
            >
              <h2 className="text-lg font-semibold text-zinc-900 dark:text-white mb-6">
                Notification Settings
              </h2>

              <div className="space-y-4">
                <label className="flex items-center justify-between p-4 rounded-lg border border-zinc-200 dark:border-zinc-700 cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-800">
                  <div>
                    <p className="font-medium text-zinc-900 dark:text-white">
                      Email Notifications
                    </p>
                    <p className="text-sm text-zinc-600 dark:text-zinc-400">
                      Receive email updates about your tasks
                    </p>
                  </div>
                  <div className="relative">
                    <input
                      type="checkbox"
                      checked={settings?.email_notifications ?? true}
                      onChange={(e) =>
                        handleNotificationToggle(
                          "email_notifications",
                          e.target.checked,
                        )
                      }
                      className="sr-only"
                    />
                    <div
                      className={`w-11 h-6 rounded-full transition-colors ${
                        settings?.email_notifications
                          ? "bg-violet-600"
                          : "bg-zinc-300 dark:bg-zinc-700"
                      }`}
                    >
                      <div
                        className="w-5 h-5 rounded-full bg-white shadow-sm transition-transform absolute top-0.5"
                        style={{
                          transform: settings?.email_notifications
                            ? "translateX(22px)"
                            : "translateX(2px)",
                        }}
                      />
                    </div>
                  </div>
                </label>

                <label className="flex items-center justify-between p-4 rounded-lg border border-zinc-200 dark:border-zinc-700 cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-800">
                  <div>
                    <p className="font-medium text-zinc-900 dark:text-white">
                      Push Notifications
                    </p>
                    <p className="text-sm text-zinc-600 dark:text-zinc-400">
                      Receive push notifications in your browser
                    </p>
                  </div>
                  <div className="relative">
                    <input
                      type="checkbox"
                      checked={settings?.notifications_enabled ?? true}
                      onChange={(e) =>
                        handleNotificationToggle(
                          "notifications_enabled",
                          e.target.checked,
                        )
                      }
                      className="sr-only"
                    />
                    <div
                      className={`w-11 h-6 rounded-full transition-colors ${
                        settings?.notifications_enabled
                          ? "bg-violet-600"
                          : "bg-zinc-300 dark:bg-zinc-700"
                      }`}
                    >
                      <div
                        className="w-5 h-5 rounded-full bg-white shadow-sm transition-transform absolute top-0.5"
                        style={{
                          transform: settings?.notifications_enabled
                            ? "translateX(22px)"
                            : "translateX(2px)",
                        }}
                      />
                    </div>
                  </div>
                </label>
              </div>
            </motion.div>

            {/* Account Actions */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-6"
            >
              <h2 className="text-lg font-semibold text-zinc-900 dark:text-white mb-4">
                Account Actions
              </h2>
              <Button
                variant="secondary"
                onClick={signOut}
                className="w-full sm:w-auto"
              >
                Sign Out
              </Button>
            </motion.div>

            {/* Danger Zone */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white dark:bg-zinc-900 rounded-xl border border-red-200 dark:border-red-900/50 p-6"
            >
              <h2 className="text-lg font-semibold text-red-600 dark:text-red-400 mb-4">
                Danger Zone
              </h2>
              <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-4">
                Once you delete your account, there is no going back. Please be
                certain.
              </p>
              <Button
                variant="ghost"
                className="text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                onClick={handleDeleteAccount}
              >
                Delete Account
              </Button>
            </motion.div>
          </div>
        </main>
      </div>
    </div>
  );
}
