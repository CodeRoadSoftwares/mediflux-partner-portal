"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { apiWithKey } from "@/lib/api";
import { Store } from "@/types";

type FilterStatus = "all" | "trial" | "active" | "expired";

function getAddressString(store: Store): string {
  if (store.address) {
    return [
      store.address.addressLine1,
      store.address.locality,
      store.address.state,
      store.address.pincode,
    ]
      .filter(Boolean)
      .join(", ");
  }
  return [store.addressLine1, store.locality, store.state, store.pincode]
    .filter(Boolean)
    .join(", ");
}

function isThisWeek(dateStr?: string): boolean {
  if (!dateStr) return false;
  const now = new Date();
  const start = new Date(now);
  start.setDate(now.getDate() - now.getDay());
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(start.getDate() + 7);
  const d = new Date(dateStr);
  return d >= start && d < end;
}

export default function StoresPage() {
  const { partner } = useAuth();
  const router = useRouter();
  const [stores, setStores] = useState<Store[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<FilterStatus>("all");
  const [filterThisWeek, setFilterThisWeek] = useState(false);
  const [filterExpiringDays, setFilterExpiringDays] = useState("");

  useEffect(() => {
    if (partner) fetchStores();
  }, [partner]);

  const fetchStores = async () => {
    try {
      const response = await apiWithKey.get(
        `/stores?partnerUserId=${partner?.id}&limit=200`,
      );
      setStores(response.data.stores || []);
    } catch (error) {
      console.error("Error fetching stores:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredStores = useMemo(() => {
    let result = [...stores];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          s.email.toLowerCase().includes(q) ||
          (s.phone || "").includes(q) ||
          getAddressString(s).toLowerCase().includes(q),
      );
    }

    if (filterStatus !== "all") {
      result = result.filter((s) => {
        if (filterStatus === "trial") return s.isOnTrial;
        if (filterStatus === "active")
          return !s.isOnTrial && s.isSubscriptionActive;
        if (filterStatus === "expired")
          return !s.isOnTrial && !s.isSubscriptionActive;
        return true;
      });
    }

    if (filterThisWeek) {
      result = result.filter((s) => isThisWeek(s.createdAt));
    }

    if (filterExpiringDays && !isNaN(Number(filterExpiringDays))) {
      const days = Number(filterExpiringDays);
      const now = new Date();
      const cutoff = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
      result = result.filter((s) => {
        if (!s.subscriptionEndDate) return false;
        const exp = new Date(s.subscriptionEndDate);
        return exp >= now && exp <= cutoff;
      });
    }

    return result;
  }, [stores, searchQuery, filterStatus, filterThisWeek, filterExpiringDays]);

  const formatDate = (dateString?: string) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-IN", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const handleDownloadInvoice = async (store: Store) => {
    setDownloadingId(store._id);
    try {
      const res = await apiWithKey.get(`/stores/invoice?storeId=${store._id}`, {
        responseType: "blob",
      });
      const blob = new Blob([res.data], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `invoice-${store.name.replace(/\s+/g, "-")}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      alert("No payment found for this store.");
    } finally {
      setDownloadingId(null);
    }
  };

  const statusBadge = (store: Store) => {
    if (store.isOnTrial)
      return (
        <span className="inline-flex rounded-full px-2 py-1 text-xs font-medium bg-blue-100 text-blue-700">
          Trial
        </span>
      );
    if (store.isSubscriptionActive)
      return (
        <span className="inline-flex rounded-full px-2 py-1 text-xs font-medium bg-green-100 text-green-700">
          Active
        </span>
      );
    return (
      <span className="inline-flex rounded-full px-2 py-1 text-xs font-medium bg-red-100 text-red-700">
        Expired
      </span>
    );
  };

  return (
    <div className="space-y-6 sm:space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-teal-900">
            My Stores
          </h1>
          <p className="mt-2 text-teal-600">Manage all your pharmacy stores</p>
        </div>
        <Button
          onClick={() => router.push("/dashboard/create-store")}
          size="lg"
          className="w-full sm:w-auto"
        >
          Create New Store
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-4 space-y-4">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-1 lg:col-span-2">
              <Label className="text-xs text-teal-700">
                Search (name, phone, address)
              </Label>
              <Input
                placeholder="Search stores..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="border-teal-200 focus:border-teal-500"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-teal-700">Status</Label>
              <select
                value={filterStatus}
                onChange={(e) =>
                  setFilterStatus(e.target.value as FilterStatus)
                }
                className="w-full h-10 rounded-md border border-teal-200 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                <option value="all">All</option>
                <option value="trial">Trial</option>
                <option value="active">Active</option>
                <option value="expired">Expired</option>
              </select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-teal-700">
                Expiring within (days)
              </Label>
              <Input
                type="number"
                placeholder="e.g. 30"
                value={filterExpiringDays}
                onChange={(e) => setFilterExpiringDays(e.target.value)}
                className="border-teal-200 focus:border-teal-500"
                min={1}
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="thisWeek"
              checked={filterThisWeek}
              onChange={(e) => setFilterThisWeek(e.target.checked)}
              className="h-4 w-4 rounded border-teal-300 text-teal-600"
            />
            <Label
              htmlFor="thisWeek"
              className="text-sm text-teal-700 cursor-pointer"
            >
              Created this week
            </Label>
            {(searchQuery ||
              filterStatus !== "all" ||
              filterThisWeek ||
              filterExpiringDays) && (
              <button
                onClick={() => {
                  setSearchQuery("");
                  setFilterStatus("all");
                  setFilterThisWeek(false);
                  setFilterExpiringDays("");
                }}
                className="ml-auto text-xs text-red-500 hover:text-red-700 underline"
              >
                Clear filters
              </button>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>All Stores ({filteredStores.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600"></div>
            </div>
          ) : filteredStores.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-teal-600 mb-4">No stores found</p>
              <Button
                onClick={() => router.push("/dashboard/create-store")}
                variant="outline"
              >
                Create Your First Store
              </Button>
            </div>
          ) : (
            <>
              {/* Mobile Card View */}
              <div className="block lg:hidden space-y-4">
                {filteredStores.map((store) => (
                  <Card key={store._id} className="border-teal-200">
                    <CardContent className="p-4 space-y-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-bold text-teal-900 truncate">
                            {store.name}
                          </h3>
                          <p className="text-sm text-teal-600 truncate">
                            {store.email}
                          </p>
                        </div>
                        {statusBadge(store)}
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <p className="text-teal-600">Phone</p>
                          <p className="text-teal-900 font-medium">
                            {store.phone}
                          </p>
                        </div>
                        <div>
                          <p className="text-teal-600">License</p>
                          <p className="text-teal-900 font-medium truncate">
                            {store.licenseNumber}
                          </p>
                        </div>
                        <div className="col-span-2">
                          <p className="text-teal-600">Address</p>
                          <p className="text-teal-900 text-xs">
                            {getAddressString(store) || "—"}
                          </p>
                        </div>
                        {store.subscriptionEndDate && (
                          <div>
                            <p className="text-teal-600">Expires</p>
                            <p className="text-teal-900 font-medium">
                              {formatDate(store.subscriptionEndDate)}
                            </p>
                          </div>
                        )}
                      </div>
                      <div className="flex items-center justify-between text-sm text-teal-600">
                        <span>Created: {formatDate(store.createdAt)}</span>
                        {store.hasMembership && (
                          <button
                            onClick={() => handleDownloadInvoice(store)}
                            disabled={downloadingId === store._id}
                            className="text-teal-700 underline text-xs font-medium hover:text-teal-900 disabled:opacity-50"
                          >
                            {downloadingId === store._id
                              ? "Downloading..."
                              : "Download Invoice"}
                          </button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Desktop Table View */}
              <div className="hidden lg:block overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b-2 border-teal-200">
                      <th className="px-4 py-3 text-left text-sm font-bold text-teal-900">
                        Store Name
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-bold text-teal-900">
                        Phone
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-bold text-teal-900">
                        Address
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-bold text-teal-900">
                        License
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-bold text-teal-900">
                        Status
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-bold text-teal-900">
                        Expires
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-bold text-teal-900">
                        Created
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-bold text-teal-900">
                        Invoice
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredStores.map((store) => (
                      <tr
                        key={store._id}
                        className="border-b border-teal-100 hover:bg-teal-50 transition-colors"
                      >
                        <td className="px-4 py-3">
                          <p className="text-sm font-medium text-teal-900">
                            {store.name}
                          </p>
                          <p className="text-xs text-teal-500">{store.email}</p>
                        </td>
                        <td className="px-4 py-3 text-sm text-teal-700">
                          {store.phone}
                        </td>
                        <td
                          className="px-4 py-3 text-xs text-teal-700 max-w-[180px] truncate"
                          title={getAddressString(store)}
                        >
                          {getAddressString(store) || "—"}
                        </td>
                        <td className="px-4 py-3 text-sm text-teal-700">
                          {store.licenseNumber}
                        </td>
                        <td className="px-4 py-3">{statusBadge(store)}</td>
                        <td className="px-4 py-3 text-sm text-teal-700">
                          {store.subscriptionEndDate
                            ? formatDate(store.subscriptionEndDate)
                            : "—"}
                        </td>
                        <td className="px-4 py-3 text-sm text-teal-700">
                          {formatDate(store.createdAt)}
                        </td>
                        <td className="px-4 py-3">
                          {store.hasMembership ? (
                            <button
                              onClick={() => handleDownloadInvoice(store)}
                              disabled={downloadingId === store._id}
                              className="text-teal-700 underline text-xs font-medium hover:text-teal-900 disabled:opacity-50"
                            >
                              {downloadingId === store._id ? "..." : "Download"}
                            </button>
                          ) : (
                            <span className="text-xs text-gray-400">
                              No payment
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
