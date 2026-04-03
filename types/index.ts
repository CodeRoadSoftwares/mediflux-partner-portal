export interface Partner {
  id: string;
  email: string;
  name?: string;
  phone?: string;
  address?: string;
  partnerCode: string;
  defaultReferralAmount?: number;
}

export interface StoreAddress {
  addressLine1?: string;
  addressLine2?: string;
  locality?: string;
  pincode?: string;
  state?: string;
}

export interface Store {
  _id: string;
  name: string;
  email: string;
  phone: string;
  licenseNumber: string;
  gstin?: string;
  address?: StoreAddress;
  // flat address fields (legacy)
  addressLine1?: string;
  addressLine2?: string;
  locality?: string;
  pincode?: string;
  state?: string;
  contactName?: string;
  ownerName?: string;
  hasUserPaid: boolean;
  isOnTrial: boolean;
  isSubscriptionActive: boolean;
  subscriptionEndDate?: string;
  partnerUserId: string;
  createdAt: string;
  updatedAt: string;
  hasMembership?: boolean;
}

export interface CreateStorePayload {
  name: string;
  email: string;
  phone: string;
  licenseNumber: string;
  gstin: string;
  addressLine1: string;
  addressLine2: string;
  locality: string;
  pincode: string;
  state: string;
  ownerName: string;
  password: string;
  hasUserPaid: boolean;
  isOnTrial: boolean;
  partnerUserId: string;
}

export interface PartnerReferral {
  _id: string;
  storeId: string;
  partnerUserId: string;
  referralAmount: number;
  isPaid: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ReferralSummary {
  totalEarnings: number;
  pendingPayments: number;
  pendingPaymentsCount: number;
  defaultReferralAmount: number;
  totalStores: number;
  storesWithPayments: number;
}
