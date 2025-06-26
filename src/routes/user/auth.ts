import { FastifyPluginAsync } from 'fastify';
import { UserAuthPayload } from '../../types/data';
import { UserModel } from '../../database/client/user/user.model';

const userAuthRoutes: FastifyPluginAsync = async (fastify): Promise<void> => {
  // User login
  fastify.post<{ Body: UserAuthPayload }>('/auth/login', {
    schema: {
      description: 'Authenticate user using display name and phone number',
      tags: ['user'],
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
      const userModel = new UserModel(request.merchant.id);
      // Only create user, no telegram logic
      const { data: createdUser } = await userModel.createUser({ displayName, phoneNumber });
      if (!createdUser) {
        return reply.code(400).send({ error: 'User could not be created' });
      }
      const token = await reply.jwtSign({
        id: createdUser.id.toString(),
        type: 'user',
        merchantId: request.merchant.id
      });
      return { token };
    }
  });
};

export default userAuthRoutes;