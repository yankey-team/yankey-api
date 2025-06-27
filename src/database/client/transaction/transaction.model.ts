import { Model } from "mongoose";
import { ID } from "../../../types";
import { ITransaction } from "./transaction.schema";
import { createMongooseClient } from "../mongoose";

/**
 * TransactionModel provides methods to interact with Transaction data for a specific merchant.
 */
export class TransactionModel {
  model: Model<ITransaction>;
  constructor(readonly merchantId: ID) {
    this.model = createMongooseClient(merchantId).model<ITransaction>('Transaction');
  }

  /**
   * Finds transactions for a specific operator.
   * @param operatorId - The operator's ID
   * @returns An object with either the transactions or an error message
   */
  async findOperatorTransactions(operatorId: ID): Promise<{ data?: ITransaction[]; error?: string }> {
    try {
      const transactions = await this.model.find({ operatorId: operatorId });
      return { data: transactions.map(item => item.toObject()) };
    } catch (err) {
      console.error('findOperatorTransactions error:', err);
      return { error: "Database error while finding operator transactions" };
    }
  }

  /**
   * Finds transactions for a specific user.
   * @param userId - The user's ID
   * @returns An object with either the transactions or an error message
   */
  async findUserTransactions(userId: ID): Promise<{ data?: ITransaction[]; error?: string }> {
    try {
      const transactions = await this.model.find({ userId: userId });
      return { data: transactions.map(item => item.toObject()) };
    } catch (err) {
      console.error('findUserTransactions error:', err);
      return { error: "Database error while finding user transactions" };
    }
  }

  /**
   * Creates a new transaction.
   * @param transactionData - The transaction data to create
   * @returns An object with either the created transaction or an error message
   */
  async createTransaction(transactionData: Partial<ITransaction>): Promise<{ data?: ITransaction; error?: string }> {
    try {
      const transaction = await this.model.create(transactionData);
      return { data: transaction.toObject() };
    } catch (err) {
      console.error('createTransaction error:', err);
      return { error: "Database error while creating transaction" };
    }
  }

  /**
   * Deletes all transactions for a specific user.
   */
  async deleteUserTransactions(userId: ID): Promise<{ data?: boolean; error?: string }> {
    try {
      await this.model.deleteMany({ userId });
      return { data: true };
    } catch (err) {
      console.error('deleteUserTransactions error:', err);
      return { error: 'Database error while deleting user transactions' };
    }
  }
}