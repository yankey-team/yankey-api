import { Model } from "mongoose";
import { IRecentActivity } from "./recent-activity.schema";
import { ID } from "../../../types";
import { createMongooseClient } from "../mongoose";

export class RecentActivityModel {
  model: Model<IRecentActivity>;
  constructor(readonly merchantId: ID) {
    this.model =
      createMongooseClient(merchantId).model<IRecentActivity>("RecentActivity");
  }

  async allActivities() {
    try {
      const activities = await this.model
        .find()
        .sort({ createdAt: -1 })
        .limit(5);
      return { data: activities.map((item) => item.toObject()) };
    } catch (err) {
      console.log("allActivities error:", err);
      return { error: "Database error while fetching activities" };
    }
  }

  async createActivity(title: string, description?: string) {
    try {
      const createdActivity = await this.model.create({ title, description });
      if (createdActivity) {
        const activity = await this.model.findById(createdActivity._id);
        return { data: activity?.toObject() };
      }
      return { error: "Could not create an activity" };
    } catch (err) {
      console.log("createActivity error:", err);
      return { error: "Database error while creating activity" };
    }
  }
}
