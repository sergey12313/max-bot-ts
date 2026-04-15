declare module 'debug' {
  type DebugLogger = ((formatter: unknown, ...args: unknown[]) => void) & {
    enabled?: boolean;
  };

  export default function debug(namespace: string): DebugLogger;
}
