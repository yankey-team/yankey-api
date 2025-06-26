import { FastifyPluginAsync } from 'fastify';
import { TransactionModel } from '../../database/client/transaction/transaction.model';
import { UserModel } from '../../database/client/user/user.model';
import operatorAuthRoutes from './auth';

interface SearchQuery {
  last4: string;
}

interface PurchaseBody {
  amount: number;
  userId: string;
}

const operator: FastifyPluginAsync = async (fastify): Promise<void> => {
  fastify.register(operatorAuthRoutes);

  fastify.get<{ Querystring: SearchQuery }>('/operator/search-users', {
    schema: {
      description: 'Search users by last 4 digits of phone number',
      tags: ['operator'],
      security: [{ bearerAuth: [] }],
      querystring: {
        type: 'object',
        required: ['last4'],
        properties: {
          last4: { 
            type: 'string', 
            description: 'Last 4 digits of phone number',
            minLength: 4, 
            maxLength: 4 
          }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            users: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  displayName: { type: 'string' },
                  phoneNumber: { type: 'string' },
                  telegram_id: { type: 'string' },
                  balance: { type: 'number' }
                }
              }
            }
          }
        }
      }
    },
    onRequest: [fastify.authenticate('operator')],
    handler: async (request) => {
      const { last4 } = request.query;
      const userModel = new UserModel(request.merchant.id);
      const { data: users, error } = await userModel.searchByLast4(request.merchant.id, last4);
      if (error) throw new Error(error);
      const safeUsers = users || [];
      return {
        users: safeUsers.map(u => ({
          id: u._id?.toString(),
          displayName: u.displayName,
          phoneNumber: u.phoneNumber,
          telegram_id: u.telegramId,
          balance: 0
        }))
      };
    }
  });

  fastify.post<{ Body: PurchaseBody }>('/operator/transaction', {
    schema: {
      description: 'Create a new purchase and apply cashback',
      tags: ['operator'],
      security: [{ bearerAuth: [] }],
      body: {
        type: 'object',
        required: ['amount', 'userId'],
        properties: {
          amount: { type: 'number' },
          userId: { type: 'string' }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            purchase: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                amount: { type: 'number' },
                userId: { type: 'string' },
                operatorId: { type: 'string' },
                createdAt: { type: 'string', format: 'date-time' }
              }
            },
            cashback: { type: 'number' },
            newBalance: { type: 'number' }
          }
        }
      }
    },
    onRequest: [fastify.authenticate('operator')],
    handler: async (request, reply) => {
      const { amount, userId } = request.body;
      const userModel = new UserModel(request.merchant.id);
      const transactionModel = new TransactionModel(request.merchant.id);
      // Find user
      const { data: user } = await userModel.findUserById(userId);
      if (!user) {
        reply.code(404).send({ error: 'User not found' });
        return;
      }
      // Create transaction (purchase)
      const transactionData = {
        type: "check-in" as const,
        amount,
        userId: userId,
        operatorId: request.user.id,
        loyaltyPercentage: request.merchant.loyaltyPercentage
      };
      const { data: purchase, error: transactionError } = await transactionModel.createTransaction(transactionData);
      if (transactionError || !purchase) {
        reply.code(500).send({ error: transactionError || 'Could not create purchase' });
        return;
      }
      // Calculate cashback and new balance
      const cashback = (amount * request.merchant.loyaltyPercentage) / 100;
      // Optionally, update balance in user document if you store it
      const { data: balance } = await userModel.balance(userId);
      return {
        purchase: {
          id: (purchase as any)._id?.toString(),
          amount: purchase.amount,
          userId: purchase.userId,
          operatorId: purchase.operatorId,
          createdAt: (purchase as any).createdAt
        },
        cashback,
        newBalance: balance || 0
      };
    }
  });
};

export default operator;