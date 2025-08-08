import * as winston from 'winston'
import 'winston-daily-rotate-file'
import fs from 'fs'
import path from 'path'

const { createLogger, format, transports } = winston.default
const { combine, timestamp, printf } = format

// Ensure logs directory exists
const logsDir = path.join(process.cwd(), 'logs')
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true })
}

// Custom format for logs
const customFormat = printf(({ level, message, timestamp }) => {
  return `${timestamp} [${level.toUpperCase()}]: ${message}`
})

export const logger = createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: combine(
    timestamp(),
    customFormat
  ),
  transports: [
    // Console transport for development
    // new transports.Console(),
    
    // Daily rotating file transport
    new winston.transports.DailyRotateFile({
      dirname: logsDir,
      filename: '%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      maxSize: '5m',
      maxFiles: 30
    })
  ],
  // Explicitly disable console output
  silent: process.env.NODE_ENV === 'production',
  exitOnError: false
})