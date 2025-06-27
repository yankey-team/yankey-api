import { Schema } from "mongoose";
import { modifySchema } from "../../utils";

/**
 * IOperator represents an operator in the system.
 */
export interface IOperator {
  username: string;
  password: string;
  displayName: string;
}

/**
 * OperatorSchema defines the structure of the Operator collection in MongoDB.
 */
export const OperatorSchema = modifySchema(new Schema<IOperator>({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  displayName: { type: String, required: true },
}, { timestamps: true }));
