import { FastifyPluginAsync } from "fastify";
import bcryptjs from "bcryptjs";
import { OperatorCreatePayload, OperatorUpdatePayload } from "../../types/data";
import { OperatorModel } from "../../database/client/operator/operator.model";
import { Pagination } from "../../types";

const officeOperators: FastifyPluginAsync = async (fastify): Promise<void> => {
  // List operators
  fastify.get<{ Querystring: Pagination }>("/operators", {
    schema: {
      description: "List all operators",
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
                operators: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      id: { type: "string" },
                      username: { type: "string" },
                      displayName: { type: "string" },
                      role: { type: "string" },
                    },
                  },
                },
                pagination: {
                  type: "object",
                  properties: {
                    page: { type: "number" },
                    limit: { type: "number" },
                    total: { type: "number" },
                    totalPages: { type: "number" },
                  },
                },
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
            .send({ error: "Forbidden: Only owner can access office APIs" });
        }
      },
    ],
    handler: async (request) => {
      const { limit = 20, page = 1 } = request.query;
      const operatorModel = new OperatorModel(request.user.merchantId);
      const {
        data: operators,
        error,
        pagination,
      } = await operatorModel.findAllByMerchant(request.user.merchantId, {
        page,
        limit,
      });
      if (error) throw new Error(error);
      const safeOperators = operators || [];
      const start = (page - 1) * limit;
      const pagedOperators = safeOperators.slice(start, start + limit);
      return {
        data: {
          operators: pagedOperators.map((e) => ({
            id: e._id?.toString(),
            username: e.username,
            displayName: e.displayName,
            role: e.role,
          })),
          pagination,
        },
      };
    },
  });

  // Create operator
  fastify.post<{ Body: OperatorCreatePayload }>("/operators", {
    schema: {
      description: "Create new operator",
      tags: ["office"],
      security: [{ bearerAuth: [] }],
      body: {
        type: "object",
        required: ["username", "password", "displayName"],
        properties: {
          username: { type: "string" },
          password: { type: "string" },
          displayName: { type: "string" },
        },
      },
    },
    onRequest: [
      fastify.authenticate("operator"),
      async (request, reply) => {
        if (request.user.role !== "owner") {
          return reply
            .code(403)
            .send({ error: "Forbidden: Only owner can create operators" });
        }
      },
    ],
    handler: async (request, reply) => {
      const { username, password, displayName } = request.body;
      const operatorModel = new OperatorModel(request.user.merchantId);
      // Check if username exists for this merchant
      const { data: existing } = await operatorModel.findByUsername(username);
      if (existing) {
        reply.code(400).send({ error: "Username already exists" });
        return;
      }
      const operatorResult = await operatorModel.createOperator({
        username,
        password: bcryptjs.hashSync(password, 10),
        displayName,
        role: "operator",
      });
      if (operatorResult.error || !operatorResult.data) {
        reply
          .code(500)
          .send({ error: operatorResult.error || "Could not create operator" });
        return;
      }
      const { password: _, ...operatorData } = operatorResult.data;
      return {
        data: {
          id: operatorResult.data._id?.toString(),
          username: operatorData.username,
          displayName: operatorData.displayName,
          role: operatorData.role,
        },
      };
    },
  });

  // Update operator
  fastify.put<{ Params: { id: string }; Body: OperatorUpdatePayload }>(
    "/operators/:id",
    {
      schema: {
        description: "Update operator",
        tags: ["office"],
        security: [{ bearerAuth: [] }],
        params: {
          type: "object",
          required: ["id"],
          properties: {
            id: { type: "string" },
          },
        },
        body: {
          type: "object",
          properties: {
            displayName: { type: "string" },
            password: { type: "string" },
          },
        },
      },
      onRequest: [
        fastify.authenticate("operator"),
        async (request, reply) => {
          if (request.user.role !== "owner") {
            return reply
              .code(403)
              .send({ error: "Forbidden: Only owner can update operators" });
          }
        },
      ],
      handler: async (request, reply) => {
        const { id } = request.params;
        const { displayName, password } = request.body;
        const operatorModel = new OperatorModel(request.user.merchantId);
        const updateData: any = {};
        if (displayName) updateData.displayName = displayName;
        if (password) updateData.password = bcryptjs.hashSync(password, 10);
        const { data: updated, error } = await operatorModel.updateOperator(
          id,
          updateData
        );
        if (error || !updated) {
          reply.code(404).send({ error: error || "Operator not found" });
          return;
        }
        const { password: _, ...operatorData } = updated;
        return {
          data: {
            id: updated._id?.toString(),
            username: operatorData.username,
            displayName: operatorData.displayName,
            role: operatorData.role,
          },
        };
      },
    }
  );

  // Delete operator
  fastify.delete<{ Params: { id: string } }>("/operators/:id", {
    schema: {
      description: "Delete operator",
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
    onRequest: [
      fastify.authenticate("operator"),
      async (request, reply) => {
        if (request.user.role !== "owner") {
          return reply
            .code(403)
            .send({ error: "Forbidden: Only owner can delete operators" });
        }
      },
    ],
    handler: async (request, reply) => {
      const { id } = request.params;
      if (id === request.user.id) {
        reply.code(400).send({ error: "Cannot delete yourself" });
        return;
      }
      const operatorModel = new OperatorModel(request.user.merchantId);
      const { data: deleted, error } = await operatorModel.deleteOperator(
        id,
        request.user.merchantId
      );
      if (error || !deleted) {
        reply.code(404).send({ error: error || "Operator not found" });
        return;
      }
      return { data: { success: true } };
    },
  });
};

export default officeOperators;
