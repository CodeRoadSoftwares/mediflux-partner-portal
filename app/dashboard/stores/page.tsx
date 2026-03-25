"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { apiWithKey } from "@/lib/api";
import { Store } from "@/types";

export default function StoresPage() {
  const { partner } = useAuth();
  const router = useRouter();
  const [stores, setStores] = useState<Store[]>([]);
  const [filteredStores, setFilteredStores] = useState<Store[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (partner) {
      fetchStores();
    }
  }, [partner]);

  useEffect(() => {
    if (searchQuery) {
      const filtered = stores.filter(
        (store) =>
          store.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          store.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
          store.phone.includes(searchQuery),
      );
      setFilteredStores(filtered);
    } else {
      setFilteredStores(stores);
    }
  }, [searchQuery, stores]);

  const fetchStores = async () => {
    try {
      const response = await apiWithKey.get(
        `/stores?partnerUserId=${partner?.id}`,
      );
      const stores = response.data.stores || [];
      setStores(stores);
      setFilteredStores(stores);
    } catch (error) {
      console.error("Error fetching stores:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
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

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <CardTitle>All Stores ({filteredStores.length})</CardTitle>
            <Input
              placeholder="Search stores..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full sm:max-w-xs border-teal-200 focus:border-teal-500 focus:ring-teal-500"
            />
          </div>
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
                        <span
                          className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ml-2 ${
                            store.isOnTrial
                              ? "bg-blue-100 text-blue-700"
                              : "bg-green-100 text-green-700"
                          }`}
                        >
                          {store.isOnTrial ? "Trial" : "Active"}
                        </span>
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
                      </div>
                      <div className="text-sm text-teal-600">
                        Created: {formatDate(store.createdAt)}
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
                        Email
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-bold text-teal-900">
                        Phone
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-bold text-teal-900">
                        License
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-bold text-teal-900">
                        Status
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-bold text-teal-900">
                        Created
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredStores.map((store) => (
                      <tr
                        key={store._id}
                        className="border-b border-teal-100 hover:bg-teal-50 transition-colors"
                      >
                        <td className="px-4 py-3 text-sm font-medium text-teal-900">
                          {store.name}
                        </td>
                        <td className="px-4 py-3 text-sm text-teal-700">
                          {store.email}
                        </td>
                        <td className="px-4 py-3 text-sm text-teal-700">
                          {store.phone}
                        </td>
                        <td className="px-4 py-3 text-sm text-teal-700">
                          {store.licenseNumber}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${
                              store.isOnTrial
                                ? "bg-blue-100 text-blue-700"
                                : "bg-green-100 text-green-700"
                            }`}
                          >
                            {store.isOnTrial ? "Trial" : "Active"}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-teal-700">
                          {formatDate(store.createdAt)}
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
