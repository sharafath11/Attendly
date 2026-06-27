import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });
dotenv.config();

type LogLevel = "info" | "warn" | "error" | "debug";

class ProductionLogger {
  private isProduction = process.env.NODE_ENV === "production";
  private logLevel: LogLevel = (process.env.LOG_LEVEL as LogLevel) || "info";

  private levels: Record<LogLevel, number> = {
    debug: 0,
    info: 1,
    warn: 2,
    error: 3,
  };

  private shouldLog(level: LogLevel): boolean {
    return this.levels[level] >= this.levels[this.logLevel];
  }

  private formatMessage(level: LogLevel, message: string, meta?: any): string {
    const timestamp = new Date().toISOString();
    if (this.isProduction) {
      return JSON.stringify({
        timestamp,
        level,
        message,
        ...(meta ? { meta } : {}),
      });
    } else {
      const metaStr = meta ? ` | Meta: ${JSON.stringify(meta)}` : "";
      const color = level === "error" ? "\x1b[31m" : level === "warn" ? "\x1b[33m" : level === "debug" ? "\x1b[36m" : "\x1b[32m";
      const reset = "\x1b[0m";
      return `${color}[${timestamp}] [${level.toUpperCase()}]${reset} ${message}${metaStr}`;
    }
  }

  public info(message: string, meta?: any) {
    if (this.shouldLog("info")) {
      console.log(this.formatMessage("info", message, meta));
    }
  }

  public warn(message: string, meta?: any) {
    if (this.shouldLog("warn")) {
      console.warn(this.formatMessage("warn", message, meta));
    }
  }

  public error(message: string, meta?: any) {
    if (this.shouldLog("error")) {
      console.error(this.formatMessage("error", message, meta));
    }
  }

  public debug(message: string, meta?: any) {
    if (this.shouldLog("debug")) {
      console.log(this.formatMessage("debug", message, meta));
    }
  }
}

export const logger = new ProductionLogger();
