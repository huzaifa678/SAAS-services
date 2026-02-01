require('dotenv').config();
const { ApolloServer } = require('apollo-server');
const typeDefs = require('./graphql/schema');
const resolvers = require('./graphql/resolvers');

const server = new ApolloServer({
  typeDefs,
  resolvers,
  context: ({ req }) => {
    const authHeader = req.headers.authorization || '';
    const token = authHeader.replace('Bearer ', '');
    let userId = null;
    if (token) {
      try {
        const payload = require('jsonwebtoken').verify(token, process.env.JWT_SECRET);
        userId = payload.userId;
      } catch (e) {}
    }
    return { userId };
  },
});

app.get('/metrics', async (req, res) => {
  res.set('Content-Type', promClient.register.contentType);
  res.end(await promClient.register.metrics());
});

server.listen({ port: 8080 }).then(({ url }) => {
  console.log(`Auth GraphQL service ready at ${url}`);
});
