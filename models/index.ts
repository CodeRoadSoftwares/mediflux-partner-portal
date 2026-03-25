import { Schema, model, models, Model } from "mongoose";

const partnerUserSchema = new Schema(
  {
    email: String,
    phone: String,
    password: String,
    address: String,
    partnerCode: String,
    defaultReferralAmount: Number,
    createdAt: Date,
    updatedAt: Date,
  },
  { collection: "partner_users", strict: false },
);

const storeSchema = new Schema(
  {
    name: String,
    email: String,
    phone: String,
    licenseNumber: String,
    gstin: String,
    address: {
      addressLine1: String,
      addressLine2: String,
      locality: String,
      pincode: String,
      state: String,
    },
    ownerName: String,
    password: String,
    hasUserPaid: Boolean,
    isOnTrial: Boolean,
    isSubscriptionActive: Boolean,
    partnerUserId: Schema.Types.ObjectId,
    createdAt: Date,
    updatedAt: Date,
  },
  { collection: "stores", strict: false },
);

const partnerReferralSchema = new Schema(
  {
    storeId: Schema.Types.ObjectId,
    partnerUserId: Schema.Types.ObjectId,
    referralAmount: Number,
    isPaid: { type: Boolean, default: false },
    createdAt: Date,
    updatedAt: Date,
  },
  { collection: "partner_referrals", strict: false },
);

export const Partner: Model<any> =
  models.partner_users || model("partner_users", partnerUserSchema);
export const Store: Model<any> = models.stores || model("stores", storeSchema);
export const PartnerReferral: Model<any> =
  models.partner_referrals || model("partner_referrals", partnerReferralSchema);
