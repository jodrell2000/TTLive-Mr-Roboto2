import * as winston from 'winston'
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

// Get current date in YYYY-MM-DD format for the filename
const getLogFileName = () => {
  const date = new Date()
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}.log`
}

export const logger = createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: combine(
    timestamp(),
    customFormat
  ),
  transports: [
    // Console transport for development
    new transports.Console(),
    // File transport for persistent logging
    new transports.File({
      filename: path.join(logsDir, getLogFileName()),
      maxsize: 5242880, // 5MB
      maxFiles: 30,
      tailable: true
    })
  ]
})
