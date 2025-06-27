import { Model } from "mongoose";
import { ID } from "../../../types";
import { IMerchant } from "./merchant.schema";
import { createMongooseAdminClient } from "../mongoose";

/**
 * MerchantModel provides methods to interact with Merchant data.
 */
export class MerchantModel {
  model: Model<IMerchant>;

  constructor() {
    this.model = createMongooseAdminClient().model<IMerchant>('Merchant');
  }

  /**
   * Finds a merchant by domain.
   */
  async getMerchantByDomain(domain: string) {
    try {
      const merchant = await this.model.findOne({ domain });
      if (merchant) {
        return { data: merchant.toObject() };
      }
      return { error: 'Could not find merchant' };
    } catch (err) {
      console.error('getMerchantByDomain error:', err);
      return { error: 'Database error while finding merchant by domain' };
    }
  }

  /**
   * Creates a new merchant.
   */
  async createMerchant(data: Omit<IMerchant, 'id'>) {
    try {
      const createdMerchant = await this.model.create(data);
      if (createdMerchant) {
        return { data: (await this.model.findById(createdMerchant._id))?.toObject() };
      }
      return { error: 'Could not create a merchant' };
    } catch (err) {
      console.error('createMerchant error:', err);
      return { error: 'Database error while creating merchant' };
    }
  }

  /**
   * Updates a merchant by ID.
   */
  async updateMerchant(id: ID, data: Partial<IMerchant>) {
    try {
      const merchant = await this.model.findById(id).lean();
      if (merchant) {
        const updatedMerchant = await this.model.findByIdAndUpdate(merchant._id, data, { new: true });
        return { data: updatedMerchant?.toObject() };
      }
      return { error: 'Could not find merchant to update' };
    } catch (err) {
      console.error('updateMerchant error:', err);
      return { error: 'Database error while updating merchant' };
    }
  }

  /**
   * Finds a merchant by ID.
   */
  async getMerchantById(id: string) {
    try {
      const merchant = await this.model.findById(id);
      if (merchant) {
        return { data: merchant.toObject() };
      }
      return { error: 'Merchant not found' };
    } catch (err) {
      console.error('getMerchantById error:', err);
      return { error: 'Database error while finding merchant by ID' };
    }
  }

  /**
   * Updates a merchant by ID.
   */
  async updateMerchantById(id: string, data: Partial<IMerchant>) {
    try {
      const updated = await this.model.findByIdAndUpdate(id, data, { new: true });
      if (updated) {
        return { data: updated.toObject() };
      }
      return { error: 'Merchant not found' };
    } catch (err) {
      console.error('updateMerchantById error:', err);
      return { error: 'Database error while updating merchant' };
    }
  }
}