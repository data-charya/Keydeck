<div align="center">

![KeyDeck Logo](public/logo-dark.svg#gh-light-mode-only)
![KeyDeck Logo](public/logo-white.svg#gh-dark-mode-only)

### Cache command simplified

A modern, web-based Redis management interface built with Next.js and TypeScript. Connect, browse, and manage your Redis instances with ease.

[![Next.js](https://img.shields.io/badge/Next.js-15-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-38B2AC?style=for-the-badge&logo=tailwind-css)](https://tailwindcss.com/)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react)](https://react.dev/)

</div>

---

## 📋 Table of Contents

- [✨ Features](#-features)
- [🚀 Quick Start](#-quick-start)
- [💎 Why KeyDeck?](#-why-keydeck)
- [📸 Screenshots](#-screenshots)
- [🔧 Usage](#-usage)
- [🎯 Supported Redis Commands](#-supported-redis-commands)
- [🏗️ Project Structure](#️-project-structure)
- [🌍 Environment Variables](#-environment-variables)
- [🚀 Deployment](#-deployment)
- [🛡️ Security Features](#️-security-features)
- [🎨 Tech Stack](#-tech-stack)
- [🗺️ Roadmap](#️-roadmap)
- [🤝 Contributing](#-contributing)
- [📄 License](#-license)
- [🔧 Troubleshooting](#-troubleshooting)
- [❓ FAQ](#-faq)
- [🆘 Support](#-support)
- [🙏 Acknowledgments](#-acknowledgments)

---

## ✨ Features

<table>
<tr>
<td width="50%">

### 🔌 **Smart Connection Management**
- **Encrypted Profiles** - AES-256-GCM encrypted connection storage
- **Persistent Connections** - Save and restore connections automatically
- **Passphrase Protection** - Secure your credentials with a master passphrase
- **Connection Diagnostics** - Built-in troubleshooting tools
- **Multiple Databases** - Switch between Redis databases seamlessly
- **Offline Support** - IndexedDB storage works without internet

</td>
<td width="50%">

### 🔍 **Advanced Key Browser**
- **Real-time Search** - Find keys instantly with live filtering
- **Type Support** - All Redis data types (String, Hash, List, Set, ZSet, Stream)
- **Visual Indicators** - Color-coded type badges and metadata
- **Bulk Operations** - Copy, delete, and manage keys efficiently
- **TTL Management** - View and modify key expiration times
- **Key Statistics** - Analyze key distribution and patterns

</td>
</tr>
<tr>
<td width="50%">

### 💻 **Redis Console**
- **Command History** - Navigate through previous commands
- **Auto-completion** - Smart suggestions for Redis commands
- **Syntax Highlighting** - Beautiful command formatting
- **Error Handling** - Clear error messages and debugging
- **Command Reference** - Built-in command documentation
- **Multi-line Support** - Execute complex commands

</td>
<td width="50%">

### 📊 **Performance Monitoring**
- **Real-time Stats** - Live memory usage and performance metrics
- **Interactive Charts** - Visualize Redis performance over time
- **Hit Ratio Tracking** - Monitor cache efficiency
- **Key Distribution** - Understand your data structure
- **Memory Analysis** - Track memory usage patterns
- **Connection Health** - Monitor connection status and latency

</td>
</tr>
<tr>
<td width="50%">

### 🧬 **Schema Advisor**
- **Pattern Detection** - Automatically discover key naming patterns
- **Usage Analysis** - Identify most used patterns and data types
- **Memory Insights** - Estimate memory usage by pattern
- **Smart Recommendations** - Get suggestions for schema optimization
- **Visual Reports** - Interactive pattern analysis

</td>
<td width="50%">

### 📺 **Stream Viewer**
- **Stream Support** - Native Redis Streams visualization
- **Real-time Updates** - Monitor stream entries as they arrive
- **Consumer Groups** - Manage stream consumer groups
- **Message Inspection** - View and analyze stream messages
- **Filtering** - Search and filter stream entries

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
cd keydeck

# Install dependencies
pnpm install

# Start development server
pnpm dev

# Or use Docker Compose
docker-compose up
```

Open [http://localhost:3000](http://localhost:3000) in your browser 🎉

---

## 💎 Why KeyDeck?

KeyDeck stands out from other Redis management tools with its unique focus on **security**, **user experience**, and **modern architecture**:

### 🔐 Security First
Unlike traditional Redis GUIs that store credentials in plain text or use basic encoding, KeyDeck implements **military-grade AES-256-GCM encryption** for all connection profiles. Your credentials are encrypted with a passphrase that never leaves your device.

### 🌐 Web-Based, Works Everywhere
No installation required. Access your Redis instances from any modern browser. Works on Windows, macOS, Linux, tablets, and even your phone.

### 💾 Offline Capable
Once you save your encrypted profiles, KeyDeck works completely offline. Your connection credentials are stored in IndexedDB, accessible without an internet connection.

### 🎨 Beautiful & Modern UI
Built with Next.js 15, React 19, and Tailwind CSS 4, KeyDeck features a gorgeous, responsive interface with dark mode support. Every interaction is smooth and intuitive.

### 🧬 Intelligent Schema Analysis
The built-in Schema Advisor automatically discovers key naming patterns, analyzes data type distribution, and provides optimization recommendations - something most Redis tools lack.

### 🚀 Built for Developers
- **Real-time command autocomplete** with intelligent suggestions
- **Stream viewer** for Redis Streams (perfect for event-driven architectures)
- **Connection diagnostics** to troubleshoot connection issues
- **Beautiful data visualization** with interactive charts
- **Keyboard shortcuts** for power users

### 🔒 Privacy Focused
- Zero telemetry or analytics
- No external API calls (except to your Redis server)
- All encryption happens in your browser
- Your data never touches our servers

---

## 📸 Screenshots

<details>
<summary><strong>Click to view screenshots</strong></summary>

### Dashboard Overview
Beautiful, modern interface with real-time metrics and performance monitoring.

### Key Browser
Intuitive key browser with real-time search, type indicators, and TTL information.

### Redis Console
Powerful console with command history, autocomplete, and syntax highlighting.

### Encrypted Profiles
Securely save your Redis connections with AES-256-GCM encryption.

### Schema Advisor
Intelligent schema analysis that discovers patterns and provides optimization recommendations.

### Stream Viewer
Native support for Redis Streams with real-time updates.

> **Note:** Replace placeholder text with actual screenshots of your application.

</details>

---

## 🔧 Usage

### 1. **Connect to Redis**

#### Quick Connection
Enter your Redis connection details:
- **Host**: Your Redis server's public IP or domain name
- **Port**: `6379` (default Redis port)
- **Password**: Optional authentication
- **Database**: `0` (default database)

> **⚠️ Important:** Deployed versions can only connect to **remote Redis servers** accessible from the internet. Local Redis connections are blocked by browser security policies.

#### Encrypted Profiles (Recommended)
Save your connections securely with encrypted profiles:
1. Navigate to **Settings** → **Encrypted Connection Profiles**
2. Click **Create Profile**
3. Enter your Redis connection details
4. Set a strong passphrase (AES-256-GCM encryption)
5. Click **Create & Save**

Your profiles are encrypted and stored locally using IndexedDB. When you reload the app, enter your passphrase to unlock all saved connections.

**Benefits:**
- 🔐 **AES-256-GCM encryption** for credentials
- 💾 **Offline-capable** - works without internet
- 🚫 **Never sent to server** - 100% client-side
- 🔑 **Passphrase-protected** - only you can access

### 2. **Browse Your Data**
- **Search keys** with real-time filtering
- **Click any key** to view and edit its value
- **See metadata** like TTL, size, and type
- **Manage keys** with copy/delete actions
- **View streams** with the Stream Viewer

### 3. **Execute Commands**
- **Type Redis commands** directly in the console
- **Use arrow keys** to navigate command history
- **Get instant feedback** with formatted responses
- **Access command reference** for help

### 4. **Analyze Your Schema**
- **Run Schema Advisor** to discover key patterns
- **See usage statistics** by pattern
- **Get recommendations** for optimization
- **Estimate memory** usage by pattern

### 5. **Monitor Performance**
- **View real-time stats** in the dashboard
- **Track memory usage** and hit ratios
- **Analyze key distribution** by type
- **Monitor connection health** and latency

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

### Stream Operations
- `XADD`, `XREAD`, `XRANGE`, `XLEN`, `XINFO`, `XGROUP`

### Server Commands
- `PING`, `INFO`, `DBSIZE`, `KEYS`, `FLUSHDB`, `FLUSHALL`, `CONFIG`

### Connection Commands
- `SELECT`, `CLIENT`, `AUTH`, `QUIT`

</details>

---

## 🏗️ Project Structure

```
keydeck/
├── 📁 app/                           # Next.js App Router
│   ├── 📁 api/
│   │   ├── 📁 redis/                # Redis API endpoints
│   │   │   ├── connect/            # Connection management
│   │   │   ├── diagnostics/        # Connection diagnostics
│   │   │   ├── execute/            # Command execution
│   │   │   ├── keys/               # Key operations
│   │   │   ├── schema-advisor/     # Schema analysis
│   │   │   ├── stats/              # Performance stats
│   │   │   └── stream/             # Stream operations
│   │   ├── csrf/                   # CSRF protection
│   │   └── security/               # Security endpoints
│   ├── 🎨 globals.css              # Global styles
│   ├── 📄 layout.tsx               # Root layout
│   └── 📄 page.tsx                 # Main application
├── 📁 components/                   # React components
│   ├── 📁 ui/                      # shadcn/ui components
│   ├── 🔌 connection-config.tsx
│   ├── 🔐 encrypted-profiles-manager.tsx
│   ├── 📊 dashboard-overview.tsx
│   ├── 🔍 key-browser.tsx
│   ├── 👁️ key-value-viewer.tsx
│   ├── 💻 redis-console.tsx
│   ├── 🧬 schema-advisor.tsx
│   ├── 📺 stream-viewer.tsx
│   └── 🛡️ security-settings.tsx
├── 📁 hooks/                       # Custom React hooks
│   ├── use-encrypted-profiles.ts
│   ├── use-schema-advisor.ts
│   └── use-theme.ts
├── 📁 lib/                         # Utility functions
│   ├── 🔐 crypto.ts                # Encryption utilities
│   ├── 🔒 connection-encryption.ts # Profile encryption
│   ├── 💾 connection-profiles-storage.ts # IndexedDB storage
│   ├── 🔗 redis.ts                 # Redis client management
│   ├── 🛡️ api-security.ts         # API security middleware
│   ├── 📖 redis-commands.ts       # Command definitions
│   └── 🛠️ utils.ts                 # General utilities
├── 📁 public/                      # Static assets
│   ├── 🖼️ logo-dark.svg
│   └── 🖼️ logo-white.svg
└── 📁 scripts/                     # Helper scripts
    └── start-redis.sh
```

---

## 🌍 Environment Variables

KeyDeck can be configured using environment variables:

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `NODE_ENV` | Environment mode | `development` | No |
| `ALLOWED_ORIGINS` | Comma-separated list of allowed origins | localhost urls | Production |
| `IS_WEB_DEPLOYMENT` | Set to `true` for web deployments | `false` | No |
| `REDIS_GUI_API_KEY` | Optional API key for additional security | - | No |
| `DISABLE_ORIGIN_CHECK` | Disable origin checking (dev only) | `false` | No |
| `SCHEMA_ADVISOR_MAX_KEYS` | Max keys for schema analysis (production) | `50000` | No |
| `SCHEMA_ADVISOR_MAX_KEYS_WEB` | Max keys for schema analysis (web) | `10000` | No |
| `SCHEMA_ADVISOR_MAX_KEYS_DEV` | Max keys for schema analysis (dev) | `100000` | No |
| `RATE_LIMIT_WINDOW_MS` | Rate limit window in milliseconds | `900000` | No |
| `RATE_LIMIT_MAX_REQUESTS` | Max requests per window | `100` | No |

### Example Configuration

**.env.local** (Development):
```bash
NODE_ENV=development
```

**.env.production** (Production):
```bash
NODE_ENV=production
ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
SCHEMA_ADVISOR_MAX_KEYS=50000
REDIS_GUI_API_KEY=your-secure-random-key
```

**.env** (Web Deployment - Vercel/Netlify):
```bash
NODE_ENV=production
IS_WEB_DEPLOYMENT=true
ALLOWED_ORIGINS=https://yourapp.vercel.app
SCHEMA_ADVISOR_MAX_KEYS_WEB=10000
```

---

## 🚀 Deployment

### Vercel / Netlify Deployment

Deploy to Vercel or Netlify with one click, then configure environment variables:

```bash
# Required: Add your production domain
ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com

# Deployment type (for web deployments)
IS_WEB_DEPLOYMENT=true
NODE_ENV=production

# Optional: Schema Advisor limits
SCHEMA_ADVISOR_MAX_KEYS_WEB=10000
```

**Important:** After deployment, add your production domain to `ALLOWED_ORIGINS` to avoid CORS errors.

### Docker Deployment

```bash
# Using Docker Compose
docker-compose up -d

# Or build manually
docker build -t keydeck .
docker run -p 3000:3000 \
  -e ALLOWED_ORIGINS=https://yourdomain.com \
  keydeck
```

### Self-Hosted Production

For production deployments on your own infrastructure:

```bash
# Install dependencies
pnpm install

# Build the application
pnpm build

# Start the production server
pnpm start
```

**Environment Variables:**

```bash
# Production configuration
NODE_ENV=production
ALLOWED_ORIGINS=https://yourdomain.com

# Optional: Custom schema limits
SCHEMA_ADVISOR_MAX_KEYS=50000

# Optional: API security
REDIS_GUI_API_KEY=your-secure-key
```

### Redis Server Setup

**Option 1: Cloud Redis**
- AWS ElastiCache, DigitalOcean, Redis Cloud, etc.
- Ensure it's accessible from your deployment
- Use encrypted connections (TLS/SSL)

**Option 2: Self-Hosted Redis**
```bash
# Using Docker
docker run -d \
  --name redis \
  -p 6379:6379 \
  redis:7-alpine redis-server --requirepass yourpassword

# Using the included script
./scripts/start-redis.sh
```

**Option 3: Local Development**
```bash
# Install Redis locally
brew install redis  # macOS
apt install redis   # Ubuntu

# Start Redis
redis-server
```

### Security Checklist

- ✅ Always use HTTPS in production
- ✅ Set `ALLOWED_ORIGINS` with your domains
- ✅ Use strong Redis passwords
- ✅ Enable TLS/SSL for Redis connections
- ✅ Regularly update dependencies
- ✅ Review connection logs
- ✅ Use encrypted profiles for sensitive credentials

For detailed production setup instructions, see [PRODUCTION_SETUP.md](PRODUCTION_SETUP.md).

---

## 🛡️ Security Features

### Client-Side Security
- **🔐 AES-256-GCM Encryption** - Military-grade encryption for connection profiles
- **🔑 PBKDF2 Key Derivation** - 100,000 iterations with SHA-256
- **💾 IndexedDB Storage** - Secure, offline-capable local storage
- **🔒 Passphrase Protection** - Master passphrase never stored or transmitted
- **🚫 Zero Server Storage** - All credentials encrypted client-side only

### API Security
- **🛡️ CSRF Protection** - Built-in CSRF token validation
- **🌐 Origin Verification** - Strict origin checking for API requests
- **⏱️ Rate Limiting** - Configurable request rate limits
- **🔐 Optional API Keys** - Additional API key authentication layer
- **📝 Security Headers** - Comprehensive security headers configured

### Connection Security
- **🔌 TLS/SSL Support** - Encrypted Redis connections supported
- **🔄 Session Management** - Automatic connection cleanup and timeout
- **🧹 Memory Cleanup** - Secure credential cleanup from memory
- **📊 Connection Masking** - Sensitive connection details hidden in UI
- **🔍 Connection Diagnostics** - Built-in troubleshooting without exposing credentials

### Best Practices
- All encryption happens in your browser
- Credentials never transmitted to external servers
- Passphrase required on every session
- Encrypted profiles persist across browser sessions
- Secure context (HTTPS or localhost) enforced

For more details on encrypted profiles, see [README_ENCRYPTED_PROFILES.md](README_ENCRYPTED_PROFILES.md).

---

## 🎨 Tech Stack

<table>
<tr>
<td align="center" width="16%">

![Next.js](https://img.shields.io/badge/Next.js-15-black?style=flat-square&logo=next.js)
**Next.js 15**
App Router & Server Actions

</td>
<td align="center" width="16%">

![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=flat-square&logo=typescript)
**TypeScript 5**
Type Safety

</td>
<td align="center" width="16%">

![React](https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react)
**React 19**
Modern UI Library

</td>
<td align="center" width="16%">

![Tailwind CSS](https://img.shields.io/badge/Tailwind-4-38B2AC?style=flat-square&logo=tailwind-css)
**Tailwind CSS 4**
Utility-first styling

</td>
<td align="center" width="16%">

![Radix UI](https://img.shields.io/badge/Radix_UI-Latest-161618?style=flat-square)
**Radix UI**
Accessible primitives

</td>
<td align="center" width="16%">

![ioredis](https://img.shields.io/badge/ioredis-5-DC382D?style=flat-square&logo=redis)
**ioredis**
Redis client

</td>
</tr>
</table>

### Additional Libraries

- **shadcn/ui** - Beautiful, reusable UI components
- **Recharts** - Interactive data visualization
- **Lucide React** - Modern icon library
- **Web Crypto API** - Client-side encryption
- **IndexedDB** - Persistent local storage
- **Zod** - TypeScript-first schema validation
- **React Hook Form** - Performant form management
- **next-themes** - Dark mode support
- **Sonner** - Toast notifications

---

## 🗺️ Roadmap

### Coming Soon
- [ ] **Redis Cluster Support** - Connect to Redis clusters
- [ ] **Pub/Sub Viewer** - Monitor Redis pub/sub channels in real-time
- [ ] **Transaction Builder** - Visual interface for Redis transactions
- [ ] **Export/Import** - Export keys to JSON/CSV and import back
- [ ] **Bulk Operations** - Advanced bulk key operations
- [ ] **Custom Commands** - Save and organize frequently used commands
- [ ] **Multi-Connection** - Manage multiple Redis connections simultaneously
- [ ] **Performance Profiling** - Advanced performance analysis tools

### Under Consideration
- [ ] Redis Sentinel support
- [ ] RedisJSON module support
- [ ] RediSearch integration
- [ ] Mobile apps (iOS/Android)
- [ ] Collaborative features (team workspaces)
- [ ] Command scheduling/automation
- [ ] Backup and restore functionality

Have a feature request? [Open an issue](https://github.com/data-charya/Keydeck/issues) or start a [discussion](https://github.com/data-charya/Keydeck/discussions)!

---

## 🤝 Contributing

We welcome contributions! Here's how you can help:

### Getting Started

1. **🍴 Fork** the repository
2. **📥 Clone** your fork: `git clone https://github.com/your-username/keydeck.git`
3. **📦 Install** dependencies: `pnpm install`
4. **🌿 Create** a feature branch: `git checkout -b feature/amazing-feature`
5. **💻 Make** your changes
6. **✅ Test** your changes thoroughly
7. **💾 Commit** your changes: `git commit -m 'Add amazing feature'`
8. **📤 Push** to your fork: `git push origin feature/amazing-feature`
9. **🔀 Open** a Pull Request

### Development Guidelines

**Code Style:**
- Follow TypeScript best practices
- Use Tailwind CSS for styling (avoid custom CSS)
- Follow the existing component structure
- Use meaningful variable and function names
- Keep components small and focused

**Commit Messages:**
- Use clear, descriptive commit messages
- Start with a verb (Add, Fix, Update, Remove, etc.)
- Reference issue numbers when applicable

**Testing:**
- Test your changes in multiple browsers
- Test with different Redis versions
- Verify encrypted profiles still work
- Check responsive design on mobile

**Documentation:**
- Update README if you add features
- Add JSDoc comments for complex functions
- Update type definitions as needed

### Areas We Need Help With

- 🐛 Bug fixes
- ✨ New features (see Roadmap)
- 📖 Documentation improvements
- 🌍 Internationalization (i18n)
- ♿ Accessibility improvements
- 🎨 UI/UX enhancements
- 🧪 Testing and test coverage

---

## 📄 License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

### What This Means:

- ✅ **Commercial use** - Use KeyDeck in commercial projects
- ✅ **Modification** - Modify the source code
- ✅ **Distribution** - Distribute your own version
- ✅ **Private use** - Use privately without sharing
- ⚠️ **Liability** - Software is provided "as is" without warranty
- 📝 **License notice** - Include the license and copyright notice

**TL;DR:** You can do almost anything with KeyDeck as long as you include the original license and copyright notice.

---

## 🔧 Troubleshooting

### Common Issues

#### "Failed to connect to Redis"
**Possible causes:**
- Redis server is not running
- Incorrect host/port/password
- Firewall blocking the connection
- Redis not configured to accept external connections

**Solutions:**
1. Check Redis is running: `redis-cli ping`
2. Verify connection details
3. Check Redis configuration: `redis-cli CONFIG GET bind`
4. Ensure Redis accepts connections from your IP
5. Use the built-in Connection Diagnostics tool

#### "Unauthorized origin" error
**Solution:**
Add your domain to `ALLOWED_ORIGINS` environment variable. See [PRODUCTION_SETUP.md](PRODUCTION_SETUP.md) for details.

#### "Encryption not supported"
**Possible causes:**
- Using HTTP instead of HTTPS
- Browser doesn't support Web Crypto API
- Running in an insecure context

**Solutions:**
1. Use HTTPS or localhost
2. Update to a modern browser
3. Check browser console for specific errors

#### "Invalid passphrase"
**Solutions:**
- Double-check your passphrase spelling
- Ensure Caps Lock is off
- Try typing in a text editor first to verify

#### Schema Advisor taking too long
**Solutions:**
- Reduce `SCHEMA_ADVISOR_MAX_KEYS` limit
- Run during off-peak hours
- Use the key pattern filter to analyze specific keys

#### High memory usage
**Solutions:**
- Close unused connections
- Clear browser cache
- Reduce the number of keys displayed
- Use key pagination features

### Getting Debug Information

To help us troubleshoot your issue:

1. Open browser Developer Tools (F12)
2. Go to Console tab
3. Reproduce the issue
4. Copy any error messages
5. Include in your GitHub issue

---

## ❓ FAQ

### Can I use this with Redis Cloud / AWS ElastiCache?
Yes! KeyDeck works with any Redis instance that's accessible over the network. Just provide the connection details (host, port, password).

### Is my data safe?
Absolutely. All encryption happens in your browser using Web Crypto API. Your credentials never leave your device and are never sent to any server. We use AES-256-GCM encryption, which is military-grade security.

### What if I forget my passphrase?
Unfortunately, if you forget your passphrase, your encrypted profiles cannot be recovered. This is by design - we have no way to decrypt your profiles without the passphrase. Consider backing up important connection details separately.

### Can I use this in production?
Yes! KeyDeck is production-ready. Make sure to:
- Set proper environment variables (see [PRODUCTION_SETUP.md](PRODUCTION_SETUP.md))
- Use HTTPS in production
- Configure `ALLOWED_ORIGINS` correctly
- Use strong Redis passwords

### Does this support Redis Cluster?
Currently, KeyDeck supports single Redis instances and standalone servers. Cluster support is planned for a future release.

### Can I connect to local Redis from a deployed version?
No. Browser security policies (CORS) prevent deployed web applications from connecting to localhost. You have two options:
1. Run KeyDeck locally to connect to local Redis
2. Deploy Redis to a remote server accessible from the internet

### What browsers are supported?
KeyDeck works in all modern browsers that support:
- Web Crypto API (for encryption)
- IndexedDB (for local storage)
- ES2020+ JavaScript features

Tested on: Chrome, Firefox, Safari, Edge (all latest versions)

### How do I update my Redis version?
KeyDeck is compatible with Redis 5.0+. Simply update your Redis server - KeyDeck will automatically work with the new version.

### Can I self-host this?
Yes! You can self-host KeyDeck on your own infrastructure. See the [Deployment](#-deployment) section for instructions.

---

## 🆘 Support

Need help? Here's where to find it:

- **📚 Documentation**: This README, [PRODUCTION_SETUP.md](PRODUCTION_SETUP.md), and [README_ENCRYPTED_PROFILES.md](README_ENCRYPTED_PROFILES.md)
- **🐛 Bug Reports**: [GitHub Issues](https://github.com/data-charya/Keydeck/issues)
- **💡 Feature Requests**: [GitHub Discussions](https://github.com/data-charya/Keydeck/discussions)
- **💬 Questions**: Open a GitHub issue with the `question` label

### Reporting Issues

When reporting bugs, please include:
- **KeyDeck version** (check package.json)
- **Redis version** and configuration
- **Browser** and version
- **Operating system**
- **Error messages** and stack traces
- **Steps to reproduce** the issue
- **Screenshots** (if applicable)

---

## 🙏 Acknowledgments

KeyDeck is built on the shoulders of giants. Special thanks to:

- **[Redis](https://redis.io/)** - The amazing in-memory data store
- **[ioredis](https://github.com/luin/ioredis)** - Robust Redis client for Node.js
- **[Next.js](https://nextjs.org/)** - The React framework that powers KeyDeck
- **[shadcn/ui](https://ui.shadcn.com/)** - Beautiful, accessible component library
- **[Radix UI](https://www.radix-ui.com/)** - Unstyled, accessible UI primitives
- **[Tailwind CSS](https://tailwindcss.com/)** - Utility-first CSS framework
- **[Vercel](https://vercel.com/)** - Platform for modern web applications

And to all our contributors and users who make this project better every day! ❤️

---

<div align="center">

### 🌟 Star History

[![Star History Chart](https://api.star-history.com/svg?repos=data-charya/Keydeck&type=Date)](https://star-history.com/data-charya/Keydeck&Date)

---

**Made with ❤️ for the Redis community**

[⭐ Star this repo](https://github.com/data-charya/Keydeck) • [🐛 Report Bug](https://github.com/data-charya/Keydeck/issues) • [💡 Request Feature](https://github.com/data-charya/Keydeck/issues) • [📖 Documentation](https://github.com/data-charya/Keydeck/wiki)

---

### Support the Project

If KeyDeck helps you manage Redis better, consider:
- ⭐ Starring the repository
- 🐦 Sharing on social media
- 🤝 Contributing to the project
- ☕ [Buy me a coffee](https://buymeacoffee.com/shanwill)

---

**KeyDeck** - Cache command simplified

Copyright © 2025 - Present

</div>
