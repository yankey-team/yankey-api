import fp from 'fastify-plugin';
import { FastifyRequest } from 'fastify';
import { MerchantModel } from '../database/admin/merchant/merchant.model';
import { IMerchant } from '../database/admin/merchant/merchant.schema';

// Use undefined as unknown as Merchant for clarity

declare module 'fastify' {
  interface FastifyRequest {
    merchant: IMerchant;
  }
}

export default fp(async (fastify) => {
  fastify.decorateRequest('merchant', undefined as unknown as IMerchant);

  fastify.addHook('onRequest', async (request: FastifyRequest) => {
    // Skip merchant verification for Swagger documentation
    if (request.url.startsWith('/docs') || request.url.startsWith('/documentation/')) {
      const merchantModel = new MerchantModel();
      const { data: defaultMerchant, error } = await merchantModel.getDefaultMerchant();
      if (error || !defaultMerchant) {
        throw new Error(error || 'No merchants found in the database');
      }
      request.merchant = defaultMerchant;
      return;
    }

    const host = request.headers.host?.toLowerCase();
    if (!host) {
      throw new Error('Host header is required');
    }

    const merchantModel = new MerchantModel();
    const { data: merchantDoc, error } = await merchantModel.getMerchantByDomain(host);
    if (error || !merchantDoc) {
      throw new Error(error || 'Merchant not found');
    }
    request.merchant = merchantDoc;
  });
});