import { Schema } from "mongoose";
import { ID } from "../../../types";
import { modifySchema } from "../../utils";

/**
 * IUser represents a user in the system.
 */
export interface IUser {
  id: ID;
  displayName: string;
  phoneNumber: string;
  birthday: string; // yyyy-mm-dd format, required
}

/**
 * UserSchema defines the structure of the User collection in MongoDB.
 */
export const UserSchema = modifySchema(
  new Schema<IUser>(
    {
      displayName: { type: String, required: true },
      phoneNumber: { type: String, required: true },
      birthday: { type: String, required: true, match: /^\d{4}-\d{2}-\d{2}$/ },
    },
    { timestamps: true }
  )
);
