"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { apiWithKey } from "@/lib/api";
import { Store } from "@/types";

export default function StoreDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const [store, setStore] = useState<Store | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (params.id) {
      fetchStoreDetails();
    }
  }, [params.id]);

  const fetchStoreDetails = async () => {
    try {
      const response = await apiWithKey.get(`/stores/${params.id}`);
      setStore(response.data.store || null);
    } catch (error) {
      console.error("Error fetching store details:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600"></div>
      </div>
    );
  }

  if (!store) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl sm:text-3xl font-bold text-teal-900">
          Store Not Found
        </h1>
        <Button onClick={() => router.back()}>Go Back</Button>
      </div>
    );
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="space-y-6 sm:space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl sm:text-3xl font-bold text-teal-900 truncate">
            {store.name}
          </h1>
          <p className="mt-2 text-teal-600">Store Details</p>
        </div>
        <Button
          variant="outline"
          onClick={() => router.back()}
          className="w-full sm:w-auto"
        >
          Back to Stores
        </Button>
      </div>

      <div className="grid gap-4 sm:gap-6 lg:grid-cols-2">
        <Card className="hover:shadow-xl transition-shadow">
          <CardHeader>
            <CardTitle>Store Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm font-medium text-teal-600">Store Name</p>
              <p className="text-teal-900 font-medium mt-1">{store.name}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-teal-600">Email</p>
              <p className="text-teal-900 break-all mt-1">{store.email}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-teal-600">Phone</p>
              <p className="text-teal-900 mt-1">{store.phone}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-teal-600">
                License Number
              </p>
              <p className="text-teal-900 mt-1">{store.licenseNumber}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-teal-600">GSTIN</p>
              <p className="text-teal-900 mt-1">{store.gstin}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-xl transition-shadow">
          <CardHeader>
            <CardTitle>Address Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm font-medium text-teal-600">
                Address Line 1
              </p>
              <p className="text-teal-900 mt-1">{store.addressLine1}</p>
            </div>
            {store.addressLine2 && (
              <div>
                <p className="text-sm font-medium text-teal-600">
                  Address Line 2
                </p>
                <p className="text-teal-900 mt-1">{store.addressLine2}</p>
              </div>
            )}
            <div>
              <p className="text-sm font-medium text-teal-600">Locality</p>
              <p className="text-teal-900 mt-1">{store.locality}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-teal-600">Pincode</p>
              <p className="text-teal-900 mt-1">{store.pincode}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-teal-600">State</p>
              <p className="text-teal-900 mt-1">{store.state}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-xl transition-shadow">
          <CardHeader>
            <CardTitle>Owner Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm font-medium text-teal-600">Owner Name</p>
              <p className="text-teal-900 mt-1">{store.ownerName}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-xl transition-shadow">
          <CardHeader>
            <CardTitle>Status & Dates</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm font-medium text-teal-600 mb-2">Status</p>
              <span
                className={`inline-flex rounded-full px-3 py-1 text-sm font-medium ${
                  store.isOnTrial
                    ? "bg-blue-100 text-blue-700"
                    : "bg-green-100 text-green-700"
                }`}
              >
                {store.isOnTrial ? "On Trial" : "Active"}
              </span>
            </div>
            <div>
              <p className="text-sm font-medium text-teal-600 mb-2">
                Payment Status
              </p>
              <span
                className={`inline-flex rounded-full px-3 py-1 text-sm font-medium ${
                  store.hasUserPaid
                    ? "bg-green-100 text-green-700"
                    : "bg-gray-100 text-gray-700"
                }`}
              >
                {store.hasUserPaid ? "Paid" : "Unpaid"}
              </span>
            </div>
            <div>
              <p className="text-sm font-medium text-teal-600">Created At</p>
              <p className="text-teal-900 text-sm mt-1">
                {formatDate(store.createdAt)}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-teal-600">Last Updated</p>
              <p className="text-teal-900 text-sm mt-1">
                {formatDate(store.updatedAt)}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
