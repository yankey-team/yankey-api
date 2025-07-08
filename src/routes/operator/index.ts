import { FastifyPluginAsync } from "fastify";
import { TransactionModel } from "../../database/client/transaction/transaction.model";
import { UserModel } from "../../database/client/user/user.model";
import { OperatorModel } from "../../database/client/operator/operator.model";
import operatorAuthRoutes from "./auth";
import { RecentActivityModel } from "../../database/client/recent-activity/recent-activity.model";

interface SearchQuery {
  last4: string;
}

interface PurchaseBody {
  type: "check-in" | "check-out";
  amount: number;
  checkOutAmount?: number;
  userId: string;
}

const operator: FastifyPluginAsync = async (fastify): Promise<void> => {
  fastify.register(operatorAuthRoutes);

  // All operator APIs require 'operator' role
  const requireOperatorRole = async (request: any, reply: any) => {
    if (
      request.user?.type !== "operator" ||
      request.user?.role !== "operator"
    ) {
      return reply
        .code(403)
        .send({ error: "Forbidden: Only operator can access operator APIs" });
    }
  };

  fastify.get<{ Querystring: SearchQuery }>("/search-users", {
    schema: {
      description: "Search users by last 4 digits of phone number",
      tags: ["operator"],
      security: [{ bearerAuth: [] }],
      querystring: {
        type: "object",
        required: ["last4"],
        properties: {
          last4: {
            type: "string",
            description: "Last 4 digits of phone number",
            minLength: 4,
            maxLength: 4,
          },
        },
      },
      response: {
        200: {
          type: "object",
          properties: {
            data: {
              type: "object",
              properties: {
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
    onRequest: [fastify.authenticate("operator"), requireOperatorRole],
    handler: async (request) => {
      const { last4 } = request.query;
      const userModel = new UserModel(request.merchant.id);
      const { data: users, error } = await userModel.searchByLast4(
        request.merchant.id,
        last4
      );
      if (error) throw new Error(error);
      const safeUsers = users || [];
      return {
        data: {
          users: await Promise.all(
            safeUsers.map(async (u) => {
              const { data, error } = await userModel.balance(u.id);
              const balance: number = error || !data ? 0 : data;
              return {
                id: u.id,
                displayName: u.displayName,
                phoneNumber: u.phoneNumber,
                balance: balance,
              };
            })
          ),
        },
      };
    },
  });

  fastify.post<{ Body: PurchaseBody }>("/transaction", {
    schema: {
      description: "Create a new purchase and apply cashback",
      tags: ["operator"],
      security: [{ bearerAuth: [] }],
      body: {
        type: "object",
        required: ["amount", "userId", "type"],
        properties: {
          amount: { type: "number" },
          userId: { type: "string" },
          type: {
            type: "string",
            description: "Transaction type",
            enum: ["check-in", "check-out"],
          },
          checkOutAmount: { type: "number", description: "Check out amount" },
        },
      },
      response: {
        200: {
          type: "object",
          properties: {
            data: {
              type: "object",
              properties: {
                purchase: {
                  type: "object",
                  properties: {
                    id: { type: "string" },
                    amount: { type: "number" },
                    userId: { type: "string" },
                    operatorId: { type: "string" },
                    createdAt: { type: "string", format: "date-time" },
                  },
                },
                cashback: { type: "number" },
                newBalance: { type: "number" },
              },
            },
          },
        },
      },
    },
    onRequest: [fastify.authenticate("operator"), requireOperatorRole],
    handler: async (request, reply) => {
      const { amount, userId, type, checkOutAmount } = request.body;
      const activityModel = new RecentActivityModel(request.merchant.id);
      const userModel = new UserModel(request.merchant.id);
      const operatorModel = new OperatorModel(request.merchant.id);
      const transactionModel = new TransactionModel(request.merchant.id);
      // Find user
      const { data: user } = await userModel.findUserById(userId);
      if (!user) {
        reply.code(404).send({ error: "User not found" });
        return;
      }
      const { data: operator } = await operatorModel.findOperatorById(
        request.user.id
      );
      if (!operator) {
        return reply.code(404).send({ error: "Operator not found" });
      }
      // Create transaction (purchase)
      const transactionData = {
        type: type,
        amount,
        userId: userId,
        operatorId: request.user.id,
        loyaltyPercentage: request.merchant.loyaltyPercentage,
        checkOutAmount,
      };
      const { data: purchase, error: transactionError } =
        await transactionModel.createTransaction(transactionData);
      if (transactionError || !purchase) {
        reply
          .code(500)
          .send({ error: transactionError || "Could not create purchase" });
        return;
      }
      // Calculate cashback and new balance
      const cashback = (amount * request.merchant.loyaltyPercentage) / 100;
      // Optionally, update balance in user document if you store it
      const { data: balance } = await userModel.balance(userId);
      await activityModel.createActivity(
        `Transaction operated by ${operator.displayName}`,
        `Transaction operated to ${user.displayName} user with ${transactionData.type} type and ${transactionData.amount} amount`
      );
      return {
        data: {
          purchase: {
            id: purchase.id,
            amount: purchase.amount,
            userId: purchase.userId,
            operatorId: purchase.operatorId,
            createdAt: (purchase as any).createdAt,
          },
          cashback,
          newBalance: balance || 0,
        },
      };
    },
  });

  fastify.get("/history", {
    schema: {
      description: "Get transaction history operated by the current operator",
      tags: ["operator"],
      security: [{ bearerAuth: [] }],
      response: {
        200: {
          type: "object",
          properties: {
            data: {
              type: "object",
              properties: {
                transactions: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      id: { type: "string" },
                      type: { type: "string" },
                      amount: { type: "number" },
                      userId: { type: "string" },
                      operatorId: { type: "string" },
                      loyaltyPercentage: { type: "number" },
                      checkOutAmount: { type: "number" },
                      createdAt: { type: "string", format: "date-time" },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    onRequest: [fastify.authenticate("operator"), requireOperatorRole],
    handler: async (request, reply) => {
      const operatorModel = new OperatorModel(request.merchant.id);
      const { data: transactions, error } = await operatorModel.history(
        request.user.id
      );
      if (error) {
        reply.code(500).send({ error });
        return;
      }
      return {
        data: {
          transactions: (transactions || []).map((t: any) => ({
            id: t.id,
            type: t.type,
            amount: t.amount,
            userId: t.userId,
            operatorId: t.operatorId,
            loyaltyPercentage: t.loyaltyPercentage,
            checkOutAmount: t.checkOutAmount,
            createdAt: t.createdAt,
          })),
        },
      };
    },
  });
};

export default operator;
