import 'dotenv/config';
import express from 'express';
import promClient from 'prom-client';
import jwt from 'jsonwebtoken';
import typeDefs from './src/schema/auth.schema.js';
import { resolvers } from './src/resolvers/auth.resolver.js';
import { ApolloServer } from '@apollo/server';
import { authController } from './src/controller/auth.controller.js'

const app = express();
const { verify } = jwt;

const server = new ApolloServer({
  typeDefs,
  resolvers,
});

app.use('/api/auth', authController);

app.get('/metrics', async (req, res) => {
  res.set('Content-Type', promClient.register.contentType);
  res.end(await promClient.register.metrics());
});

app.listen(4001, () =>
  console.log('Prometheus metrics available at http://localhost:4001/metrics')
);
