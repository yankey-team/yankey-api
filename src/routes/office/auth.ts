import { FastifyPluginAsync } from 'fastify';
import bcryptjs from 'bcryptjs';
import { OfficeSignUpPayload, OfficeSignInPayload } from '../../types/data';
import { MerchantModel } from '../../database/admin/merchant/merchant.model';
import { OperatorModel } from '../../database/client/operator/operator.model';

const officeAuth: FastifyPluginAsync = async (fastify): Promise<void> => {
  fastify.post<{ Body: OfficeSignUpPayload }>('/auth/signup', {
    schema: {
      description: 'Create new merchant and admin account',
      tags: ['office'],
      body: {
        type: 'object',
        required: ['name', 'domain', 'loyaltyPercentage', 'admin'],
        properties: {
          name: { type: 'string' },
          domain: { type: 'string' },
          loyaltyPercentage: { type: 'number' },
          admin: {
            type: 'object',
            required: ['username', 'password', 'displayName'],
            properties: {
              username: { type: 'string' },
              password: { type: 'string' },
              displayName: { type: 'string' }
            }
          }
        }
      }
    },
    handler: async (request, reply) => {
      const { name, domain, loyaltyPercentage, admin } = request.body;
      const merchantModel = new MerchantModel();
      const operatorModel = new OperatorModel('');

      // Check if domain exists
      const { data: existingMerchant } = await merchantModel.getMerchantByDomain(domain);
      if (existingMerchant) {
        reply.code(400).send({ error: 'Domain already exists' });
        return;
      }

      // Create merchant
      const merchantResult = await merchantModel.createMerchant({
        name,
        domain,
        loyaltyPercentage
      });
      if (merchantResult.error || !merchantResult.data) {
        reply.code(500).send({ error: merchantResult.error || 'Could not create merchant' });
        return;
      }
      const merchant = merchantResult.data;
      const merchantId = merchant._id?.toString();

      // Create admin operator
      const operatorResult = await operatorModel.createOperator({
        username: admin.username,
        password: bcryptjs.hashSync(admin.password, 10),
        displayName: admin.displayName,
      });
      if (operatorResult.error || !operatorResult.data) {
        reply.code(500).send({ error: operatorResult.error || 'Could not create admin operator' });
        return;
      }
      const operator = operatorResult.data;

      const token = await reply.jwtSign({
        id: operator._id?.toString(),
        type: 'operator',
        merchantId: merchantId
      });

      return { token, merchant };
    }
  });

  fastify.post<{ Body: OfficeSignInPayload }>('/auth/signin', {
    schema: {
      description: 'Sign in to merchant office',
      tags: ['office'],
      body: {
        type: 'object',
        required: ['username', 'password', 'domain'],
        properties: {
          username: { type: 'string' },
          password: { type: 'string' },
          domain: { type: 'string' }
        }
      }
    },
    handler: async (request, reply) => {
      const { username, password, domain } = request.body;
      const merchantModel = new MerchantModel();
      const operatorModel = new OperatorModel('');

      const { data: merchant } = await merchantModel.getMerchantByDomain(domain);
      if (!merchant) {
        reply.code(404).send({ error: 'Merchant not found' });
        return;
      }
      const merchantId = merchant._id?.toString();

      const { data: operator } = await operatorModel.findByUsername(username);
      if (!operator) {
        reply.code(401).send({ error: 'Invalid credentials' });
        return;
      }
      if (!bcryptjs.compareSync(password, operator.password)) {
        reply.code(401).send({ error: 'Invalid credentials' });
        return;
      }

      const token = await reply.jwtSign({
        id: operator._id?.toString(),
        type: 'operator',
        merchantId: merchantId
      });

      return { token, merchant };
    }
  });
};

export default officeAuth;