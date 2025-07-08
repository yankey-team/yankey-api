import fp from "fastify-plugin";
import jwt from "@fastify/jwt";
import { FastifyReply, FastifyRequest } from "fastify";
import { JWTPayload } from "../types/data";

declare module "fastify" {
  interface FastifyInstance {
    authenticate: (
      type: "user" | "operator"
    ) => (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
  }
}

declare module "@fastify/jwt" {
  interface FastifyJWT {
    payload: JWTPayload;
  }
}

export default fp(async (fastify) => {
  fastify.register(jwt, {
    secret: process.env.JWT_SECRET || "your-secret-key-here",
  });

  fastify.decorate("authenticate", (type: "user" | "operator") => {
    return async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        await request.jwtVerify();
        if (request.user.type !== type) {
          throw new Error("Invalid token type");
        }
      } catch (err) {
        reply.code(401).send({ error: "Unauthorized" });
      }
    };
  });
});
