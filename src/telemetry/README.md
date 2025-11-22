# Telemetry Module

A generic, reusable telemetry module for tracking application usage and events. Designed to be flexible and work with any client application.

## Features

- ✅ **Generic Event Structure** - Flexible metadata field accepts any event-specific data
- ✅ **Batch Processing** - Submit up to 1000 events in a single request
- ✅ **JWT Authentication** - All endpoints require valid JWT token
- ✅ **Rate Limiting** - 100 requests per minute per user (by userId from JWT)
- ✅ **Auto-Cleanup** - Events older than 12 months are automatically deleted (TTL + daily cron job at 4:00 AM)
- ✅ **Comprehensive Indexes** - Optimized for common query patterns
- ✅ **Type Safety** - Full TypeScript support with validation

## API Endpoints

### Submit Single Event
```
POST /telemetry/event
Authorization: Bearer <jwt_token>
```

**Request Body:**
```json
{
  "userId": "user-123",
  "sessionId": "session-abc",
  "timestamp": "2025-11-22T10:30:45.123Z",
  "eventType": "app.started",
  "appName": "mkcli",
  "appVersion": "1.2.3",
  "os": "linux",
  "platform": "production",
  "metadata": {
    "feature": "generate",
    "duration": 1234,
    "filesGenerated": 3
  }
}
```

**Response:**
```json
{
  "success": true,
  "eventId": "507f1f77bcf86cd799439011"
}
```

### Submit Batch of Events
```
POST /telemetry/batch
Authorization: Bearer <jwt_token>
```

**Request Body:**
```json
{
  "events": [
    {
      "timestamp": "2025-11-22T10:30:45.123Z",
      "eventType": "app.started",
      "appName": "mkcli",
      "appVersion": "1.2.3",
      "os": "linux"
    },
    {
      "timestamp": "2025-11-22T10:30:46.123Z",
      "eventType": "user.login",
      "appName": "mkcli",
      "appVersion": "1.2.3",
      "os": "darwin"
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "success": 2,
  "failed": 0
}
```

### Query Events (Requires valid JWT)
```
GET /telemetry/events?userId=user-123&limit=100
Authorization: Bearer <jwt_token>
```

**Query Parameters:**
- `userId` - Filter by user
- `appName` - Filter by application
- `eventType` - Filter by event type
- `startDate` - Filter by start date (ISO 8601)
- `endDate` - Filter by end date (ISO 8601)
- `limit` - Max results (default: 100)
- `skip` - Skip results for pagination

**Response:**
```json
{
  "success": true,
  "count": 2,
  "events": [...]
}
```

### Get Statistics (Requires valid JWT)
```
GET /telemetry/statistics?appName=mkcli
Authorization: Bearer <jwt_token>
```

**Query Parameters:**
- `appName` - Filter by application
- `startDate` - Start date for statistics
- `endDate` - End date for statistics

**Response:**
```json
{
  "success": true,
  "statistics": [
    {
      "_id": "app.started",
      "count": 150,
      "firstSeen": "2025-11-01T00:00:00.000Z",
      "lastSeen": "2025-11-22T10:30:45.123Z"
    }
  ]
}
```

## Data Model

### TelemetryEvent Schema

| Field | Type | Required | Indexed | Description |
|-------|------|----------|---------|-------------|
| `userId` | String | No | Yes | User identifier |
| `sessionId` | String | No | Yes | Session identifier |
| `timestamp` | Date | Yes | Yes | Event timestamp |
| `eventType` | String | Yes | Yes | Event type (e.g., "app.started") |
| `appName` | String | No | Yes | Application name |
| `appVersion` | String | No | No | Application version |
| `os` | String | No | No | Operating system |
| `platform` | String | No | No | Platform/environment |
| `metadata` | Object | No | No | Flexible event-specific data |
| `createdAt` | Date | Auto | No | MongoDB creation timestamp |
| `updatedAt` | Date | Auto | No | MongoDB update timestamp |

## Indexes

The module creates the following indexes for optimal query performance:

1. Single field indexes: `userId`, `sessionId`, `timestamp`, `eventType`, `appName`
2. Compound indexes:
   - `{ userId: 1, timestamp: -1 }`
   - `{ appName: 1, timestamp: -1 }`
   - `{ eventType: 1, timestamp: -1 }`
3. TTL index: `{ timestamp: 1 }` (12-month retention)

## Integration Example

### Client-Side Example

```typescript
// Send telemetry batch with JWT authentication
const events = telemetryQueue.map(event => ({
  userId: user.userId,
  timestamp: event.timestamp,
  eventType: event.eventType,
  appName: 'my-app',
  appVersion: '1.2.3',
  os: 'linux',
  metadata: event.metadata,
}));

await fetch(`${serverUrl}/telemetry/batch`, {
  method: 'POST',
  headers: { 
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${jwtToken}`, // JWT required
  },
  body: JSON.stringify({ events }),
});
```

## Configuration

### Environment Variables

Configure retention period via MongoDB TTL index:
- Default: 365 days (12 months)
- Modify in `telemetry-event.schema.ts`: `expireAfterSeconds`

### Automatic Cleanup

Data retention is handled through two mechanisms:
1. **MongoDB TTL Index**: Automatically removes events older than 365 days
2. **Daily Cron Job**: Runs every day at 4:00 AM (Europe/Berlin timezone) for additional cleanup

### Manual Cleanup

For manual cleanup if needed:

```typescript
// Delete events older than 365 days
await telemetryService.cleanupOldEvents(365);
```

## Security

- ✅ **JWT Authentication** - All endpoints require valid JWT token
- ✅ **No special permissions** - Only valid JWT is required, no additional permissions needed
- ✅ **Rate Limiting** - 100 requests per minute per user
- ✅ **No PII by default** - Flexible design allows clients to control data sensitivity
- ✅ **Batch limits** - Max 1000 events per batch to prevent abuse
- ✅ **Auto-deletion** - Events are automatically deleted after 12 months for privacy compliance

## Testing

Run tests:
```bash
npm test -- telemetry
```

## Performance Considerations

1. **Batch inserts** - Use `insertMany` with `ordered: false` for parallel processing
2. **Indexes** - Comprehensive indexes for common query patterns
3. **TTL cleanup** - Automatic deletion of old data reduces storage
4. **Async processing** - Events stored asynchronously without blocking
