import { FastifyPluginAsync } from "fastify";
import { MerchantUpdatePayload } from "../../types/data";
import { MerchantModel } from "../../database/admin/merchant/merchant.model";

const officeSettings: FastifyPluginAsync = async (fastify): Promise<void> => {
  // Get merchant settings
  fastify.get("/settings", {
    schema: {
      description: "Get merchant settings",
      tags: ["office"],
      security: [{ bearerAuth: [] }],
      response: {
        200: {
          type: "object",
          properties: {
            data: {
              type: "object",
              properties: {
                name: { type: "string" },
                domain: { type: "string" },
                loyaltyPercentage: { type: "number" },
              },
            },
          },
        },
      },
    },
    onRequest: [
      fastify.authenticate("operator"),
      async (request, reply) => {
        if (request.user.role !== "owner") {
          return reply
            .code(403)
            .send({
              error: "Forbidden: Only owner can access office settings",
            });
        }
      },
    ],
    handler: async (request, reply) => {
      const merchantModel = new MerchantModel();
      const { data: merchant, error } = await merchantModel.getMerchantById(
        request.user.merchantId
      );
      if (error || !merchant) {
        reply.code(404).send({ error: error || "Merchant not found" });
        return;
      }
      return {
        data: {
          name: merchant.name,
          domain: merchant.domain,
          loyaltyPercentage: merchant.loyaltyPercentage,
        },
      };
    },
  });

  // Update merchant settings
  fastify.put<{ Body: MerchantUpdatePayload }>("/settings", {
    schema: {
      description: "Update merchant settings",
      tags: ["office"],
      security: [{ bearerAuth: [] }],
      body: {
        type: "object",
        properties: {
          data: {
            type: "object",
            properties: {
              name: { type: "string" },
              loyaltyPercentage: { type: "number" },
            },
          },
        },
      },
    },
    onRequest: [
      fastify.authenticate("operator"),
      async (request, reply) => {
        if (request.user.role !== "owner") {
          return reply
            .code(403)
            .send({
              error: "Forbidden: Only owner can update office settings",
            });
        }
      },
    ],
    handler: async (request, reply) => {
      const { name, loyaltyPercentage } = request.body;
      const merchantModel = new MerchantModel();
      const updateData: any = {};
      if (name) updateData.name = name;
      if (loyaltyPercentage) updateData.loyaltyPercentage = loyaltyPercentage;
      const { data: merchant, error } = await merchantModel.updateMerchantById(
        request.user.merchantId,
        updateData
      );
      if (error || !merchant) {
        reply.code(404).send({ error: error || "Merchant not found" });
        return;
      }
      return {
        data: {
          name: merchant.name,
          domain: merchant.domain,
          loyaltyPercentage: merchant.loyaltyPercentage,
        },
      };
    },
  });
};

export default officeSettings;
