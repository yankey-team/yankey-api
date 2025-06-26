import fp from 'fastify-plugin';
import { FastifyRequest, FastifyReply } from 'fastify';

// Use consistent property name: telegramId

declare module 'fastify' {
  interface FastifyRequest {
    telegramId: string;
  }
}

export default fp(async (fastify) => {
  fastify.decorateRequest('telegramId', '');

  fastify.addHook('preHandler', async (request: FastifyRequest, reply: FastifyReply) => {
    // Skip telegram verification for non-user routes and documentation
    if (!request.url.startsWith('/user') || request.url.startsWith('/docs')) {
      return;
    }

    const telegramKey = request.headers['x-telegram-key'];
    const telegramUserId = request.headers['x-telegram-user-id'];

    if (!telegramKey || !telegramUserId) {
      reply.code(401).send({ error: 'Telegram credentials are required' });
      return;
    }

    if (telegramKey !== request.merchant.telegramKey) {
      reply.code(401).send({ error: 'Invalid telegram key' });
      return;
    }

    request.telegramId = telegramUserId as string;
  });
});