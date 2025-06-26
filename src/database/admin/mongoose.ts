import mongoose from "mongoose";
import { getConfig } from "../../config";
import { MerchantSchema } from "./merchant/merchant.schema";

const config = getConfig();

/**
 * Singleton admin client for MongoDB connection.
 */
let adminClient: mongoose.Connection;

try {
  adminClient = mongoose.createConnection(config.adminDb);
  adminClient.model("Merchant", MerchantSchema);
  adminClient.on('connected', () => {
    console.log('Admin MongoDB connection established.');
  });
  adminClient.on('error', (err) => {
    console.error('Admin MongoDB connection error:', err);
  });
} catch (err) {
  console.error('Failed to create admin MongoDB connection:', err);
}

/**
 * Returns the singleton admin client connection.
 */
export const createMongooseAdminClient = () => {
  return adminClient;
};

export { adminClient };