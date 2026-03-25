"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { apiWithKey } from "@/lib/api";
import { Store, ReferralSummary } from "@/types";

export default function DashboardPage() {
  const { partner } = useAuth();
  const router = useRouter();
  const [stores, setStores] = useState<Store[]>([]);
  const [referralSummary, setReferralSummary] =
    useState<ReferralSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingReferrals, setIsLoadingReferrals] = useState(true);

  useEffect(() => {
    if (partner) {
      fetchStores();
      fetchReferrals();
    }
  }, [partner]);

  const fetchStores = async () => {
    try {
      const response = await apiWithKey.get(
        `/stores?partnerUserId=${partner?.id}`,
      );
      const stores = response.data.stores || [];
      setStores(stores);
    } catch (error) {
      console.error("Error fetching stores:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchReferrals = async () => {
    try {
      const response = await apiWithKey.get(
        `/referrals?partnerUserId=${partner?.id}`,
      );
      setReferralSummary(response.data.data.summary);
    } catch (error) {
      console.error("Error fetching referrals:", error);
    } finally {
      setIsLoadingReferrals(false);
    }
  };

  const totalStores = stores.length;
  const trialStores = stores.filter((s) => s.isOnTrial).length;
  const activeStores = stores.filter(
    (s) => !s.isOnTrial && s.isSubscriptionActive,
  ).length;

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl p-6 sm:p-8 border border-teal-100 shadow-sm">
        <h1 className="text-2xl sm:text-3xl font-bold text-teal-900">
          Dashboard
        </h1>
        <p className="mt-2 text-teal-600">Welcome back, {partner?.email}</p>
      </div>

      {/* Earnings Section */}
      <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2">
        <Card className="hover:scale-105 transition-transform bg-linear-to-br from-green-50 to-white">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-green-700">
              Total Earnings
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoadingReferrals ? (
              <div className="animate-pulse h-10 bg-green-100 rounded"></div>
            ) : (
              <p className="text-3xl sm:text-4xl font-bold text-green-900">
                ₹{referralSummary?.totalEarnings.toLocaleString() || 0}
              </p>
            )}
            {!isLoadingReferrals && referralSummary && (
              <p className="text-xs text-green-600 mt-2">
                From {referralSummary.storesWithPayments} paid referrals
              </p>
            )}
          </CardContent>
        </Card>

        <Card className="hover:scale-105 transition-transform bg-linear-to-br from-orange-50 to-white">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-orange-700">
              Pending Payments
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoadingReferrals ? (
              <div className="animate-pulse h-10 bg-orange-100 rounded"></div>
            ) : (
              <p className="text-3xl sm:text-4xl font-bold text-orange-900">
                ₹{referralSummary?.pendingPayments.toLocaleString() || 0}
              </p>
            )}
            {!isLoadingReferrals && referralSummary && (
              <p className="text-xs text-orange-600 mt-2">
                {referralSummary.pendingPaymentsCount} stores × ₹
                {referralSummary.defaultReferralAmount}
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Store Stats Section */}
      <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        <Card className="hover:scale-105 transition-transform">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-teal-700">
              Total Stores
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl sm:text-4xl font-bold text-teal-900">
              {totalStores}
            </p>
          </CardContent>
        </Card>

        <Card className="hover:scale-105 transition-transform">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-teal-700">
              Stores on Trial
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl sm:text-4xl font-bold text-blue-600">
              {trialStores}
            </p>
          </CardContent>
        </Card>

        <Card className="hover:scale-105 transition-transform sm:col-span-2 lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-teal-700">
              Active Stores
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl sm:text-4xl font-bold text-green-600">
              {activeStores}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col sm:flex-row gap-3">
          <Button
            onClick={() => router.push("/dashboard/create-store")}
            className="w-full sm:w-auto"
            size="lg"
          >
            Create New Store
          </Button>
          <Button
            onClick={() => router.push("/dashboard/stores")}
            variant="outline"
            className="w-full sm:w-auto"
            size="lg"
          >
            View All Stores
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recent Stores</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600"></div>
            </div>
          ) : stores.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-teal-600 mb-4">No stores created yet</p>
              <Button
                onClick={() => router.push("/dashboard/create-store")}
                variant="outline"
              >
                Create Your First Store
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {stores.slice(0, 5).map((store) => (
                <div
                  key={store._id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-teal-100 pb-3 last:border-0 gap-2 sm:gap-0"
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-teal-900 truncate">
                      {store.name}
                    </p>
                    <p className="text-sm text-teal-600 truncate">
                      {store.email}
                    </p>
                  </div>
                  <span
                    className={`inline-flex self-start sm:self-auto rounded-full px-3 py-1 text-xs font-medium ${
                      store.isOnTrial
                        ? "bg-blue-100 text-blue-700"
                        : "bg-green-100 text-green-700"
                    }`}
                  >
                    {store.isOnTrial ? "Trial" : "Active"}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
