import { Schema } from "mongoose";
import { modifySchema } from "../../utils";
import { ID } from "../../../types";

/**
 * IOperator represents an operator in the system.
 */
export interface IOperator {
  id: ID;
  username: string;
  password: string;
  displayName: string;
  role: 'owner' | 'operator';
}

/**
 * OperatorSchema defines the structure of the Operator collection in MongoDB.
 */
export const OperatorSchema = modifySchema(new Schema<IOperator>({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  displayName: { type: String, required: true },
  role: { type: String, enum: ['owner', 'operator'], required: true },
}, { timestamps: true }));
