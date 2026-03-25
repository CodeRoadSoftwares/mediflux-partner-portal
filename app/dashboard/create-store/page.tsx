"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createStoreSchema, CreateStoreFormData } from "@/lib/schemas";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/toast";
import { apiWithKey } from "@/lib/api";

export default function CreateStorePage() {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { partner } = useAuth();
  const { showToast, ToastComponent } = useToast();

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
  } = useForm<CreateStoreFormData>({
    resolver: zodResolver(createStoreSchema),
    defaultValues: {
      isOnTrial: true,
    },
  });

  useEffect(() => {
    setValue("isOnTrial", true);
  }, [setValue]);

  const onSubmit = async (data: CreateStoreFormData) => {
    if (!partner) {
      showToast("Partner information not found", "error");
      return;
    }

    setIsLoading(true);
    try {
      const payload = {
        ...data,
        hasUserPaid: false,
        partnerUserId: partner.id,
      };

      await apiWithKey.post("/stores", payload);

      showToast("Store created successfully!", "success");
      setTimeout(() => router.push("/dashboard/stores"), 1500);
    } catch (error: any) {
      const message = error.response?.data?.message || "Failed to create store";
      showToast(message, "error");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6 sm:space-y-8">
      {ToastComponent}
      <div className="bg-gradient-to-r from-teal-600 to-teal-700 rounded-2xl p-6 sm:p-8 text-white shadow-xl">
        <h1 className="text-2xl sm:text-3xl font-bold">Create New Store</h1>
        <p className="mt-2 text-teal-50">
          Fill in the details to register a new pharmacy store
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Store Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-teal-900 font-medium">
                  Store Name *
                </Label>
                <Input
                  id="name"
                  className="border-teal-200 focus:border-teal-500 focus:ring-teal-500"
                  {...register("name")}
                />
                {errors.name && (
                  <p className="text-sm text-red-600">{errors.name.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="text-teal-900 font-medium">
                  Email *
                </Label>
                <Input
                  id="email"
                  type="email"
                  className="border-teal-200 focus:border-teal-500 focus:ring-teal-500"
                  {...register("email")}
                />
                {errors.email && (
                  <p className="text-sm text-red-600">{errors.email.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone" className="text-teal-900 font-medium">
                  Phone *
                </Label>
                <Input
                  id="phone"
                  className="border-teal-200 focus:border-teal-500 focus:ring-teal-500"
                  {...register("phone")}
                />
                {errors.phone && (
                  <p className="text-sm text-red-600">{errors.phone.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="licenseNumber"
                  className="text-teal-900 font-medium"
                >
                  License Number *
                </Label>
                <Input
                  id="licenseNumber"
                  className="border-teal-200 focus:border-teal-500 focus:ring-teal-500"
                  {...register("licenseNumber")}
                />
                {errors.licenseNumber && (
                  <p className="text-sm text-red-600">
                    {errors.licenseNumber.message}
                  </p>
                )}
              </div>

              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="gstin" className="text-teal-900 font-medium">
                  GSTIN *
                </Label>
                <Input
                  id="gstin"
                  className="border-teal-200 focus:border-teal-500 focus:ring-teal-500"
                  {...register("gstin")}
                  maxLength={15}
                />
                {errors.gstin && (
                  <p className="text-sm text-red-600">{errors.gstin.message}</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Address Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label
                htmlFor="addressLine1"
                className="text-teal-900 font-medium"
              >
                Address Line 1 *
              </Label>
              <Input
                id="addressLine1"
                className="border-teal-200 focus:border-teal-500 focus:ring-teal-500"
                {...register("addressLine1")}
              />
              {errors.addressLine1 && (
                <p className="text-sm text-red-600">
                  {errors.addressLine1.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="addressLine2"
                className="text-teal-900 font-medium"
              >
                Address Line 2
              </Label>
              <Input
                id="addressLine2"
                className="border-teal-200 focus:border-teal-500 focus:ring-teal-500"
                {...register("addressLine2")}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="locality" className="text-teal-900 font-medium">
                  Locality *
                </Label>
                <Input
                  id="locality"
                  className="border-teal-200 focus:border-teal-500 focus:ring-teal-500"
                  {...register("locality")}
                />
                {errors.locality && (
                  <p className="text-sm text-red-600">
                    {errors.locality.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="pincode" className="text-teal-900 font-medium">
                  Pincode *
                </Label>
                <Input
                  id="pincode"
                  className="border-teal-200 focus:border-teal-500 focus:ring-teal-500"
                  {...register("pincode")}
                  maxLength={6}
                />
                {errors.pincode && (
                  <p className="text-sm text-red-600">
                    {errors.pincode.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="state" className="text-teal-900 font-medium">
                  State *
                </Label>
                <Input
                  id="state"
                  className="border-teal-200 focus:border-teal-500 focus:ring-teal-500"
                  {...register("state")}
                />
                {errors.state && (
                  <p className="text-sm text-red-600">{errors.state.message}</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Owner Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label
                  htmlFor="ownerName"
                  className="text-teal-900 font-medium"
                >
                  Owner Name *
                </Label>
                <Input
                  id="ownerName"
                  className="border-teal-200 focus:border-teal-500 focus:ring-teal-500"
                  {...register("ownerName")}
                />
                {errors.ownerName && (
                  <p className="text-sm text-red-600">
                    {errors.ownerName.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-teal-900 font-medium">
                  Password *
                </Label>
                <Input
                  id="password"
                  type="password"
                  className="border-teal-200 focus:border-teal-500 focus:ring-teal-500"
                  {...register("password")}
                />
                {errors.password && (
                  <p className="text-sm text-red-600">
                    {errors.password.message}
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Trial Settings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2 bg-teal-50 p-3 rounded-lg border border-teal-200">
              <input
                type="checkbox"
                id="isOnTrial"
                {...register("isOnTrial")}
                checked={true}
                disabled={true}
                className="h-4 w-4 rounded border-teal-300 text-teal-600 opacity-75 cursor-not-allowed"
              />
              <Label
                htmlFor="isOnTrial"
                className="text-teal-900 cursor-default"
              >
                Start on trial period
              </Label>
            </div>
          </CardContent>
        </Card>

        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
          <Button
            type="submit"
            disabled={isLoading}
            size="lg"
            className="w-full sm:w-auto"
          >
            {isLoading ? "Creating..." : "Create Store"}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            size="lg"
            className="w-full sm:w-auto"
          >
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}
