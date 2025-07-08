import { FastifyPluginAsync } from "fastify";
import { MerchantModel } from "../../database/admin/merchant/merchant.model";
import { UserModel } from "../../database/client/user/user.model";
import { OperatorModel } from "../../database/client/operator/operator.model";
import { RecentActivityModel } from "../../database/client/recent-activity/recent-activity.model";

const officeDashboard: FastifyPluginAsync = async (fastify): Promise<void> => {
  const requireOwnerRole = async (request: any, reply: any) => {
    if (request.user?.type !== "operator" || request.user?.role !== "owner") {
      return reply
        .code(403)
        .send({ error: "Forbidden: Only owner can access office dashboard" });
    }
  };

  fastify.get("/dashboard", {
    schema: {
      description: "Get dashboard stats",
      tags: ["office"],
      security: [{ bearerAuth: [] }],
      response: {
        200: {
          type: "object",
          properties: {
            data: {
              type: "object",
              required: ["info", "recentActivities"],
              properties: {
                info: {
                  type: "object",
                  required: [
                    "totalUsers",
                    "activeOperators",
                    "loyaltyPercentage",
                    "systemStatus",
                  ],
                  properties: {
                    totalUsers: { type: "integer" },
                    activeOperators: { type: "integer" },
                    loyaltyPercentage: { type: "number" },
                    systemStatus: { type: "string" },
                  },
                },
                recentActivities: {
                  type: "array",
                  items: {
                    type: "object",
                    required: ["title"],
                    properties: {
                      title: { type: "string" },
                      description: { type: "string", nullable: true },
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
    onRequest: [fastify.authenticate("operator"), requireOwnerRole],
    handler: async (request, reply) => {
      try {
        const merchantId = request.user.merchantId;

        const merchantModel = new MerchantModel();
        const { data: merchant, error: merchantError } =
          await merchantModel.getMerchantById(merchantId);
        if (merchantError || !merchant) {
          return reply
            .code(404)
            .send({ error: merchantError || "Merchant not found" });
        }

        const userModel = new UserModel(merchantId);
        const { data: users, error: userError } =
          await userModel.findAllUsers();
        if (userError) {
          return reply.code(500).send({ error: userError });
        }

        const operatorModel = new OperatorModel(merchantId);
        const { data: operators, error: operatorError } =
          await operatorModel.findAllByMerchant(merchantId);
        if (operatorError) {
          return reply.code(500).send({ error: operatorError });
        }

        const loyaltyPercentage = merchant.loyaltyPercentage || 0;
        const systemStatus = "Operational";

        const recentActivityModel = new RecentActivityModel(merchantId);
        const { data: activities, error: activityError } =
          await recentActivityModel.allActivities();
        if (activityError) {
          return reply.code(500).send({ error: activityError });
        }

        return {
          data: {
            info: {
              totalUsers: users?.length || 0,
              activeOperators: operators?.length || 0,
              loyaltyPercentage,
              systemStatus,
            },
            recentActivities: activities || [],
          },
        };
      } catch (err) {
        return reply
          .code(500)
          .send({ error: "Failed to fetch dashboard data" });
      }
    },
  });
};

export default officeDashboard;
