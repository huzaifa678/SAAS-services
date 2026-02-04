import './tracing.js';
import 'dotenv/config';
import express from 'express';
import promClient from 'prom-client';
import router from '../auth-service/src/controller/auth.controller.js';
import http from 'http';

const app = express();
const metricsApp = express();


const METRICS_PORT = 4001;

app.use(express.json());
app.use('/api/auth', router);

app.get('/metrics', async (req, res) => {
  res.set('Content-Type', promClient.register.contentType);
  res.end(await promClient.register.metrics());
});

const server = http.createServer(app);
const metricsServer = http.createServer(metricsApp);

metricsServer.listen(METRICS_PORT, () => {
  console.log(`Prometheus metrics available at http://localhost:${METRICS_PORT}/metrics`);
});

const PORT = process.env.PORT;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

const shutdownSignals = ['SIGINT', 'SIGTERM', 'SIGHUP', 'SIGQUIT'];

shutdownSignals.forEach(sig => {
  process.on(sig, () => {
    console.log(`Received ${sig}, shutting down gracefully...`);

    server.close(err => {
      if (err) {
        console.error('Error during server shutdown', err);
        process.exit(1);
      }

      console.log('Server closed gracefully');
      process.exit(0);
    })

    setTimeout(() => {
      console.warn('Forcing shutdown...');
      process.exit(1);
    }, 5000);
  })
})
