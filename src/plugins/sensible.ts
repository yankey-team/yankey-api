import fp from "fastify-plugin";
import sensible, { FastifySensibleOptions } from "@fastify/sensible";

export default fp<FastifySensibleOptions>(async (fastify) => {
  await fastify.register(sensible);
});
