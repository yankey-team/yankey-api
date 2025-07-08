import { Schema } from "mongoose";
import { ID } from "../../../types";
import { modifySchema } from "../../utils";

/**
 * ITransaction represents a transaction in the system.
 */
export interface ITransaction {
  id: ID;
  type: "check-in" | "check-out";
  amount: number;
  checkOutAmount?: number;
  loyaltyPercentage: number;
  userId: ID;
  operatorId: ID;
  createdAt?: Date; // Add createdAt for timestamps
}

/**
 * TransactionSchema defines the structure of the Transaction collection in MongoDB.
 */
export const TransactionSchema = modifySchema(
  new Schema<ITransaction>(
    {
      type: { type: String, enum: ["check-in", "check-out"], required: true },
      amount: { type: Number, required: true },
      checkOutAmount: { type: Number, default: 0 },
      loyaltyPercentage: { type: Number, required: true },
      userId: { type: String, required: true },
      operatorId: { type: String, required: true },
    },
    { timestamps: true }
  )
);
