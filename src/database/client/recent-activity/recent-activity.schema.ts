import { Schema } from "mongoose";
import { ID } from "../../../types";
import { modifySchema } from "../../utils";

export interface IRecentActivity {
  id: ID;
  title: string;
  description: string;
}

export const RecentActivitySchema = modifySchema(
  new Schema<IRecentActivity>(
    {
      title: { type: String, required: true },
      description: { type: String },
    },
    { timestamps: true }
  )
);
