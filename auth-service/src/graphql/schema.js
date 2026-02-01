const { sign, verify } = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const prisma = require('../db/prisma');

const resolvers = {
  Query: {
    me: async (_, __, { userId }) => {
      if (!userId) return null;
      return prisma.user.findUnique({ where: { id: userId } });
    },
  },

  Mutation: {
    register: async (_, { email, password }) => {
      const hashed = await bcrypt.hash(password, 10);
      return prisma.user.create({
        data: { email, password: hashed },
      });
    },

    login: async (_, { email, password }) => {
      const user = await prisma.user.findUnique({ where: { email } });
      if (!user) throw new Error('Invalid credentials');

      const valid = await bcrypt.compare(password, user.password);
      if (!valid) throw new Error('Invalid credentials');

      const accessToken = sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: process.env.ACCESS_TOKEN_TTL });
      const refreshToken = sign({ userId: user.id }, process.env.JWT_REFRESH_SECRET, { expiresIn: process.env.REFRESH_TOKEN_TTL });

      await prisma.refreshToken.create({
        data: {
          token: refreshToken,
          userId: user.id,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
        },
      });

      return { accessToken, refreshToken, user };
    },

    refreshToken: async (_, { token }) => {
      let payload;
      try {
        payload = verify(token, process.env.JWT_REFRESH_SECRET);
      } catch (err) {
        throw new Error('Invalid refresh token');
      }

      const storedToken = await prisma.refreshToken.findUnique({ where: { token } });
      if (!storedToken) throw new Error('Refresh token revoked');

      const accessToken = sign({ userId: payload.userId }, process.env.JWT_SECRET, { expiresIn: process.env.ACCESS_TOKEN_TTL });
      const refreshToken = sign({ userId: payload.userId }, process.env.JWT_REFRESH_SECRET, { expiresIn: process.env.REFRESH_TOKEN_TTL });

      await prisma.refreshToken.delete({ where: { token } });
      await prisma.refreshToken.create({
        data: {
          token: refreshToken,
          userId: payload.userId,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        },
      });

      const user = await prisma.user.findUnique({ where: { id: payload.userId } });
      return { accessToken, refreshToken, user };
    },

    logout: async (_, { token }) => {
      await prisma.refreshToken.deleteMany({ where: { token } });
      return true;
    },
  },

  User: {
    refreshTokens: (parent) => prisma.refreshToken.findMany({ where: { userId: parent.id } }),
  },
};

module.exports = resolvers;

