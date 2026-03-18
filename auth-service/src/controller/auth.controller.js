import express from 'express';
import { ApolloServer } from '@apollo/server';
import typeDefs from '../schema/auth.schema.js'
import { resolvers } from '../resolvers/auth.resolver.js';
import { makeExecutableSchema } from '@graphql-tools/schema';
import jwt from 'jsonwebtoken';
import { ApolloServerPluginLandingPageLocalDefault } from '@apollo/server/plugin/landingPage/default';
import { trace, context, propagation } from '@opentelemetry/api';


const router = express.Router();
const tracer = trace.getTracer('auth-service');

router.use(async (req, res, next) => {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.replace('Bearer ', '');
  req.userId = null;

  if (token) {
    try {
      const payload = jwt.verify(token, process.env.JWT_SECRET);
      req.userId = payload.userId;
    } catch (e) {
      console.warn('Invalid token', e.message);
    }
  }
  next();
});

router.post('/', async (req, res) => {
  const ctx = propagation.extract(context.active(), req.headers);
  const span = tracer.startSpan('AuthGraphQLOperation', undefined, ctx);

  try {
    const schema = makeExecutableSchema({ typeDefs, resolvers });
    const server = new ApolloServer({ schema,
      plugins: [
        ApolloServerPluginLandingPageLocalDefault(), 
      ],
    });

    await server.start();

    const { query, variables } = req.body;

    const result = await context.with(trace.setSpan(ctx, span), async () => {
      return server.executeOperation({
        query,
        variables,
        context: { userId: req.userId },
      });
    });

    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    span.end();
  }
});

export default router;
