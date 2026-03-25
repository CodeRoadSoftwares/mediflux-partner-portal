import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const createStoreSchema = z.object({
  name: z.string().min(1, "Store name is required"),
  email: z.string().email("Invalid email address"),
  phone: z.string().min(10, "Phone number must be at least 10 digits"),
  licenseNumber: z.string().min(1, "License number is required"),
  gstin: z.string().min(15, "GSTIN must be 15 characters").max(15),
  addressLine1: z.string().min(1, "Address line 1 is required"),
  addressLine2: z.string().optional(),
  locality: z.string().min(1, "Locality is required"),
  pincode: z.string().min(6, "Pincode must be 6 digits").max(6),
  state: z.string().min(1, "State is required"),
  ownerName: z.string().min(1, "Owner name is required"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  isOnTrial: z.boolean().default(true),
});

export type LoginFormData = z.infer<typeof loginSchema>;
export type CreateStoreFormData = z.infer<typeof createStoreSchema>;
