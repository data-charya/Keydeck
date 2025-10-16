<div align="center">

![KeyDeck Logo](public/logo-dark.svg#gh-light-mode-only)
![KeyDeck Logo](public/logo-white.svg#gh-dark-mode-only)

# KeyDeck
### Cache command simplified

A modern, web-based Redis management interface built with Next.js and TypeScript. Connect, browse, and manage your Redis instances with ease.

[![Next.js](https://img.shields.io/badge/Next.js-14-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3-38B2AC?style=for-the-badge&logo=tailwind-css)](https://tailwindcss.com/)
[![Redis](https://img.shields.io/badge/Redis-7-DC382D?style=for-the-badge&logo=redis)](https://redis.io/)

</div>

---

## ✨ Features

<table>
<tr>
<td width="50%">

### 🔌 **Smart Connection Management**
- **Persistent Connections** - Save and restore connections automatically
- **Secure Storage** - Encrypted credential storage with Web Crypto API
- **Connection Diagnostics** - Built-in troubleshooting tools
- **Multiple Databases** - Switch between Redis databases seamlessly

</td>
<td width="50%">

### 🔍 **Advanced Key Browser**
- **Real-time Search** - Find keys instantly with live filtering
- **Type Support** - All Redis data types (String, Hash, List, Set, ZSet)
- **Visual Indicators** - Color-coded type badges and metadata
- **Bulk Operations** - Copy, delete, and manage keys efficiently

</td>
</tr>
<tr>
<td width="50%">

### 💻 **Redis Console**
- **Command History** - Navigate through previous commands
- **Auto-completion** - Smart suggestions for Redis commands
- **Syntax Highlighting** - Beautiful command formatting
- **Error Handling** - Clear error messages and debugging

</td>
<td width="50%">

### 📊 **Performance Monitoring**
- **Real-time Stats** - Live memory usage and performance metrics
- **Interactive Charts** - Visualize Redis performance over time
- **Hit Ratio Tracking** - Monitor cache efficiency
- **Key Distribution** - Understand your data structure

</td>
</tr>
</table>

---

## 🚀 Quick Start

### Prerequisites

- **Node.js** 18+ 
- **Redis** server (local or remote)
- **npm** or **pnpm**

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd redis-gui

# Install dependencies
npm install
# or
pnpm install

# Start development server
npm run dev
# or
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser 🎉

---

## 🔧 Usage

### 1. **Connect to Redis**
Enter your Redis connection details:
- **Host**: Your Redis server's public IP or domain name
- **Port**: `6379` (default Redis port)
- **Password**: Optional authentication
- **Database**: `0` (default database)

> **⚠️ Important:** Deployed versions can only connect to **remote Redis servers** accessible from the internet. Local Redis connections are blocked by browser security policies.

### 2. **Browse Your Data**
- **Search keys** with real-time filtering
- **Click any key** to view and edit its value
- **See metadata** like TTL, size, and type
- **Manage keys** with copy/delete actions

### 3. **Execute Commands**
- **Type Redis commands** directly in the console
- **Use arrow keys** to navigate command history
- **Get instant feedback** with formatted responses

### 4. **Monitor Performance**
- **View real-time stats** in the dashboard
- **Track memory usage** and hit ratios
- **Analyze key distribution** by type

---

## 🎯 Supported Redis Commands

<details>
<summary><strong>Click to expand supported commands</strong></summary>

### String Operations
- `GET`, `SET`, `DEL`, `EXISTS`, `TYPE`, `TTL`, `EXPIRE`

### Hash Operations  
- `HGET`, `HSET`, `HGETALL`, `HDEL`, `HKEYS`, `HVALS`

### List Operations
- `LPUSH`, `RPUSH`, `LPOP`, `RPOP`, `LLEN`, `LRANGE`

### Set Operations
- `SADD`, `SREM`, `SMEMBERS`, `SCARD`, `SISMEMBER`

### Sorted Set Operations
- `ZADD`, `ZREM`, `ZRANGE`, `ZCARD`, `ZSCORE`

### Server Commands
- `PING`, `INFO`, `DBSIZE`, `KEYS`, `FLUSHDB`, `FLUSHALL`

</details>

---

## 🏗️ Project Structure

```
redis-gui/
├── 📁 app/                    # Next.js App Router
│   ├── 📁 api/redis/         # Redis API endpoints
│   ├── 🎨 globals.css        # Global styles
│   ├── 📄 layout.tsx         # Root layout
│   └── 📄 page.tsx           # Main application
├── 📁 components/            # React components
│   ├── 📁 ui/               # Reusable UI components
│   ├── 🔌 connection-config.tsx
│   ├── 📊 dashboard-overview.tsx
│   ├── 🔍 key-browser.tsx
│   ├── 👁️ key-value-viewer.tsx
│   └── 💻 redis-console.tsx
├── 📁 hooks/                # Custom React hooks
├── 📁 lib/                  # Utility functions
│   ├── 🔐 crypto.ts         # Encryption utilities
│   ├── 🔗 redis.ts          # Redis client management
│   └── 🛠️ utils.ts          # General utilities
└── 📁 public/               # Static assets
    ├── 🖼️ logo-dark.svg
    └── 🖼️ logo-white.svg
```

---

## 🚀 Deployment Options

### **Option 1: Remote Redis Server**
- Deploy your Redis server to a cloud provider (AWS, DigitalOcean, etc.)
- Make it accessible from the internet
- Use the public IP/domain in the deployed app

### **Option 2: Self-Hosted Application**
- Run this app locally on your machine
- Connect to local Redis instances
- Perfect for development and local testing

### **Option 3: Docker Compose**
```yaml
version: '3.8'
services:
  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
  
  redis-gui:
    build: .
    ports:
      - "3000:3000"
    environment:
      - REDIS_HOST=redis
```

---

## 🛡️ Security Features

- **🔐 Encrypted Storage** - Connection credentials encrypted with Web Crypto API
- **🔒 Secure Context** - Requires HTTPS or localhost for full encryption
- **💾 Fallback Storage** - Graceful degradation to base64 encoding
- **🚫 No Server Storage** - Credentials never stored on the server
- **🔄 Session Management** - Automatic connection cleanup

---

## 🎨 Tech Stack

<table>
<tr>
<td align="center" width="20%">

![Next.js](https://img.shields.io/badge/Next.js-14-black?style=flat-square&logo=next.js)
**Next.js 14**
App Router & SSR

</td>
<td align="center" width="20%">

![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=flat-square&logo=typescript)
**TypeScript**
Type Safety

</td>
<td align="center" width="20%">

![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3-38B2AC?style=flat-square&logo=tailwind-css)
**Tailwind CSS**
Utility-first styling

</td>
<td align="center" width="20%">

![Radix UI](https://img.shields.io/badge/Radix_UI-Primitives-161618?style=flat-square)
**Radix UI**
Accessible components

</td>
<td align="center" width="20%">

![ioredis](https://img.shields.io/badge/ioredis-5-2C3E50?style=flat-square)
**ioredis**
Redis client

</td>
</tr>
</table>

---

## 🤝 Contributing

We welcome contributions! Here's how you can help:

1. **🍴 Fork** the repository
2. **🌿 Create** a feature branch (`git checkout -b feature/amazing-feature`)
3. **💾 Commit** your changes (`git commit -m 'Add amazing feature'`)
4. **📤 Push** to the branch (`git push origin feature/amazing-feature`)
5. **🔀 Open** a Pull Request

### Development Guidelines

- Follow TypeScript best practices
- Use Tailwind CSS for styling
- Add proper error handling
- Include helpful comments
- Test your changes thoroughly

---

## 📄 License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

---

## 🆘 Support

Need help? Here's where to find it:

- **🐛 Bug Reports**: [GitHub Issues](https://github.com/your-repo/issues)
- **💡 Feature Requests**: [GitHub Discussions](https://github.com/your-repo/discussions)
- **📖 Documentation**: This README and inline code comments
- **💬 Questions**: Open a GitHub issue with the `question` label

### Reporting Issues

When reporting bugs, please include:
- **Redis version** and configuration
- **Browser** and version
- **Error messages** and stack traces
- **Steps to reproduce** the issue

---

<div align="center">

**Made with ❤️ for the Redis community**

[⭐ Star this repo](https://github.com/your-repo) • [🐛 Report Bug](https://github.com/your-repo/issues) • [💡 Request Feature](https://github.com/your-repo/issues)

</div>