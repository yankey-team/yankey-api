import fp from "fastify-plugin";
import fastifySwagger from "@fastify/swagger";
import fastifySwaggerUI from "@fastify/swagger-ui";

export default fp(async (fastify) => {
  await fastify.register(fastifySwagger, {
    openapi: {
      info: {
        title: "Yankey API Documentation",
        description:
          "API documentation for Yankey loyalty cashback platform.\n\nAuthentication:\n- User endpoints require JWT Bearer token.\n- Operator endpoints require JWT Bearer token.\n\nAll endpoints are grouped by user type.",
        version: "1.0.0",
      },
      tags: [
        { name: "user", description: "User endpoints" },
        { name: "operator", description: "Operator endpoints" },
        { name: "office", description: "Merchant office endpoints" },
      ],
      components: {
        securitySchemes: {
          bearerAuth: {
            type: "http",
            scheme: "bearer",
            bearerFormat: "JWT",
            description: "JWT Bearer token for authentication",
          },
        },
      },
    },
  });

  await fastify.register(fastifySwaggerUI, {
    routePrefix: "/docs",
    uiConfig: {
      docExpansion: "list",
      deepLinking: false,
    },
    transformStaticCSP: (header) => header,
  });

  // --- Schemas ---
  fastify.addSchema({
    $id: "userAuth",
    type: "object",
    required: ["displayName", "phoneNumber"],
    properties: {
      displayName: {
        type: "string",
        description: "User display name",
        example: "John Doe",
      },
      phoneNumber: {
        type: "string",
        description: "User phone number",
        example: "+1234567890",
      },
    },
    description: "Payload for user authentication.",
  });

  fastify.addSchema({
    $id: "operatorAuth",
    type: "object",
    required: ["username", "password"],
    properties: {
      username: {
        type: "string",
        description: "Operator username",
        example: "operator1",
      },
      password: {
        type: "string",
        description: "Operator password",
        example: "password123",
      },
    },
    description: "Payload for operator authentication.",
  });

  fastify.addSchema({
    $id: "purchase",
    type: "object",
    required: ["amount", "userId"],
    properties: {
      amount: {
        type: "number",
        description: "Purchase amount",
        example: 100.5,
      },
      userId: { type: "string", description: "User ID", example: "usr_123" },
    },
    description: "Payload for making a purchase.",
  });

  fastify.addSchema({
    $id: "user",
    type: "object",
    required: ["id", "displayName", "phoneNumber"],
    properties: {
      id: { type: "string", description: "User ID", example: "usr_123" },
      displayName: {
        type: "string",
        description: "User display name",
        example: "John Doe",
      },
      phoneNumber: {
        type: "string",
        description: "User phone number",
        example: "+1234567890",
      },
    },
    description: "User entity.",
  });

  fastify.addSchema({
    $id: "operator",
    type: "object",
    required: ["username", "displayName"],
    properties: {
      username: {
        type: "string",
        description: "Operator username",
        example: "operator1",
      },
      displayName: {
        type: "string",
        description: "Operator display name",
        example: "Jane Smith",
      },
    },
    description: "Operator entity.",
  });

  fastify.addSchema({
    $id: "transaction",
    type: "object",
    required: [
      "id",
      "type",
      "amount",
      "loyaltyPercentage",
      "userId",
      "operatorId",
    ],
    properties: {
      id: { type: "string", description: "Transaction ID", example: "txn_789" },
      type: {
        type: "string",
        enum: ["check-in", "check-out"],
        description: "Transaction type",
        example: "check-in",
      },
      amount: {
        type: "number",
        description: "Transaction amount",
        example: 100,
      },
      checkOutAmount: {
        type: "number",
        description: "Check-out amount",
        example: 80,
      },
      loyaltyPercentage: {
        type: "number",
        description: "Loyalty percentage",
        example: 2.5,
      },
      userId: { type: "string", description: "User ID", example: "usr_123" },
      operatorId: {
        type: "string",
        description: "Operator ID",
        example: "op_456",
      },
    },
    description: "Transaction entity.",
  });
});
