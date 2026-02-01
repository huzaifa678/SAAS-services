import express from 'express';
import { ApolloServer } from '@apollo/server';
import typeDefs from '../schema/auth.schema.js'
import { resolvers } from '../resolvers/auth.resolver.js';
import { makeExecutableSchema } from '@graphql-tools/schema';
import jwt from 'jsonwebtoken';

const router = express.Router();

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
  try {
    const schema = makeExecutableSchema({ typeDefs, resolvers });
    const server = new ApolloServer({ schema });
    await server.start();

    const { query, variables } = req.body;

    const result = await server.executeOperation({
      query,
      variables,
      context: { userId: req.userId },
    });

    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
