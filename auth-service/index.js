import 'dotenv/config';
import express from 'express';
import promClient from 'prom-client';
import router from '../auth-service/src/controller/auth.controller.js'

const app = express();
app.use(express.json());

app.use('/api/auth', router);

app.get('/metrics', async (req, res) => {
  res.set('Content-Type', promClient.register.contentType);
  res.end(await promClient.register.metrics());
});

app.listen(8080, () => {
  console.log("listening to port 8080")
})

app.listen(4001, () =>
  console.log('Prometheus metrics available at http://localhost:4001/metrics')
);
