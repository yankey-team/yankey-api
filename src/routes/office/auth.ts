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
        required: ['name', 'loyaltyPercentage', 'admin'],
        properties: {
          name: { type: 'string' },
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
      const { name, loyaltyPercentage, admin } = request.body;
      const merchantModel = new MerchantModel();


      const host = request.headers.host?.toLowerCase();
      if (!host) {
        return { error: "Host header is required" }
      }

      // I am getting host like demo.yankey.local:3000, but It should be without port.
      const domain = host.includes(':') ? host.split(':')[0] : host;

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

      const operatorModel = new OperatorModel(merchant.id);

      // Create admin operator (role: owner)
      const operatorResult = await operatorModel.createOperator({
        username: admin.username,
        password: bcryptjs.hashSync(admin.password, 10),
        displayName: merchant.domain,
        role: 'owner',
      });
      if (operatorResult.error || !operatorResult.data) {
        reply.code(500).send({ error: operatorResult.error || 'Could not create admin operator' });
        return;
      }
      const operator = operatorResult.data;

      const token = await reply.jwtSign({
        id: operator._id?.toString(),
        type: 'operator',
        merchantId: merchant.id,
        role: operator.role
      });
      return { data: { token, merchant, role: operator.role } };
    }
  });

  fastify.post<{ Body: OfficeSignInPayload }>('/auth/signin', {
    schema: {
      description: 'Sign in to merchant office',
      tags: ['office'],
      body: {
        type: 'object',
        required: ['username', 'password'],
        properties: {
          username: { type: 'string' },
          password: { type: 'string' },
        }
      }
    },
    handler: async (request, reply) => {
      const { username, password } = request.body;
      const merchantModel = new MerchantModel();

      const host = request.headers.host?.toLowerCase();
      if (!host) {
        return { error: "Host header is required" }
      }

      // I am getting host like demo.yankey.local:3000, but It should be without port.
      const domain = host.includes(':') ? host.split(':')[0] : host;

      const { data: merchant } = await merchantModel.getMerchantByDomain(domain);
      if (!merchant) {
        reply.code(404).send({ error: 'Merchant not found' });
        return;
      }
      console.log("merchant:", merchant);
      const operatorModel = new OperatorModel(merchant.id);

      const { data: operator } = await operatorModel.findByUsername(username);
      if (!operator) {
        reply.code(401).send({ error: 'Invalid credentials' });
        return;
      }
      if (!bcryptjs.compareSync(password, operator.password)) {
        reply.code(401).send({ error: 'Invalid credentials' });
        return;
      }
      if (operator.role !== 'owner') {
        reply.code(403).send({ error: 'Forbidden: Only owner can access office APIs' });
        return;
      }
      const token = await reply.jwtSign({
        id: operator._id?.toString(),
        type: 'operator',
        merchantId: merchant.id,
        role: operator.role
      });
      return { data: { token, merchant, role: operator.role } };
    }
  });
};

export default officeAuth;