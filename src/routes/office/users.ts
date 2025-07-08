import { FastifyPluginAsync } from "fastify";
import { UserModel } from "../../database/client/user/user.model";
import { TransactionModel } from "../../database/client/transaction/transaction.model";

const officeUsers: FastifyPluginAsync = async (fastify): Promise<void> => {
  // All office user APIs require 'owner' role
  const requireOwnerRole = async (request: any, reply: any) => {
    if (request.user?.type !== "operator" || request.user?.role !== "owner") {
      return reply
        .code(403)
        .send({ error: "Forbidden: Only owner can access office APIs" });
    }
  };

  // List users
  fastify.get("/users", {
    schema: {
      description: "List all users",
      tags: ["office"],
      security: [{ bearerAuth: [] }],
      querystring: {
        type: "object",
        properties: {
          limit: { type: "integer", minimum: 1, maximum: 100, default: 20 },
          page: { type: "integer", minimum: 1, default: 1 },
        },
      },
      response: {
        200: {
          type: "object",
          properties: {
            data: {
              type: "object",
              properties: {
                total: { type: "integer" },
                limit: { type: "integer" },
                page: { type: "integer" },
                users: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      id: { type: "string" },
                      displayName: { type: "string" },
                      phoneNumber: { type: "string" },
                      balance: { type: "number" },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    onRequest: [fastify.authenticate("operator"), requireOwnerRole],
    handler: async (request) => {
      const { limit = 20, page = 1 } = request.query as any;
      const userModel = new UserModel(request.user.merchantId);
      const { data: users, error } = await userModel.findAllUsers();
      if (error) throw new Error(error);
      const safeUsers = users || [];
      const start = (page - 1) * limit;
      const pagedUsers = safeUsers.slice(start, start + limit);
      const balances = await Promise.all(
        pagedUsers.map((u) => userModel.balance(u.id))
      );
      return {
        data: {
          total: safeUsers.length,
          limit,
          page,
          users: pagedUsers.map((u, i) => ({
            id: u.id,
            displayName: u.displayName,
            phoneNumber: u.phoneNumber,
            balance: balances[i].data,
          })),
        },
      };
    },
  });

  // Get user details with purchases
  fastify.get<{ Params: { id: string } }>("/users/:id", {
    schema: {
      description: "Get user details with purchases",
      tags: ["office"],
      security: [{ bearerAuth: [] }],
      params: {
        type: "object",
        required: ["id"],
        properties: {
          id: { type: "string" },
        },
      },
    },
    onRequest: [fastify.authenticate("operator"), requireOwnerRole],
    handler: async (request, reply) => {
      const { id } = request.params;
      const userModel = new UserModel(request.user.merchantId);
      const transactionModel = new TransactionModel(request.user.merchantId);
      const { data: userWithPurchases, error } =
        await userModel.getUserWithTransactions(id, transactionModel);
      if (error || !userWithPurchases) {
        reply.code(404).send({ error: error || "User not found" });
        return;
      }
      return { data: userWithPurchases };
    },
  });

  // Delete user
  fastify.delete<{ Params: { id: string } }>("/users/:id", {
    schema: {
      description: "Delete user",
      tags: ["office"],
      security: [{ bearerAuth: [] }],
      params: {
        type: "object",
        required: ["id"],
        properties: {
          id: { type: "string" },
        },
      },
    },
    onRequest: [fastify.authenticate("operator"), requireOwnerRole],
    handler: async (request, reply) => {
      const { id } = request.params;
      const userModel = new UserModel(request.user.merchantId);
      const transactionModel = new TransactionModel(request.user.merchantId);
      const { data: deleted, error } = await userModel.deleteUser(id);
      if (error || !deleted) {
        reply.code(404).send({ error: error || "User not found" });
        return;
      }
      await transactionModel.deleteUserTransactions(id);
      return { data: { success: true } };
    },
  });
};

export default officeUsers;
