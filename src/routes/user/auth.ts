import { FastifyPluginAsync } from "fastify";
import { UserAuthPayload } from "../../types/data";
import { UserModel } from "../../database/client/user/user.model";
import { RecentActivityModel } from "../../database/client/recent-activity/recent-activity.model";

const userAuthRoutes: FastifyPluginAsync = async (fastify): Promise<void> => {
  // User login
  fastify.post<{ Body: UserAuthPayload }>("/auth/login", {
    schema: {
      description:
        "Authenticate user using display name, phone number, and optional birthday",
      tags: ["user"],
      body: {
        type: "object",
        required: ["displayName", "phoneNumber"],
        properties: {
          displayName: {
            type: "string",
            description: "User display name",
          },
          phoneNumber: {
            type: "string",
            description: "User phone number",
          },
          birthday: {
            type: "string",
            format: "date",
            description: "User birthday (optional, ISO date string)",
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
                token: { type: "string" },
              },
            },
          },
        },
      },
    },
    handler: async (request, reply) => {
      const { displayName, phoneNumber, birthday } = request.body;
      const activityModel = new RecentActivityModel(request.merchant.id);
      const userModel = new UserModel(request.merchant.id);

      const { data: createdUser } = await userModel.createUser({
        displayName,
        phoneNumber,
        birthday,
      });
      if (!createdUser) {
        return reply.code(400).send({ error: "User could not be created" });
      }
      const token = await reply.jwtSign({
        id: createdUser.id.toString(),
        type: "user",
        merchantId: request.merchant.id,
      });
      activityModel.createActivity(
        `User ${displayName} has login`,
        `${displayName} has login with ${phoneNumber} phone number`
      );
      return { data: { token } };
    },
  });
};

export default userAuthRoutes;
