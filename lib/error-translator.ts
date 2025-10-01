/**
 * Translates technical error messages into human-readable, actionable messages
 */

export interface HumanReadableError {
  title: string
  message: string
  suggestions: string[]
  technicalDetails?: string
}

export function translateError(error: Error | string): HumanReadableError {
  const errorMessage = typeof error === 'string' ? error : error.message
  const lowerError = errorMessage.toLowerCase()

  // Connection refused errors
  if (lowerError.includes('econnrefused') || lowerError.includes('connection refused')) {
    return {
      title: "Can't Connect to Redis Server",
      message: "The Redis server is not running or not accessible at the specified address.",
      suggestions: [
        "Make sure your Redis server is running",
        "Check if the host and port are correct",
        "Verify the server is listening on the specified port",
        "Try connecting from your terminal: redis-cli -h <host> -p <port>"
      ],
      technicalDetails: errorMessage
    }
  }

  // Timeout errors
  if (lowerError.includes('timeout') || lowerError.includes('etimedout')) {
    return {
      title: "Connection Timed Out",
      message: "The connection to Redis took too long to establish.",
      suggestions: [
        "Check your network connection",
        "Verify the host and port are correct",
        "Check if a firewall is blocking the connection",
        "Try increasing the connection timeout if possible"
      ],
      technicalDetails: errorMessage
    }
  }

  // Host not found errors
  if (lowerError.includes('enotfound') || lowerError.includes('host not found')) {
    return {
      title: "Host Not Found",
      message: "The Redis server hostname cannot be resolved.",
      suggestions: [
        "Check if the hostname is spelled correctly",
        "Verify the hostname exists and is accessible",
        "Try using an IP address instead of a hostname",
        "Check your DNS settings"
      ],
      technicalDetails: errorMessage
    }
  }

  // Authentication errors
  if (lowerError.includes('noauth') || lowerError.includes('authentication required')) {
    return {
      title: "Authentication Required",
      message: "The Redis server requires a password for authentication.",
      suggestions: [
        "Enter the correct password in the password field",
        "Check with your Redis administrator for the correct credentials",
        "Verify that authentication is enabled on the server"
      ],
      technicalDetails: errorMessage
    }
  }

  if (lowerError.includes('wrongpass') || lowerError.includes('invalid password')) {
    return {
      title: "Invalid Password",
      message: "The password you entered is incorrect.",
      suggestions: [
        "Double-check the password spelling and case",
        "Ask your Redis administrator for the correct password",
        "Verify that the password hasn't been changed recently"
      ],
      technicalDetails: errorMessage
    }
  }

  // Database errors
  if (lowerError.includes('invalid database') || lowerError.includes('db index out of range')) {
    return {
      title: "Invalid Database",
      message: "The specified database number is not valid for this Redis instance.",
      suggestions: [
        "Use database 0 (default) if unsure",
        "Check how many databases are configured on your Redis server",
        "Verify the database number is within the allowed range (usually 0-15)"
      ],
      technicalDetails: errorMessage
    }
  }

  // Permission errors
  if (lowerError.includes('permission denied') || lowerError.includes('access denied')) {
    return {
      title: "Permission Denied",
      message: "You don't have permission to access this Redis server.",
      suggestions: [
        "Check with your Redis administrator for proper access rights",
        "Verify your user account has the necessary permissions",
        "Make sure you're connecting to the correct Redis instance"
      ],
      technicalDetails: errorMessage
    }
  }

  // SSL/TLS errors
  if (lowerError.includes('ssl') || lowerError.includes('tls') || lowerError.includes('certificate')) {
    return {
      title: "SSL/TLS Connection Error",
      message: "There was a problem with the secure connection to Redis.",
      suggestions: [
        "Check if the Redis server requires SSL/TLS",
        "Verify the SSL certificate is valid",
        "Contact your Redis administrator about SSL configuration"
      ],
      technicalDetails: errorMessage
    }
  }

  // Network errors
  if (lowerError.includes('network') || lowerError.includes('unreachable')) {
    return {
      title: "Network Error",
      message: "There was a problem with the network connection.",
      suggestions: [
        "Check your internet connection",
        "Verify the Redis server is accessible from your network",
        "Try connecting from a different network if possible"
      ],
      technicalDetails: errorMessage
    }
  }

  // Redis command errors
  if (lowerError.includes('wrong number of arguments') || lowerError.includes('syntax error')) {
    return {
      title: "Command Error",
      message: "The Redis command you entered has incorrect syntax or arguments.",
      suggestions: [
        "Check the command syntax in Redis documentation",
        "Verify the number of arguments is correct",
        "Make sure all required parameters are provided"
      ],
      technicalDetails: errorMessage
    }
  }

  if (lowerError.includes('operation not permitted') || lowerError.includes('readonly')) {
    return {
      title: "Operation Not Allowed",
      message: "This operation is not permitted on this Redis instance.",
      suggestions: [
        "Check if the Redis server is in read-only mode",
        "Verify you have write permissions",
        "Contact your Redis administrator for access rights"
      ],
      technicalDetails: errorMessage
    }
  }

  // Memory errors
  if (lowerError.includes('out of memory') || lowerError.includes('oom')) {
    return {
      title: "Out of Memory",
      message: "The Redis server has run out of memory.",
      suggestions: [
        "Free up some memory on the Redis server",
        "Increase the Redis server's memory limit",
        "Contact your Redis administrator to resolve this issue"
      ],
      technicalDetails: errorMessage
    }
  }

  // URI parsing errors
  if (lowerError.includes('invalid redis uri') || lowerError.includes('invalid protocol')) {
    return {
      title: "Invalid Redis URI",
      message: "The Redis connection URI format is incorrect.",
      suggestions: [
        "Use redis:// for unencrypted connections or rediss:// for TLS connections",
        "Check the URI format: redis://[username:password@]host:port[/database]",
        "Ensure special characters in passwords are URL-encoded",
        "Verify the host and port are correct",
        "Try using the form method instead if URI parsing continues to fail"
      ],
      technicalDetails: errorMessage
    }
  }

  // Max retries errors (common with cloud providers)
  if (lowerError.includes('maxretriesperrequesterror') || lowerError.includes('reached the max retries')) {
    return {
      title: "Connection Retry Limit Exceeded",
      message: "The connection to Redis failed after multiple attempts. This often happens with cloud Redis providers.",
      suggestions: [
        "Check if your Redis provider requires SSL/TLS (enable TLS in connection settings)",
        "Verify your connection credentials are correct",
        "Try increasing connection timeout settings",
        "Check if your IP address is whitelisted on the Redis server",
        "Ensure your network allows outbound connections to the Redis port"
      ],
      technicalDetails: errorMessage
    }
  }

  // Generic connection errors
  if (lowerError.includes('connection') && (lowerError.includes('closed') || lowerError.includes('lost'))) {
    return {
      title: "Connection Lost",
      message: "The connection to Redis was unexpectedly closed.",
      suggestions: [
        "Try reconnecting to Redis",
        "Check if the Redis server is still running",
        "Verify your network connection is stable"
      ],
      technicalDetails: errorMessage
    }
  }

  // Default fallback for unknown errors
  return {
    title: "Connection Error",
    message: "An unexpected error occurred while connecting to Redis.",
    suggestions: [
      "Check your connection details (host, port, password)",
      "Verify the Redis server is running and accessible",
      "Try connecting from your terminal to test the connection",
      "Contact your Redis administrator if the problem persists"
    ],
    technicalDetails: errorMessage
  }
}

/**
 * Formats error messages for display in the UI
 */
export function formatErrorForUI(error: Error | string): string {
  const translated = translateError(error)
  return translated.message
}

/**
 * Gets detailed error information for troubleshooting
 */
export function getDetailedErrorInfo(error: Error | string): HumanReadableError {
  return translateError(error)
}
