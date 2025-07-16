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
        return reply.code(404).send({
          error: {
            message: error || "User not found",
          },
        });
      }
      console.log("Getting the blance:", user);
      const { data: balance, error: balanceError } = await userModel.balance(
        request.user.id
      );
      console.log("Balance:", balance, balanceError);
      if (balance === undefined || balanceError) {
        return reply.code(500).send({
          error: {
            message: balanceError || "Could not found user balance",
          },
        });
      }
      return {
        data: {
          balance: balance,
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
