import { Model } from "mongoose";
import { ID, Pagination, PaginationResult } from "../../../types";
import { IOperator } from "./operator.schema";
import { createMongooseClient } from "../mongoose";
import { ITransaction } from "../transaction/transaction.schema";
import { createMongooseAdminClient } from "../../admin/mongoose";
import { IMerchant } from "../../admin/merchant/merchant.schema";
import { UserModel } from "../user/user.model";
import { TransactionModel } from "../transaction/transaction.model";

export interface TransactionPayload {
  type: "check-in" | "check-out";
  transactionAmount: number;
  checkOutAmount?: number;
  operatorId: ID;
  userId: ID;
}

export class OperatorModel {
  model: Model<IOperator>;
  constructor(readonly merchantId: ID) {
    this.model = createMongooseClient(merchantId).model<IOperator>("Operator");
  }

  /**
   * Finds an operator by username.
   */
  async findByUsername(username: string) {
    try {
      const operator = await this.model.findOne({ username });
      if (operator) {
        return { data: operator.toObject() };
      }
      return { error: "Could not find an operator" };
    } catch (err) {
      console.error("findByUsername error:", err);
      return { error: "Database error while finding operator by username" };
    }
  }

  /**
   * Finds an operator by ID.
   */
  async findOperatorById(id: ID) {
    try {
      const operator = await this.model.findById(id).lean();
      if (operator) {
        return { data: operator };
      }
      return { error: "Could not find an operator" };
    } catch (err) {
      console.error("findOperatorById error:", err);
      return { error: "Database error while finding operator by ID" };
    }
  }

  /**
   * Creates a new operator.
   */
  async createOperator(data: Omit<IOperator, "id">) {
    try {
      const createdOperator = await this.model.create(data);
      if (createdOperator) {
        return { data: await this.model.findById(createdOperator._id).lean() };
      }
      return { error: "Could not create an operator" };
    } catch (err) {
      console.error("createOperator error:", err);
      return { error: "Database error while creating operator" };
    }
  }

  /**
   * Updates an operator by ID.
   */
  async updateOperator(id: ID, data: Partial<IOperator>) {
    try {
      const operator = await this.model.findById(id).lean();
      if (operator) {
        const updatedOperator = await this.model
          .findByIdAndUpdate(operator._id, data, { new: true })
          .lean();
        return { data: updatedOperator };
      }
      return { error: "Could not find an operator to update" };
    } catch (err) {
      console.error("updateOperator error:", err);
      return { error: "Database error while updating operator" };
    }
  }

  /**
   * Removes an operator by ID.
   */
  async removeOperator(id: ID) {
    try {
      const operator = await this.model.findById(id).lean();
      if (operator) {
        const deletedOperator = await this.model.findByIdAndDelete(id).lean();
        if (deletedOperator) {
          return { data: operator };
        } else {
          return { error: "Could not remove an operator" };
        }
      } else {
        return { error: "Could not find an operator to remove" };
      }
    } catch (err) {
      console.error("removeOperator error:", err);
      return { error: "Database error while removing operator" };
    }
  }

  /**
   * Creates a transaction for a user by an operator.
   */
  async createTransaction(data: TransactionPayload) {
    const merchantModel =
      createMongooseAdminClient().model<IMerchant>("Merchant");
    const userModel = new UserModel(this.merchantId);
    const transactionModel = new TransactionModel(this.merchantId);

    if (data.type === "check-out" && !data.checkOutAmount) {
      return { error: "Checkout amount is required for check-out operation" };
    }

    try {
      const merchant = await merchantModel.findById(this.merchantId).lean();
      if (!merchant) {
        return { error: "Could not find a merchant" };
      }

      const { data: user, error: findUserError } = await userModel.findUserById(
        data.userId
      );
      if (findUserError) {
        return { error: findUserError };
      }
      if (!user) {
        return { error: "User not found" };
      }

      let userIdForBalance = (user as any).id || (user as any)._id;
      if (!userIdForBalance) {
        return { error: "User ID not found for balance calculation" };
      }
      const { data: balance, error: balanceCalculationError } =
        await userModel.balance(userIdForBalance.toString());
      if (balanceCalculationError) {
        return { error: balanceCalculationError };
      }
      if (typeof balance !== "number") {
        return { error: "Could not calculate user balance" };
      }

      if (data.type === "check-out" && data.checkOutAmount! > balance) {
        return { error: "User does not have enough balance" };
      }

      const operator = await this.model.findById(data.operatorId).lean();
      if (!operator) {
        return { error: "Could not find an operator" };
      }

      const transaction: Omit<ITransaction, "id"> = {
        type: data.type,
        amount: data.transactionAmount,
        checkOutAmount: data.checkOutAmount,
        userId: data.userId,
        operatorId: data.operatorId,
        loyaltyPercentage: merchant.loyaltyPercentage,
      };
      const { data: createdTransaction, error: transactionError } =
        await transactionModel.createTransaction(transaction);
      if (transactionError) {
        return { error: transactionError };
      }
      if (createdTransaction) {
        return { data: createdTransaction };
      } else {
        return { error: "Could not create transaction" };
      }
    } catch (err) {
      console.error("createTransaction error:", err);
      return { error: "Database error while creating transaction" };
    }
  }

  /**
   * Finds all operators for a given merchant.
   */
  async findAllByMerchant(merchantId: ID, pagination?: Pagination) {
    try {
      const page = pagination?.page || 1;
      const limit = pagination?.limit || 10;
      const skip = (page - 1) * limit;

      const [operators, total] = await Promise.all([
        this.model.find({}).sort({ createdAt: -1 }).skip(skip).limit(limit),
        this.model.countDocuments(),
      ]);

      const paginationResult: PaginationResult = {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      };

      return {
        data: operators.map((operator) => operator.toObject()),
        pagination: paginationResult,
      };
    } catch (err) {
      console.error("findAllByMerchant error:", err);
      return { error: "Database error while finding operators by merchant" };
    }
  }

  /**
   * Deletes an operator by ID and merchantId.
   */
  async deleteOperator(id: string, merchantId: string) {
    try {
      const deleted = await this.model.findOneAndDelete({
        _id: id,
        merchantId,
      });
      return { data: !!deleted };
    } catch (err) {
      console.error("deleteOperator error:", err);
      return { error: "Database error while deleting operator" };
    }
  }

  /**
   * Finds all transactions operated by a specific operator.
   */
  async history(operatorId: ID, pagination?: Pagination) {
    try {
      const transactionModel = new TransactionModel(this.merchantId);
      const {
        data: transactions,
        error,
        pagination: paginationResult,
      } = await transactionModel.findOperatorTransactions(
        operatorId,
        pagination
      );
      if (error) {
        return { error };
      }
      return { data: transactions, pagination: paginationResult };
    } catch (err) {
      console.error("history error:", err);
      return {
        error: "Database error while fetching operator transaction history",
      };
    }
  }
}
