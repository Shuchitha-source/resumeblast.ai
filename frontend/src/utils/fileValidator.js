import { APP_CONFIG, ERROR_MESSAGES, FILE_MIME_TYPES } from '../constants'

export const validateFile = (file) => {
  const errors = []

  // Check if file exists
  if (!file) {
    errors.push(ERROR_MESSAGES.NO_RESUME)
    return { isValid: false, errors }
  }

  // Check file size
  if (file.size === 0) {
    errors.push(ERROR_MESSAGES.FILE_EMPTY)
  }

  if (file.size > APP_CONFIG.MAX_FILE_SIZE) {
    errors.push(ERROR_MESSAGES.FILE_TOO_LARGE)
  }

  // Check file type
  const fileName = file.name.toLowerCase()
  const isValidType = APP_CONFIG.SUPPORTED_FILE_TYPES.some(type =>
    fileName.endsWith(type)
  )

  if (!isValidType) {
    errors.push(ERROR_MESSAGES.INVALID_FILE_TYPE)
  }

  return {
    isValid: errors.length === 0,
    errors,
    fileInfo: {
      name: file.name,
      size: file.size,
      type: file.type,
      extension: fileName.split('.').pop()
    }
  }
}

export const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
}