import { FastifyPluginAsync } from 'fastify';
import { UserModel } from '../../database/client/user/user.model';
import userAuthRoutes from './auth';

const user: FastifyPluginAsync = async (fastify): Promise<void> => {
  fastify.register(userAuthRoutes);
  
  fastify.get('/user/balance', {
    schema: {
      description: 'Get user balance and merchant information',
      tags: ['user'],
      headers: {
        type: 'object',
        required: ['x-telegram-key', 'x-telegram-user-id'],
        properties: {
          'x-telegram-key': { type: 'string' },
          'x-telegram-user-id': { type: 'string' }
        }
      },
      security: [{ bearerAuth: [] }],
      response: {
        200: {
          type: 'object',
          properties: {
            balance: { type: 'number' },
            merchant: {
              type: 'object',
              properties: {
                name: { type: 'string' },
                loyaltyPercentage: { type: 'number' }
              }
            }
          }
        }
      }
    },
    onRequest: [fastify.authenticate('user')],
    handler: async (request, reply) => {
      const userModel = new UserModel(request.merchant.id);
      const { data: user, error } = await userModel.findByIdMerchantAndTelegram(
        request.user.id,
        request.merchant.id,
        request.telegramId
      );
      if (error || !user) {
        return { balance: 0 };
      }
      const { data: balance } = await userModel.balance(user._id.toString());
      return {
        balance: balance || 0,
        merchant: {
          name: request.merchant.name,
          loyaltyPercentage: request.merchant.loyaltyPercentage
        }
      };
    }
  });
};

export default user;