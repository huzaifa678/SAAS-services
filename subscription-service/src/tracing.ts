import { NodeSDK } from '@opentelemetry/sdk-node';
import { getNodeAutoInstrumentations} from '@opentelemetry/auto-instrumentations-node';
import { GrpcInstrumentation } from '@opentelemetry/instrumentation-grpc';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { resourceFromAttributes } from '@opentelemetry/resources';
import { ATTR_SERVICE_NAME } from '@opentelemetry/semantic-conventions';


const sdk = new NodeSDK({
  resource: resourceFromAttributes({
    [ATTR_SERVICE_NAME]: 'subscription-service', 
  }),
  traceExporter: new OTLPTraceExporter({
    url:
      process.env.OTEL_EXPORTER_OTLP_ENDPOINT ||
      'http://localhost:43180/v1/traces', 
  }),
  instrumentations: [getNodeAutoInstrumentations(),
    new GrpcInstrumentation()
  ],
});

sdk.start();

process.on('SIGTERM', async () => {
  await sdk.shutdown();
});

