import winston from 'winston';
import { trace, context } from '@opentelemetry/api';

const isProd = process.env.NODE_ENV === 'production';
const SERVICE_NAME = process.env.OTEL_SERVICE_NAME || 'auth-service';

const addTraceContext = winston.format((info) => {
  const span = trace.getSpan(context.active());
  if (span) {
    const ctx = span.spanContext();
    info.trace_id = ctx.traceId;
    info.span_id = ctx.spanId;
  }

  info.severity = info.level;
  info['service.version'] = process.env.SERVICE_VERSION || '1.0.0';
  info['deployment.environment'] = process.env.NODE_ENV;
  return info;
});

const jsonFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.errors({ stack: true }),
  addTraceContext(),
  winston.format.json()
);

const devFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  addTraceContext(),
  winston.format.printf(({ timestamp, level, message, trace_id, span_id, ...meta }) => {
    let msg = `${timestamp} [${level}]: ${message}`;
    if (trace_id) msg += ` trace_id=${trace_id} span_id=${span_id}`;
    if (Object.keys(meta).length > 0) msg += ` ${JSON.stringify(meta)}`;
    return msg;
  })
);

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: isProd ? jsonFormat : devFormat,
  transports: [new winston.transports.Console()],
});

logger.stream = {
  write: (msg) => logger.info(msg.trim()),
};

export default logger;