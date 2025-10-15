export type LogFields = Record<string, unknown>;

function format(fields?: LogFields): string {
  if (!fields) return '';
  try {
    return ' ' + JSON.stringify(fields);
  } catch {
    return '';
  }
}

export const logger = {
  info(msg: string, fields?: LogFields) {
    console.log(`[INFO] ${new Date().toISOString()} ${msg}${format(fields)}`);
  },
  error(msg: string, fields?: LogFields) {
    console.error(`[ERROR] ${new Date().toISOString()} ${msg}${format(fields)}`);
  },
  warn(msg: string, fields?: LogFields) {
    console.warn(`[WARN] ${new Date().toISOString()} ${msg}${format(fields)}`);
  },
};


