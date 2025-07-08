import fp from "fastify-plugin";
import { FastifyRequest } from "fastify";
import { MerchantModel } from "../database/admin/merchant/merchant.model";
import { IMerchant } from "../database/admin/merchant/merchant.schema";

// Use undefined as unknown as Merchant for clarity

declare module "fastify" {
  interface FastifyRequest {
    merchant: IMerchant;
  }
}

export default fp(async (fastify) => {
  fastify.decorateRequest("merchant", undefined as unknown as IMerchant);

  fastify.addHook("onRequest", async (request: FastifyRequest) => {
    // Skip merchant verification for Swagger documentation
    if (
      request.url.startsWith("/docs") ||
      request.url.startsWith("/office/auth")
    ) {
      return;
    }

    const host = request.headers.host?.toLowerCase();
    if (!host) {
      throw new Error("Host header is required");
    }

    const merchantModel = new MerchantModel();
    // I am getting host like demo.yankey.local:3000, but It should be without port.
    const domain = host.includes(":") ? host.split(":")[0] : host; // Remove port only if present
    const { data: merchant, error } = await merchantModel.getMerchantByDomain(
      domain
    );
    if (error || !merchant) {
      throw new Error(error || "Merchant not found");
    }
    request.merchant = merchant;
  });
});
