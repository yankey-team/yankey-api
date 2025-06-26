import mongoose, { Connection } from "mongoose";
import { ID } from "../../types";
import { getConfig } from "../../config";
import { UserSchema } from "./user/user.schema";
import { OperatorSchema } from "./operator/operator.schema";
import { TransactionSchema } from "./transaction/transaction.schema";

const config = getConfig();

/**
 * Returns the database URL for a given merchant ID.
 */
export const getDatabaseUrlByMerchantId = (merchantId?: ID): string => {
  if (!merchantId) throw new Error('Merchant ID is required for database connection');
  return config.dbTemplate.replace("{}", merchantId);
};

const clients: Record<ID, Connection> = {};

/**
 * Creates or returns a singleton mongoose client for a merchant.
 */
export const createMongooseClient = (merchantId: ID = "") => {
  if (!merchantId) throw new Error('Merchant ID is required for mongoose client');
  if (!clients[merchantId]) {
    const dbUrl = getDatabaseUrlByMerchantId(merchantId);
    clients[merchantId] = mongoose.createConnection(dbUrl);
    clients[merchantId].model("User", UserSchema);
    clients[merchantId].model("Operator", OperatorSchema);
    clients[merchantId].model("Transaction", TransactionSchema);
    clients[merchantId].on("connected", () => {
      console.log(`MongoDB client connected for merchant: ${merchantId}`);
    });
    clients[merchantId].on("error", (err) => {
      console.error(`MongoDB client connection error for merchant ${merchantId}:`, err);
    });
  }
  return clients[merchantId];
};

export { clients };