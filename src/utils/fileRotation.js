import fs from 'fs'
import path from 'path'

/**
 * Utility functions for log file management
 */
export const fileRotation = {
  /**
   * Clean up old log files, keeping only the specified number of days
   * @param {string} logsDir - Directory containing log files
   * @param {number} daysToKeep - Number of days of logs to retain
   */
  cleanupOldLogs: (logsDir, daysToKeep = 30) => {
    try {
      if (!fs.existsSync(logsDir)) return

      const files = fs.readdirSync(logsDir)
      const now = new Date()

      files.forEach(file => {
        // Only process .log files with date format names
        if (!file.match(/^\d{4}-\d{2}-\d{2}\.log$/)) return

        const filePath = path.join(logsDir, file)
        const fileDate = new Date(
          file.substring(0, 4), // year
          parseInt(file.substring(5, 7)) - 1, // month (0-based)
          file.substring(8, 10) // day
        )

        // Calculate difference in days
        const diffTime = Math.abs(now - fileDate)
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

        if (diffDays > daysToKeep) {
          fs.unlinkSync(filePath)
          console.log(`Deleted old log file: ${file}`)
        }
      })
    } catch (error) {
      console.error(`Error cleaning up log files: ${error.message}`)
    }
  }
}
