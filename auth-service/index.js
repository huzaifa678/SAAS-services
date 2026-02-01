import 'dotenv/config';
import express from 'express';
import promClient from 'prom-client';
import jwt from 'jsonwebtoken';
import typeDefs from './src/schema/auth.schema.js';
import { resolvers } from './src/resolvers/auth.resolver.js';
import { ApolloServer } from '@apollo/server';
import { startStandaloneServer } from '@apollo/server/standalone';

const { verify } = jwt;

const server = new ApolloServer({
  typeDefs,
  resolvers,
});

startStandaloneServer(server, {
  listen: { port: 8080 },
  context: async ({ req }) => {
    const authHeader = req.headers.authorization || '';
    const token = authHeader.replace('Bearer ', '');
    let userId = null;

    if (token) {
      try {
        const payload = verify(token, process.env.JWT_SECRET);
        userId = payload.userId;
      } catch (e) {
        console.warn('Invalid token', e.message);
      }
    }

    return { userId };
  },
}).then(({ url }) => {
  console.log(`Auth GraphQL service ready at ${url}`);
});

const app = express();

app.get('/metrics', async (req, res) => {
  res.set('Content-Type', promClient.register.contentType);
  res.end(await promClient.register.metrics());
});

app.listen(4001, () =>
  console.log('Prometheus metrics available at http://localhost:4001/metrics')
);
