import { Schema } from "mongoose";
import { ID } from "../../../types";
import { modifySchema } from "../../utils";

/**
 * IMerchant represents a merchant in the system.
 */
export interface IMerchant {
  id: ID;
  name: string;
  domain: string;
  loyaltyPercentage: number;
}

/**
 * MerchantSchema defines the structure of the Merchant collection in MongoDB.
 */
export const MerchantSchema = modifySchema(new Schema<IMerchant>({
  name: { type: String, required: true },
  domain: { type: String, required: true, unique: true },
  loyaltyPercentage: { type: Number, required: true }
}, { timestamps: true }));
