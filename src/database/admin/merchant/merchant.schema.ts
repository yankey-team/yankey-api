import { Schema } from "mongoose";
import { ID } from "../../../types";

/**
 * IMerchant represents a merchant in the system.
 */
export interface IMerchant {
  id: ID;
  name: string;
  domain: string;
  loyaltyPercentage: number;
  telegramKey: string;
}

/**
 * MerchantSchema defines the structure of the Merchant collection in MongoDB.
 */
export const MerchantSchema = new Schema<IMerchant>({
  name: { type: String, required: true },
  domain: { type: String, required: true, unique: true },
  loyaltyPercentage: { type: Number, required: true },
  telegramKey: { type: String, required: true },
}, { timestamps: true });
