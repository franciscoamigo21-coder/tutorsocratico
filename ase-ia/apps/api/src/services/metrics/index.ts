/**
 * Métricas en memoria para observabilidad. M8: suficientes para un dashboard
 * básico y health checks. En producción se exportarían a Cloud Monitoring.
 */

interface Metrics {
  startedAt: number;
  totalRequests: number;
  byStatusClass: Record<string, number>; // "2xx", "4xx", "5xx"
  chatByResultado: Record<string, number>;
}

const metrics: Metrics = {
  startedAt: Date.now(),
  totalRequests: 0,
  byStatusClass: {},
  chatByResultado: {},
};

export function recordRequest(status: number): void {
  metrics.totalRequests += 1;
  const cls = `${Math.floor(status / 100)}xx`;
  metrics.byStatusClass[cls] = (metrics.byStatusClass[cls] ?? 0) + 1;
}

export function recordChatResult(resultado: string): void {
  metrics.chatByResultado[resultado] =
    (metrics.chatByResultado[resultado] ?? 0) + 1;
}

export function snapshot() {
  return {
    uptimeSeconds: Math.round((Date.now() - metrics.startedAt) / 1000),
    totalRequests: metrics.totalRequests,
    byStatusClass: metrics.byStatusClass,
    chatByResultado: metrics.chatByResultado,
  };
}
