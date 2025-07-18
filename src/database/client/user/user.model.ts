import { Model } from "mongoose";
import { ID, Pagination, PaginationResult } from "../../../types";
import { createMongooseClient } from "../mongoose";
import { IUser } from "./user.schema";
import { TransactionModel } from "../transaction/transaction.model";

/**
 * UserModel provides methods to interact with User data for a specific merchant.
 */
export class UserModel {
  model: Model<IUser>;

  constructor(readonly merchantId: ID) {
    this.model = createMongooseClient(merchantId).model<IUser>("User");
  }

  /**
   * Finds a user by their ID.
   * @param id - The user ID
   * @returns An object with either the user data or an error message
   */
  async findUserById(id: ID): Promise<{ data?: IUser; error?: string }> {
    try {
      const user = await this.model.findById(id);
      if (user) return { data: user.toObject() };
      return { error: "User not found" };
    } catch (err) {
      console.error("findUserById error:", err);
      return { error: "Database error while finding user" };
    }
  }

  /**
   * Calculates the user's balance based on their transactions.
   * @param id - The user ID
   * @returns An object with either the balance or an error message
   */
  async balance(id: ID): Promise<{ data?: number; error?: string }> {
    const transactionModel = new TransactionModel(this.merchantId);
    try {
      const user = await this.model.findById(id);
      if (!user) {
        return { error: "User not found" };
      }
      const { data: userTransactions } =
        await transactionModel.findUserTransactions(user._id.toString());
      let balance = 0.0;
      if (Array.isArray(userTransactions)) {
        for (const transaction of userTransactions) {
          if (transaction.type === "check-in") {
            balance +=
              (transaction.amount * transaction.loyaltyPercentage) / 100.0;
          } else if (transaction.checkOutAmount) {
            balance -= transaction.checkOutAmount;
          }
        }
      }
      return { data: balance };
    } catch (err) {
      console.error("balance error:", err);
      return { error: "Database error while calculating balance" };
    }
  }

  /**
   * Creates a new user.
   * @param userData - The user data to create
   * @returns An object with either the created user or an error message
   */
  async createUser(
    userData: Partial<IUser>
  ): Promise<{ data?: IUser; error?: string }> {
    try {
      const user = await this.model.findOne({ phoneNumber: userData.phoneNumber });
      if (user) {
        return { data: user.toObject() }
      }
      const createdUser = await this.model.create(userData);
      if (createdUser) return { data: createdUser.toObject() };
      return { error: "User could not be created" };
    } catch (err) {
      console.error("createUser error:", err);
      return { error: "Database error while creating user" };
    }
  }

  /**
   * Finds all users for a given merchant.
   */
  async findAllUsers(pagination?: Pagination) {
    try {
      const page = pagination?.page || 1;
      const limit = pagination?.limit || 10;
      const skip = (page - 1) * limit;

      const [users, total] = await Promise.all([
        this.model.find().sort({ createdAt: -1 }).skip(skip).limit(limit),
        this.model.countDocuments(),
      ]);

      const paginationResult: PaginationResult = {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      };

      return {
        data: users.map((user) => user.toObject()),
        pagination: paginationResult,
      };
    } catch (err) {
      console.error("findAllUsers error:", err);
      return { error: "Database error while finding users" };
    }
  }

  /**
   * Finds a user by ID and returns user with all transactions (purchases).
   */
  async getUserWithTransactions(userId: ID, transactionModel: any) {
    try {
      const user = await this.model.findById(userId);
      if (!user) return { error: "User not found" };
      const { data: purchases } = await transactionModel.findUserTransactions(
        userId
      );
      return { data: { ...user.toObject(), purchases: purchases || [] } };
    } catch (err) {
      console.error("getUserWithTransactions error:", err);
      return { error: "Database error while getting user with transactions" };
    }
  }

  /**
   * Deletes a user by ID.
   */
  async deleteUser(userId: ID) {
    try {
      const deletedUser = await this.model.findByIdAndDelete(userId);
      if (deletedUser) {
        return { data: deletedUser.toObject() };
      } else {
        return { error: "User not found" };
      }
    } catch (err) {
      console.error("deleteUser error:", err);
      return { error: "Database error while deleting user" };
    }
  }

  /**
   * Finds users by merchantId and last 4 digits of phone number.
   */
  async searchByLast4(merchantId: ID, last4: string) {
    try {
      const users = await this.model.find({
        phoneNumber: { $regex: last4 + "$" },
      });
      return { data: users.map((user) => user.toObject()) };
    } catch (err) {
      console.error("searchByLast4 error:", err);
      return { error: "Database error while searching users by last 4 digits" };
    }
  }
}
