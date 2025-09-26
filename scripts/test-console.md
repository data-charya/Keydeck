# Testing Redis Console Functionality

This guide helps you test and debug the Redis console functionality.

## Quick Test Steps

### 1. Start Redis Server
Make sure Redis is running on your system:

**Option A: Using Docker**
```bash
docker run -d --name redis-test -p 6379:6379 redis:latest
```

**Option B: Using local Redis**
```bash
redis-server
```

### 2. Start the Application
```bash
npm run dev
```

### 3. Connect to Redis
1. Open http://localhost:3000
2. Enter connection details:
   - **Host**: localhost
   - **Port**: 6379
   - **Database**: 0
3. Click "Connect to Redis"

### 4. Test Console Commands
Go to the **Console** tab and try these commands:

**Basic Commands:**
```
PING
INFO
DBSIZE
```

**Key Operations:**
```
SET test:key "Hello World"
GET test:key
EXISTS test:key
TYPE test:key
TTL test:key
```

**Hash Operations:**
```
HSET user:1 name "John Doe" email "john@example.com"
HGETALL user:1
HGET user:1 name
```

**List Operations:**
```
LPUSH mylist "item1" "item2" "item3"
LRANGE mylist 0 -1
LLEN mylist
```

## Debugging Steps

### Check Browser Console
1. Open browser Developer Tools (F12)
2. Go to Console tab
3. Look for any error messages when:
   - Connecting to Redis
   - Executing commands
   - Switching connections

### Check Server Logs
Look at the terminal where you ran `npm run dev` for server-side logs:
- Connection attempts
- Command execution
- Redis client status

### Common Issues and Solutions

#### Issue: "Redis client not connected"
**Symptoms:**
- Console shows "Redis client not connected" error
- Commands fail to execute

**Solutions:**
1. Make sure you're connected to Redis first
2. Check if Redis server is running
3. Verify connection details (host, port, password)
4. Try reconnecting

#### Issue: Commands not executing
**Symptoms:**
- Commands appear to hang
- No response from Redis

**Solutions:**
1. Check Redis server is running: `redis-cli ping`
2. Verify network connectivity
3. Check Redis server logs
4. Try a simple command like `PING`

#### Issue: Connection restored but console doesn't work
**Symptoms:**
- Connection shows as active
- Console still shows "not connected"

**Solutions:**
1. Refresh the browser page
2. Try disconnecting and reconnecting
3. Check browser localStorage for connection data
4. Clear browser cache and try again

### Test Connection Status

**Check if Redis is running:**
```bash
redis-cli ping
# Should return: PONG
```

**Check Redis info:**
```bash
redis-cli info server
```

**List Redis databases:**
```bash
redis-cli info keyspace
```

### Manual Testing Commands

Try these commands in order to test different Redis features:

1. **Basic connectivity:**
   ```
   PING
   ```

2. **Server information:**
   ```
   INFO
   ```

3. **Database size:**
   ```
   DBSIZE
   ```

4. **String operations:**
   ```
   SET greeting "Hello Redis"
   GET greeting
   DEL greeting
   ```

5. **Hash operations:**
   ```
   HSET config theme dark
   HSET config language en
   HGETALL config
   ```

6. **List operations:**
   ```
   LPUSH tasks "task1" "task2"
   LRANGE tasks 0 -1
   ```

7. **Set operations:**
   ```
   SADD tags "redis" "database" "cache"
   SMEMBERS tags
   ```

8. **Cleanup:**
   ```
   FLUSHDB
   ```

## Expected Behavior

- ✅ Commands execute successfully
- ✅ Responses appear in console history
- ✅ Command history works (arrow keys)
- ✅ Auto-completion works (Tab key)
- ✅ Error messages are clear and helpful
- ✅ Connection status is visible
- ✅ Commands are disabled when not connected

## Troubleshooting Commands

If the console isn't working, try these debugging commands:

```bash
# Check if Redis is running
redis-cli ping

# Check Redis configuration
redis-cli config get "*"

# Check connected clients
redis-cli client list

# Check memory usage
redis-cli info memory

# Check if there are any slow queries
redis-cli slowlog get 10
```

## Performance Testing

Test with larger datasets:

```bash
# Create many keys
EVAL "for i=1,1000 do redis.call('SET', 'key:' .. i, 'value:' .. i) end" 0

# Check database size
DBSIZE

# Get all keys (be careful with large datasets)
KEYS *

# Clean up
FLUSHDB
```
