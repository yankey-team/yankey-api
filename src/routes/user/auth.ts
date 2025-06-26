import { FastifyPluginAsync } from 'fastify';
import { UserAuthPayload } from '../../types/data';
import { UserModel } from '../../database/client/user/user.model';

const userAuthRoutes: FastifyPluginAsync = async (fastify): Promise<void> => {
  // User login
  fastify.post<{ Body: UserAuthPayload }>('/auth/login', {
    schema: {
      description: 'Authenticate user using display name and phone number',
      tags: ['user'],
      headers: {
        type: 'object',
        required: ['x-telegram-key', 'x-telegram-user-id'],
        properties: {
          'x-telegram-key': { 
            type: 'string',
            description: 'Telegram Bot API Key'
          },
          'x-telegram-user-id': { 
            type: 'string',
            description: 'Telegram User ID'
          }
        }
      },
      body: {
        type: 'object',
        required: ['displayName', 'phoneNumber'],
        properties: {
          displayName: { 
            type: 'string',
            description: 'User display name'
          },
          phoneNumber: { 
            type: 'string',
            description: 'User phone number'
          }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            token: { type: 'string' }
          }
        }
      }
    },
    handler: async (request, reply) => {
      const { displayName, phoneNumber } = request.body;
      const telegramId = request.headers['x-telegram-user-id'] as string;
      const userModel = new UserModel(request.merchant.id);
      let user;
      const { data: foundUser } = await userModel.findByTelegramId(telegramId);
      if (foundUser) {
        user = foundUser;
      } else {
        const { data: createdUser } = await userModel.createUserWithTelegram({ displayName, phoneNumber, telegramId });
        user = createdUser;
      }
      if (!user) {
        return reply.code(400).send({ error: 'User could not be created or found' });
      }
      const token = await reply.jwtSign({
        id: user.id.toString(),
        type: 'user',
        merchantId: request.merchant.id
      });
      return { token };
    }
  });
};

export default userAuthRoutes;