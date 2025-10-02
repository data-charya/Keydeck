# Production Setup Guide

## Quick Fix for "Unauthorized origin" Error

If you're getting an "Unauthorized origin" error in production, here are the solutions:

### Option 1: Set Environment Variables (Recommended)

Add these environment variables to your production deployment:

```bash
# Add your production domain to allowed origins
ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com

# Optional: Disable origin check temporarily for testing
DISABLE_ORIGIN_CHECK=true
```

### Option 2: Update Security Configuration

Edit `lib/security-config.ts` and add your production domain:

```typescript
allowedOrigins: [
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  'https://localhost:3000',
  'https://127.0.0.1:3000',
  'https://yourdomain.com',        // Add your domain here
  'https://www.yourdomain.com',    // Add www version if needed
  // ... rest of configuration
],
```

### Option 3: Temporary Bypass (Development Only)

For testing purposes, you can temporarily disable origin checking by setting:

```bash
DISABLE_ORIGIN_CHECK=true
```

**⚠️ Warning: Only use this for testing. Never disable origin checking in production without proper security measures.**

## Environment Variables for Production

Create a `.env.production` file or set these in your deployment platform:

```bash
# Required: Add your production domain
ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com

# Optional: API Security Key (generate a strong random key)
REDIS_GUI_API_KEY=your-very-secure-random-key-here

# Optional: Rate Limiting Configuration
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Optional: Disable origin check (NOT recommended for production)
# DISABLE_ORIGIN_CHECK=true
```

## Platform-Specific Instructions

### Vercel
1. Go to your project dashboard
2. Navigate to Settings > Environment Variables
3. Add `ALLOWED_ORIGINS` with your domain
4. Redeploy your application

### Netlify
1. Go to Site settings > Environment variables
2. Add `ALLOWED_ORIGINS` with your domain
3. Redeploy your site

### Docker
Add to your `docker-compose.yml` or Dockerfile:

```yaml
environment:
  - ALLOWED_ORIGINS=https://yourdomain.com
```

## Debugging

To see what origins are being blocked, check your server logs. The security middleware will log:
- The origin that was blocked
- The current allowed origins list

## Security Best Practices

1. **Always use HTTPS** in production
2. **Never disable origin checking** without understanding the security implications
3. **Use specific domains** instead of wildcards when possible
4. **Regularly review** your allowed origins list
5. **Monitor logs** for unauthorized access attempts

## Testing

After setting up the environment variables:

1. Deploy your application
2. Try accessing it from your production domain
3. Check the browser console for any security errors
4. Verify that API calls work correctly

If you're still having issues, check the server logs for the exact origin being blocked and add it to your allowed origins list.
