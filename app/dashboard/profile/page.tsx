"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/toast";
import { apiWithKey } from "@/lib/api";

export default function ProfilePage() {
  const { partner, setPartner } = useAuth();
  const { showToast, ToastComponent } = useToast();
  const [isSaving, setIsSaving] = useState(false);
  const [form, setForm] = useState({
    name: "",
    phone: "",
    address: "",
  });
  const [pwForm, setPwForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  useEffect(() => {
    if (partner) {
      setForm({
        name: partner.name || "",
        phone: partner.phone || "",
        address: partner.address || "",
      });
    }
  }, [partner]);

  const handleProfileSave = async () => {
    setIsSaving(true);
    try {
      const res = await apiWithKey.patch("/profile", {
        name: form.name,
        phone: form.phone,
        address: form.address,
      });
      const updated = res.data.partner;
      const newPartner = { ...partner!, ...updated };
      setPartner(newPartner);
      localStorage.setItem("partner", JSON.stringify(newPartner));
      showToast("Profile updated successfully", "success");
    } catch (err: any) {
      showToast(
        err.response?.data?.message || "Failed to update profile",
        "error",
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handlePasswordChange = async () => {
    if (pwForm.newPassword !== pwForm.confirmPassword) {
      showToast("New passwords do not match", "error");
      return;
    }
    if (pwForm.newPassword.length < 8) {
      showToast("Password must be at least 8 characters", "error");
      return;
    }
    setIsSaving(true);
    try {
      await apiWithKey.patch("/profile", {
        currentPassword: pwForm.currentPassword,
        newPassword: pwForm.newPassword,
      });
      setPwForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
      showToast("Password changed successfully", "success");
    } catch (err: any) {
      showToast(
        err.response?.data?.message || "Failed to change password",
        "error",
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      {ToastComponent}
      <div className="bg-linear-to-r from-teal-600 to-teal-700 rounded-2xl p-6 text-white shadow-xl">
        <h1 className="text-2xl font-bold">My Profile</h1>
        <p className="mt-1 text-teal-50 text-sm">{partner?.email}</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Personal Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email" className="text-teal-900 font-medium">
              Email
            </Label>
            <Input
              id="email"
              value={partner?.email || ""}
              disabled
              className="bg-teal-50 border-teal-200 text-teal-600"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="name" className="text-teal-900 font-medium">
              Full Name
            </Label>
            <Input
              id="name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="border-teal-200 focus:border-teal-500"
              placeholder="Your full name"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone" className="text-teal-900 font-medium">
              Phone
            </Label>
            <Input
              id="phone"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              className="border-teal-200 focus:border-teal-500"
              placeholder="10-digit phone number"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="address" className="text-teal-900 font-medium">
              Address
            </Label>
            <Input
              id="address"
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
              className="border-teal-200 focus:border-teal-500"
              placeholder="Your address"
            />
          </div>
          <div className="pt-2 flex items-center gap-3">
            <Button onClick={handleProfileSave} disabled={isSaving}>
              {isSaving ? "Saving..." : "Save Changes"}
            </Button>
            {partner?.partnerCode && (
              <span className="text-sm text-teal-600">
                Partner Code:{" "}
                <span className="font-mono font-bold">
                  {partner.partnerCode}
                </span>
              </span>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Change Password</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label
              htmlFor="currentPassword"
              className="text-teal-900 font-medium"
            >
              Current Password
            </Label>
            <Input
              id="currentPassword"
              type="password"
              value={pwForm.currentPassword}
              onChange={(e) =>
                setPwForm({ ...pwForm, currentPassword: e.target.value })
              }
              className="border-teal-200 focus:border-teal-500"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="newPassword" className="text-teal-900 font-medium">
              New Password
            </Label>
            <Input
              id="newPassword"
              type="password"
              value={pwForm.newPassword}
              onChange={(e) =>
                setPwForm({ ...pwForm, newPassword: e.target.value })
              }
              className="border-teal-200 focus:border-teal-500"
            />
          </div>
          <div className="space-y-2">
            <Label
              htmlFor="confirmPassword"
              className="text-teal-900 font-medium"
            >
              Confirm New Password
            </Label>
            <Input
              id="confirmPassword"
              type="password"
              value={pwForm.confirmPassword}
              onChange={(e) =>
                setPwForm({ ...pwForm, confirmPassword: e.target.value })
              }
              className="border-teal-200 focus:border-teal-500"
            />
          </div>
          <Button
            onClick={handlePasswordChange}
            disabled={
              isSaving || !pwForm.currentPassword || !pwForm.newPassword
            }
            variant="outline"
          >
            {isSaving ? "Updating..." : "Update Password"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
