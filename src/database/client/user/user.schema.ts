import { Schema } from "mongoose";
import { ID } from "../../../types";

/**
 * IUser represents a user in the system.
 */
export interface IUser {
  id: ID;
  displayName: string;
  phoneNumber: string;
  telegramId: ID;
}

/**
 * UserSchema defines the structure of the User collection in MongoDB.
 */
export const UserSchema = new Schema<IUser>({
  displayName: { type: String, required: true },
  phoneNumber: { type: String, required: true },
  telegramId: { type: String, required: true },
}, { timestamps: true });
