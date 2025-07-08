import { FastifyPluginAsync } from "fastify";
import { UserModel } from "../../database/client/user/user.model";
import userAuthRoutes from "./auth";

const user: FastifyPluginAsync = async (fastify): Promise<void> => {
  fastify.register(userAuthRoutes);

  fastify.get("/balance", {
    schema: {
      description: "Get user balance and merchant information",
      tags: ["user"],
      security: [{ bearerAuth: [] }],
      response: {
        200: {
          type: "object",
          properties: {
            data: {
              type: "object",
              properties: {
                balance: { type: "number" },
                merchant: {
                  type: "object",
                  properties: {
                    name: { type: "string" },
                    loyaltyPercentage: { type: "number" },
                  },
                },
              },
            },
          },
        },
      },
    },
    onRequest: [fastify.authenticate("user")],
    handler: async (request, reply) => {
      const userModel = new UserModel(request.merchant.id);
      const { data: user, error } = await userModel.findUserById(
        request.user.id
      );
      if (error || !user) {
        return { balance: 0 };
      }
      const { data: balance } = await userModel.balance(user.id.toString());
      return {
        data: {
          balance: balance || 0,
          merchant: {
            name: request.merchant.name,
            loyaltyPercentage: request.merchant.loyaltyPercentage,
          },
        },
      };
    },
  });
};

export default user;
