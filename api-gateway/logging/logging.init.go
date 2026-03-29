package logging

import (
	"context"

	"go.opentelemetry.io/otel/log/global"
	sdklog "go.opentelemetry.io/otel/sdk/log"
	stdoutlog "go.opentelemetry.io/otel/exporters/stdout/stdoutlog"
)


func InitLogger() func(context.Context) error {
	exporter, _ := stdoutlog.New(stdoutlog.WithPrettyPrint())

	provider := sdklog.NewLoggerProvider(
		sdklog.WithProcessor(sdklog.NewBatchProcessor(exporter)),
	)

	global.SetLoggerProvider(provider)

	return provider.Shutdown
}