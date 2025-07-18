import fp from "fastify-plugin";
import cors from "@fastify/cors";
import { FastifyPluginAsync } from "fastify";

export default fp<FastifyPluginAsync>(async (fastify) => {
  await fastify.register(cors, {
    origin: (origin, cb) => {
      cb(null, true);
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  });
});
