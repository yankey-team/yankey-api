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
      const merchant = await this.model.findOne({ domain }).lean();
      if (merchant) {
        return { data: merchant };
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
        return { data: await this.model.findById(createdMerchant._id).lean() };
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
        const updatedMerchant = await this.model.findByIdAndUpdate(merchant._id, data, { new: true }).lean();
        return { data: updatedMerchant };
      }
      return { error: 'Could not find merchant to update' };
    } catch (err) {
      console.error('updateMerchant error:', err);
      return { error: 'Database error while updating merchant' };
    }
  }

  /**
   * Finds the default merchant by domain 'demo.yankey.local'.
   * If not found, creates a default merchant.
   */
  async getDefaultMerchant() {
    const defaultDomain = 'demo.yankey.local';
    let merchant = await this.model.findOne({ domain: defaultDomain }).lean();
    if (merchant) {
      return { data: merchant };
    }
    // Create default merchant if not exists
    const defaultData = {
      name: 'Demo Merchant',
      domain: defaultDomain,
      loyaltyPercentage: 2.5
    };
    const created = await this.model.create(defaultData);
    if (created) {
      merchant = await this.model.findById(created._id).lean();
      return { data: merchant };
    }
    return { error: 'Could not create default merchant' };
  }

  /**
   * Finds a merchant by ID.
   */
  async getMerchantById(id: string) {
    try {
      const merchant = await this.model.findById(id).lean();
      if (merchant) {
        return { data: merchant };
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
      const updated = await this.model.findByIdAndUpdate(id, data, { new: true }).lean();
      if (updated) {
        return { data: updated };
      }
      return { error: 'Merchant not found' };
    } catch (err) {
      console.error('updateMerchantById error:', err);
      return { error: 'Database error while updating merchant' };
    }
  }
}