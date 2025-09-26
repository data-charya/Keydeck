# Redash

A modern, web-based Redis management interface built with Next.js and TypeScript. This application provides a user-friendly way to connect to Redis instances, browse keys, execute commands, and monitor performance.

## Features

- **Real-time Connection**: Connect to Redis instances with configurable host, port, password, and database settings
- **Key Browser**: Browse, search, and manage Redis keys with support for all data types (string, hash, list, set, zset)
- **Redis Console**: Execute Redis commands directly with syntax highlighting and command history
- **Performance Monitoring**: Real-time statistics including memory usage, hit ratios, and key type distribution
- **Modern UI**: Clean, responsive interface built with Tailwind CSS and Radix UI components

## Getting Started

### Prerequisites

- Node.js 18+ 
- Redis server running locally or remotely
- npm or pnpm package manager

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd redis-gui
```

2. Install dependencies:
```bash
npm install
# or
pnpm install
```

3. Start the development server:
```bash
npm run dev
# or
pnpm dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

### Connecting to Redis

1. On the connection screen, enter your Redis connection details:
   - **Host**: Redis server hostname (default: localhost)
   - **Port**: Redis server port (default: 6379)
   - **Password**: Redis password (optional)
   - **Database**: Redis database number (default: 0)

2. Click "Connect to Redis" to establish the connection

## Usage

### Key Browser
- View all keys in your Redis database
- Search and filter keys by name
- Click on any key to view its details and value
- Edit key values directly in the interface
- Delete keys with confirmation

### Redis Console
- Execute Redis commands directly
- Command history with arrow key navigation
- Auto-completion for common Redis commands
- Copy commands and responses to clipboard

### Dashboard Overview
- Real-time Redis server statistics
- Memory usage and performance metrics
- Key type distribution charts
- Hit/miss ratio monitoring

## Supported Redis Commands

The console supports most common Redis commands including:

- **String operations**: GET, SET, DEL, EXISTS, TYPE, TTL, EXPIRE
- **Hash operations**: HGET, HSET, HGETALL, HDEL
- **List operations**: LPUSH, RPUSH, LRANGE, LLEN
- **Set operations**: SADD, SMEMBERS, SCARD
- **Sorted Set operations**: ZADD, ZRANGE, ZCARD
- **Server commands**: PING, INFO, DBSIZE, KEYS, FLUSHDB, FLUSHALL

## Data Types

The application supports all Redis data types:

- **String**: Simple key-value pairs
- **Hash**: Field-value mappings
- **List**: Ordered collections of strings
- **Set**: Unordered collections of unique strings
- **Sorted Set**: Sets with associated scores

## Security Considerations

- Connection credentials are stored in browser session storage
- No credentials are permanently stored on the server
- Always use secure connections (Redis AUTH) in production environments
- Consider using Redis ACLs for fine-grained access control

## Development

### Project Structure

```
├── app/                    # Next.js app directory
│   ├── api/redis/         # API routes for Redis operations
│   ├── globals.css        # Global styles
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Main application page
├── components/            # React components
│   ├── ui/               # Reusable UI components
│   ├── connection-config.tsx
│   ├── dashboard-overview.tsx
│   ├── key-browser.tsx
│   ├── key-value-viewer.tsx
│   └── redis-console.tsx
├── hooks/                # Custom React hooks
├── lib/                  # Utility functions
│   ├── redis.ts          # Redis client management
│   └── utils.ts          # General utilities
└── styles/               # Additional styles
```

### Key Technologies

- **Next.js 14**: React framework with App Router
- **TypeScript**: Type-safe JavaScript
- **Tailwind CSS**: Utility-first CSS framework
- **Radix UI**: Accessible component primitives
- **ioredis**: Redis client for Node.js
- **Lucide React**: Icon library

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is open source and available under the [MIT License](LICENSE).

## Support

For issues and questions:
1. Check the existing issues on GitHub
2. Create a new issue with detailed information
3. Include Redis version and error messages when reporting bugs
