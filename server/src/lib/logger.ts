import winston from "winston";
import path from "path";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });
dotenv.config();

const isProduction = process.env.NODE_ENV === "production";
const level = process.env.LOG_LEVEL || (isProduction ? "info" : "debug");

const logFormat = winston.format.combine(
  winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
  winston.format.errors({ stack: true }),
  isProduction ? winston.format.json() : winston.format.simple()
);

const logsDir = path.join(process.cwd(), "logs");

const transports: winston.transport[] = [
  new winston.transports.Console({
    format: isProduction
      ? winston.format.json()
      : winston.format.combine(
          winston.format.colorize(),
          winston.format.printf(({ timestamp, level, message, stack, ...meta }) => {
            const metaStr = Object.keys(meta).length ? ` | Meta: ${JSON.stringify(meta)}` : "";
            return `[${timestamp}] [${level}]: ${stack || message}${metaStr}`;
          })
        ),
  }),
  new winston.transports.File({
    filename: path.join(logsDir, "error.log"),
    level: "error",
    maxsize: 10 * 1024 * 1024, // 10MB
    maxFiles: 5,
  }),
  new winston.transports.File({
    filename: path.join(logsDir, "combined.log"),
    maxsize: 10 * 1024 * 1024, // 10MB
    maxFiles: 5,
  }),
];

export const logger = winston.createLogger({
  level,
  format: logFormat,
  transports,
});
