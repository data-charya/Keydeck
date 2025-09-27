export interface RedisCommand {
  name: string
  category: string
  description: string
  syntax: string
  examples: string[]
  complexity: string
  since: string
  group: string
}

export const REDIS_COMMANDS_DATA: RedisCommand[] = [
  // String Commands
  {
    name: "GET",
    category: "String",
    description: "Get the value of a key",
    syntax: "GET key",
    examples: ["GET mykey", "GET user:123"],
    complexity: "O(1)",
    since: "1.0.0",
    group: "string"
  },
  {
    name: "SET",
    category: "String",
    description: "Set the string value of a key",
    syntax: "SET key value [EX seconds] [PX milliseconds] [NX|XX]",
    examples: ["SET mykey \"Hello World\"", "SET mykey \"Hello\" EX 10", "SET mykey \"Hello\" NX"],
    complexity: "O(1)",
    since: "1.0.0",
    group: "string"
  },
  {
    name: "MSET",
    category: "String",
    description: "Set multiple keys to multiple values",
    syntax: "MSET key value [key value ...]",
    examples: ["MSET key1 \"Hello\" key2 \"World\"", "MSET user:1 \"Alice\" user:2 \"Bob\""],
    complexity: "O(N)",
    since: "1.0.1",
    group: "string"
  },
  {
    name: "MGET",
    category: "String",
    description: "Get the values of all the given keys",
    syntax: "MGET key [key ...]",
    examples: ["MGET key1 key2", "MGET user:1 user:2 user:3"],
    complexity: "O(N)",
    since: "1.0.0",
    group: "string"
  },
  {
    name: "INCR",
    category: "String",
    description: "Increment the integer value of a key by one",
    syntax: "INCR key",
    examples: ["INCR counter", "INCR page_views"],
    complexity: "O(1)",
    since: "1.0.0",
    group: "string"
  },
  {
    name: "DECR",
    category: "String",
    description: "Decrement the integer value of a key by one",
    syntax: "DECR key",
    examples: ["DECR counter", "DECR inventory"],
    complexity: "O(1)",
    since: "1.0.0",
    group: "string"
  },
  {
    name: "APPEND",
    category: "String",
    description: "Append a value to a key",
    syntax: "APPEND key value",
    examples: ["APPEND mykey \" World\"", "APPEND log \"New entry\""],
    complexity: "O(1)",
    since: "2.0.0",
    group: "string"
  },
  {
    name: "STRLEN",
    category: "String",
    description: "Get the length of the value stored in a key",
    syntax: "STRLEN key",
    examples: ["STRLEN mykey", "STRLEN description"],
    complexity: "O(1)",
    since: "2.2.0",
    group: "string"
  },

  // Hash Commands
  {
    name: "HGET",
    category: "Hash",
    description: "Get the value of a hash field",
    syntax: "HGET key field",
    examples: ["HGET user:1 name", "HGET product:123 price"],
    complexity: "O(1)",
    since: "2.0.0",
    group: "hash"
  },
  {
    name: "HSET",
    category: "Hash",
    description: "Set the string value of a hash field",
    syntax: "HSET key field value [field value ...]",
    examples: ["HSET user:1 name \"Alice\"", "HSET user:1 name \"Alice\" age 30"],
    complexity: "O(1) for each field/value pair",
    since: "2.0.0",
    group: "hash"
  },
  {
    name: "HGETALL",
    category: "Hash",
    description: "Get all the fields and values in a hash",
    syntax: "HGETALL key",
    examples: ["HGETALL user:1", "HGETALL product:123"],
    complexity: "O(N)",
    since: "2.0.0",
    group: "hash"
  },
  {
    name: "HDEL",
    category: "Hash",
    description: "Delete one or more hash fields",
    syntax: "HDEL key field [field ...]",
    examples: ["HDEL user:1 age", "HDEL user:1 age email"],
    complexity: "O(N)",
    since: "2.0.0",
    group: "hash"
  },
  {
    name: "HKEYS",
    category: "Hash",
    description: "Get all the fields in a hash",
    syntax: "HKEYS key",
    examples: ["HKEYS user:1", "HKEYS product:123"],
    complexity: "O(N)",
    since: "2.0.0",
    group: "hash"
  },
  {
    name: "HVALS",
    category: "Hash",
    description: "Get all the values in a hash",
    syntax: "HVALS key",
    examples: ["HVALS user:1", "HVALS product:123"],
    complexity: "O(N)",
    since: "2.0.0",
    group: "hash"
  },
  {
    name: "HLEN",
    category: "Hash",
    description: "Get the number of fields in a hash",
    syntax: "HLEN key",
    examples: ["HLEN user:1", "HLEN product:123"],
    complexity: "O(1)",
    since: "2.0.0",
    group: "hash"
  },

  // List Commands
  {
    name: "LPUSH",
    category: "List",
    description: "Prepend one or multiple values to a list",
    syntax: "LPUSH key element [element ...]",
    examples: ["LPUSH mylist \"world\"", "LPUSH mylist \"world\" \"hello\""],
    complexity: "O(1) for each element",
    since: "1.0.0",
    group: "list"
  },
  {
    name: "RPUSH",
    category: "List",
    description: "Append one or multiple values to a list",
    syntax: "RPUSH key element [element ...]",
    examples: ["RPUSH mylist \"world\"", "RPUSH mylist \"world\" \"hello\""],
    complexity: "O(1) for each element",
    since: "1.0.0",
    group: "list"
  },
  {
    name: "LPOP",
    category: "List",
    description: "Remove and get the first element in a list",
    syntax: "LPOP key [count]",
    examples: ["LPOP mylist", "LPOP mylist 3"],
    complexity: "O(N)",
    since: "1.0.0",
    group: "list"
  },
  {
    name: "RPOP",
    category: "List",
    description: "Remove and get the last element in a list",
    syntax: "RPOP key [count]",
    examples: ["RPOP mylist", "RPOP mylist 3"],
    complexity: "O(N)",
    since: "1.0.0",
    group: "list"
  },
  {
    name: "LLEN",
    category: "List",
    description: "Get the length of a list",
    syntax: "LLEN key",
    examples: ["LLEN mylist", "LLEN queue"],
    complexity: "O(1)",
    since: "1.0.0",
    group: "list"
  },
  {
    name: "LRANGE",
    category: "List",
    description: "Get a range of elements from a list",
    syntax: "LRANGE key start stop",
    examples: ["LRANGE mylist 0 -1", "LRANGE mylist 0 10"],
    complexity: "O(S+N)",
    since: "1.0.0",
    group: "list"
  },

  // Set Commands
  {
    name: "SADD",
    category: "Set",
    description: "Add one or more members to a set",
    syntax: "SADD key member [member ...]",
    examples: ["SADD myset \"Hello\"", "SADD myset \"Hello\" \"World\""],
    complexity: "O(1) for each member",
    since: "1.0.0",
    group: "set"
  },
  {
    name: "SREM",
    category: "Set",
    description: "Remove one or more members from a set",
    syntax: "SREM key member [member ...]",
    examples: ["SREM myset \"Hello\"", "SREM myset \"Hello\" \"World\""],
    complexity: "O(N)",
    since: "1.0.0",
    group: "set"
  },
  {
    name: "SMEMBERS",
    category: "Set",
    description: "Get all the members in a set",
    syntax: "SMEMBERS key",
    examples: ["SMEMBERS myset", "SMEMBERS tags"],
    complexity: "O(N)",
    since: "1.0.0",
    group: "set"
  },
  {
    name: "SCARD",
    category: "Set",
    description: "Get the number of members in a set",
    syntax: "SCARD key",
    examples: ["SCARD myset", "SCARD tags"],
    complexity: "O(1)",
    since: "1.0.0",
    group: "set"
  },
  {
    name: "SISMEMBER",
    category: "Set",
    description: "Determine if a given value is a member of a set",
    syntax: "SISMEMBER key member",
    examples: ["SISMEMBER myset \"Hello\"", "SISMEMBER tags \"redis\""],
    complexity: "O(1)",
    since: "1.0.0",
    group: "set"
  },

  // Sorted Set Commands
  {
    name: "ZADD",
    category: "Sorted Set",
    description: "Add one or more members to a sorted set, or update its score",
    syntax: "ZADD key [NX|XX] [CH] [INCR] score member [score member ...]",
    examples: ["ZADD myzset 1 \"one\"", "ZADD myzset 1 \"one\" 2 \"two\""],
    complexity: "O(log(N)) for each member",
    since: "1.2.0",
    group: "sorted-set"
  },
  {
    name: "ZREM",
    category: "Sorted Set",
    description: "Remove one or more members from a sorted set",
    syntax: "ZREM key member [member ...]",
    examples: ["ZREM myzset \"one\"", "ZREM myzset \"one\" \"two\""],
    complexity: "O(M*log(N))",
    since: "1.2.0",
    group: "sorted-set"
  },
  {
    name: "ZRANGE",
    category: "Sorted Set",
    description: "Return a range of members in a sorted set",
    syntax: "ZRANGE key start stop [WITHSCORES]",
    examples: ["ZRANGE myzset 0 -1", "ZRANGE myzset 0 -1 WITHSCORES"],
    complexity: "O(log(N)+M)",
    since: "1.2.0",
    group: "sorted-set"
  },
  {
    name: "ZCARD",
    category: "Sorted Set",
    description: "Get the number of members in a sorted set",
    syntax: "ZCARD key",
    examples: ["ZCARD myzset", "ZCARD leaderboard"],
    complexity: "O(1)",
    since: "1.2.0",
    group: "sorted-set"
  },
  {
    name: "ZSCORE",
    category: "Sorted Set",
    description: "Get the score associated with the given member in a sorted set",
    syntax: "ZSCORE key member",
    examples: ["ZSCORE myzset \"one\"", "ZSCORE leaderboard \"player1\""],
    complexity: "O(1)",
    since: "1.2.0",
    group: "sorted-set"
  },

  // Key Commands
  {
    name: "DEL",
    category: "Key",
    description: "Delete a key",
    syntax: "DEL key [key ...]",
    examples: ["DEL mykey", "DEL key1 key2 key3"],
    complexity: "O(N)",
    since: "1.0.0",
    group: "key"
  },
  {
    name: "EXISTS",
    category: "Key",
    description: "Determine if a key exists",
    syntax: "EXISTS key [key ...]",
    examples: ["EXISTS mykey", "EXISTS key1 key2"],
    complexity: "O(1)",
    since: "1.0.0",
    group: "key"
  },
  {
    name: "EXPIRE",
    category: "Key",
    description: "Set a key's time to live in seconds",
    syntax: "EXPIRE key seconds",
    examples: ["EXPIRE mykey 10", "EXPIRE session:123 3600"],
    complexity: "O(1)",
    since: "1.0.0",
    group: "key"
  },
  {
    name: "KEYS",
    category: "Key",
    description: "Find all keys matching the given pattern",
    syntax: "KEYS pattern",
    examples: ["KEYS *", "KEYS user:*", "KEYS *session*"],
    complexity: "O(N)",
    since: "1.0.0",
    group: "key"
  },
  {
    name: "TYPE",
    category: "Key",
    description: "Determine the type stored at key",
    syntax: "TYPE key",
    examples: ["TYPE mykey", "TYPE user:123"],
    complexity: "O(1)",
    since: "1.0.0",
    group: "key"
  },
  {
    name: "TTL",
    category: "Key",
    description: "Get the time to live for a key",
    syntax: "TTL key",
    examples: ["TTL mykey", "TTL session:123"],
    complexity: "O(1)",
    since: "1.0.0",
    group: "key"
  },

  // Server Commands
  {
    name: "PING",
    category: "Server",
    description: "Ping the server",
    syntax: "PING [message]",
    examples: ["PING", "PING \"Hello Redis\""],
    complexity: "O(1)",
    since: "1.0.0",
    group: "server"
  },
  {
    name: "INFO",
    category: "Server",
    description: "Get information and statistics about the server",
    syntax: "INFO [section]",
    examples: ["INFO", "INFO memory", "INFO stats"],
    complexity: "O(1)",
    since: "1.0.0",
    group: "server"
  },
  {
    name: "DBSIZE",
    category: "Server",
    description: "Return the number of keys in the selected database",
    syntax: "DBSIZE",
    examples: ["DBSIZE"],
    complexity: "O(1)",
    since: "1.0.0",
    group: "server"
  },
  {
    name: "FLUSHDB",
    category: "Server",
    description: "Remove all keys from the current database",
    syntax: "FLUSHDB [ASYNC]",
    examples: ["FLUSHDB", "FLUSHDB ASYNC"],
    complexity: "O(N)",
    since: "1.0.0",
    group: "server"
  },
  {
    name: "FLUSHALL",
    category: "Server",
    description: "Remove all keys from all databases",
    syntax: "FLUSHALL [ASYNC]",
    examples: ["FLUSHALL", "FLUSHALL ASYNC"],
    complexity: "O(N)",
    since: "1.0.0",
    group: "server"
  },

  // Transaction Commands
  {
    name: "MULTI",
    category: "Transaction",
    description: "Mark the start of a transaction block",
    syntax: "MULTI",
    examples: ["MULTI"],
    complexity: "O(1)",
    since: "1.2.0",
    group: "transaction"
  },
  {
    name: "EXEC",
    category: "Transaction",
    description: "Execute all commands issued after MULTI",
    syntax: "EXEC",
    examples: ["EXEC"],
    complexity: "O(N)",
    since: "1.2.0",
    group: "transaction"
  },
  {
    name: "DISCARD",
    category: "Transaction",
    description: "Discard all commands issued after MULTI",
    syntax: "DISCARD",
    examples: ["DISCARD"],
    complexity: "O(N)",
    since: "2.0.0",
    group: "transaction"
  },

  // Pub/Sub Commands
  {
    name: "PUBLISH",
    category: "Pub/Sub",
    description: "Post a message to a channel",
    syntax: "PUBLISH channel message",
    examples: ["PUBLISH news \"Hello World\"", "PUBLISH notifications \"New user\""],
    complexity: "O(N+M)",
    since: "2.0.0",
    group: "pubsub"
  },
  {
    name: "SUBSCRIBE",
    category: "Pub/Sub",
    description: "Listen for messages published to the given channels",
    syntax: "SUBSCRIBE channel [channel ...]",
    examples: ["SUBSCRIBE news", "SUBSCRIBE news notifications"],
    complexity: "O(N)",
    since: "2.0.0",
    group: "pubsub"
  },

  // Stream Commands
  {
    name: "XADD",
    category: "Stream",
    description: "Append a new entry to a stream",
    syntax: "XADD key ID field value [field value ...]",
    examples: ["XADD mystream * name \"John\" age 30", "XADD events * event \"login\" user \"alice\""],
    complexity: "O(1)",
    since: "5.0.0",
    group: "stream"
  },
  {
    name: "XREAD",
    category: "Stream",
    description: "Read data from one or more streams",
    syntax: "XREAD [COUNT count] [BLOCK milliseconds] STREAMS key [key ...] ID [ID ...]",
    examples: ["XREAD STREAMS mystream 0", "XREAD COUNT 10 STREAMS mystream 0"],
    complexity: "O(N)",
    since: "5.0.0",
    group: "stream"
  },

  // Geospatial Commands
  {
    name: "GEOADD",
    category: "Geospatial",
    description: "Add one or more geospatial items to a key",
    syntax: "GEOADD key longitude latitude member [longitude latitude member ...]",
    examples: ["GEOADD cities 2.3522 48.8566 \"Paris\"", "GEOADD cities 2.3522 48.8566 \"Paris\" -0.1276 51.5074 \"London\""],
    complexity: "O(log(N)) for each item",
    since: "3.2.0",
    group: "geospatial"
  },
  {
    name: "GEODIST",
    category: "Geospatial",
    description: "Return the distance between two members of a geospatial index",
    syntax: "GEODIST key member1 member2 [unit]",
    examples: ["GEODIST cities \"Paris\" \"London\"", "GEODIST cities \"Paris\" \"London\" km"],
    complexity: "O(log(N))",
    since: "3.2.0",
    group: "geospatial"
  },

  // Bitmap Commands
  {
    name: "SETBIT",
    category: "Bitmap",
    description: "Sets or clears the bit at offset in the string value stored at key",
    syntax: "SETBIT key offset value",
    examples: ["SETBIT mykey 7 1", "SETBIT flags 0 1"],
    complexity: "O(1)",
    since: "2.2.0",
    group: "bitmap"
  },
  {
    name: "GETBIT",
    category: "Bitmap",
    description: "Returns the bit value at offset in the string value stored at key",
    syntax: "GETBIT key offset",
    examples: ["GETBIT mykey 7", "GETBIT flags 0"],
    complexity: "O(1)",
    since: "2.2.0",
    group: "bitmap"
  },
  {
    name: "BITCOUNT",
    category: "Bitmap",
    description: "Count the number of set bits in a string",
    syntax: "BITCOUNT key [start end]",
    examples: ["BITCOUNT mykey", "BITCOUNT mykey 0 10"],
    complexity: "O(N)",
    since: "2.6.0",
    group: "bitmap"
  }
]

export const COMMAND_CATEGORIES = [
  "String", "Hash", "List", "Set", "Sorted Set", "Key", "Server", 
  "Transaction", "Pub/Sub", "Stream", "Geospatial", "Bitmap"
]

export function getCommandsByCategory(category: string): RedisCommand[] {
  return REDIS_COMMANDS_DATA.filter(cmd => cmd.category === category)
}

export function searchCommands(query: string): RedisCommand[] {
  const lowercaseQuery = query.toLowerCase()
  return REDIS_COMMANDS_DATA.filter(cmd => 
    cmd.name.toLowerCase().includes(lowercaseQuery) ||
    cmd.description.toLowerCase().includes(lowercaseQuery) ||
    cmd.syntax.toLowerCase().includes(lowercaseQuery)
  )
}
