import { NodeSDK } from '@opentelemetry/sdk-node';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { ATTR_SERVICE_NAME } from '@opentelemetry/semantic-conventions';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { OTLPLogExporter } from '@opentelemetry/exporter-logs-otlp-http';
import { BatchLogRecordProcessor } from '@opentelemetry/sdk-logs';
import { resourceFromAttributes } from '@opentelemetry/resources';
import { WinstonInstrumentation } from '@opentelemetry/instrumentation-winston';

const serviceName = process.env.OTEL_SERVICE_NAME || 'auth-service';

const sdk = new NodeSDK({
  resource: resourceFromAttributes({
    [ATTR_SERVICE_NAME]: serviceName,
  }),

  traceExporter: new OTLPTraceExporter({
    url:
      process.env.OTEL_EXPORTER_OTLP_ENDPOINT ||
      'http://localhost:43180/v1/traces',
  }),

  logRecordProcessor: new BatchLogRecordProcessor(
    new OTLPLogExporter({
      url:
        process.env.OTEL_EXPORTER_OTLP_LOGS_ENDPOINT ||
        'http://localhost:43180/v1/logs',
    })
  ),

  instrumentations: [
    getNodeAutoInstrumentations(),
    new WinstonInstrumentation({
      logHook: (span, record) => {
        if (span) {
          const ctx = span.spanContext();
          record.trace_id = ctx.traceId;
          record.span_id = ctx.spanId;
        }
        record['service.name'] = serviceName;
      },
    }),
  ],
});

sdk.start();

process.on('SIGTERM', async () => {
  await sdk.shutdown();
});
