import 'dotenv/config';
// Minimal OpenTelemetry SDK wiring (stubs, no exporters by default)
// Extend with @opentelemetry/sdk-node and OTLP exporter in production if needed.

export function initTracing() {
  // no-op placeholder to avoid heavy deps for now
  // In production, initialize NodeSDK here and register global provider.
}


