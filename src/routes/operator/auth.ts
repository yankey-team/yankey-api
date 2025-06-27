import { FastifyInstance } from 'fastify';
import bcryptjs from 'bcryptjs';
import { OperatorAuthPayload } from '../../types/data';
import { OperatorModel } from '../../database/client/operator/operator.model';

const operatorAuthRoutes = async (fastify: FastifyInstance) => {
  fastify.post<{ Body: OperatorAuthPayload }>(
    '/auth/login',
    {
      schema: {
        description: 'Authenticate operator using username and password',
        tags: ['operator'],
        body: {
          type: 'object',
          required: ['username', 'password'],
          properties: {
            username: { type: 'string' },
            password: { type: 'string' }
          }
        },
        response: {
          200: {
            type: 'object',
            properties: {
              data: {
                type: 'object',
                properties: {
                  token: { type: 'string' }
                }
              }
            }
          },
          401: {
            type: 'object',
            properties: {
              error: { type: 'string' }
            }
          }
        }
      },
      handler: async (request, reply) => {
        try {
          const { username, password } = request.body;
          const operatorModel = new OperatorModel(request.merchant.id);
          const { data: operator } = await operatorModel.findByUsername(username);

          if (!operator) {
            return reply.code(401).send({ error: 'Invalid credentials' });
          }

          const passwordMatch = await bcryptjs.compare(password, operator.password);
          if (!passwordMatch) {
            return reply.code(401).send({ error: 'Invalid credentials' });
          }

          const token = await reply.jwtSign({
            id: operator._id.toString(),
            type: 'operator',
            merchantId: request.merchant.id,
          });

          return reply.send({ data: { token } });
        } catch (err) {
          request.log.error(err, 'Operator login failed');
          return reply.code(500).send({ error: 'Internal server error' });
        }
      }
    }
  );
}

export default operatorAuthRoutes;