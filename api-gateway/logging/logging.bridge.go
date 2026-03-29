package logging

import (
	"context"
	"fmt"

	"go.opentelemetry.io/otel/log"
	"go.opentelemetry.io/otel/log/global"
)

type OTelKitLogger struct {
	logger log.Logger
}

func NewOTelKitLogger(serviceName string) *OTelKitLogger {
	return &OTelKitLogger{
		logger: global.GetLoggerProvider().Logger(serviceName), // using global logger from open-telementry
	}
}

func (l *OTelKitLogger) Log(keyvals ...interface{}) error {
	record := log.Record{}
	
	for i := 0; i < len(keyvals); i += 2 {
		if i+1 >= len(keyvals) {
			break 
		}

		key := fmt.Sprintf("%v", keyvals[i])
		val := keyvals[i+1]
		
		if key == "msg" {
			record.SetBody(log.StringValue(fmt.Sprintf("%v", val)))
		} else {
			record.AddAttributes(log.KeyValue{
				Key:   key, 
				Value: log.StringValue(interfaceToString(val)),
			})
		}
	}
	
	l.logger.Emit(context.Background(), record)
	return nil
}

func interfaceToString(v interface{}) string {
	switch v := v.(type) {
	case string: return v
	case error: return v.Error()
	default: return "" + fmt.Sprintf("%v", v)
	}
}