# Main Class Startup

## Startup Sequence (`src/app/index.js`)

### 1. Load Configuration
- Import config from `src/app/config.js`
- Read environment variables (PORT, DATABASE_URL, Firebase creds)

### 2. Initialize Database Pool
- Connect to PostgreSQL using `src/shared/db.js`
- Create pg Pool instance
- Test connection with `SELECT 1`

### 3. Initialize Adapters (Stubs)
- Firebase Auth adapter (token verification stub)
- Firebase Storage adapter (upload/delete stubs)
- Payments adapter (intent/refund stubs)
- Maps adapter (geocoding stubs)

### 4. Create Express Application
- JSON parser middleware
- URL-encoded parser middleware
- Simple request logging middleware
- CORS middleware

### 5. Attach Authentication Middleware
- Firebase token verification via `auth.middleware.js`
- Sets `req.user` with `{ id, email, role }`
- Defaults to `{ role: 'visitor' }` if no token

### 6. Mount Application Routes
- Health check endpoint `/healthz`
- All module routers under `/api/*`
- Role guards applied per route

### 7. Create HTTP Server + Socket.IO
- HTTP server from Express app
- Socket.IO server with CORS config
- Register chat gateway handlers

### 8. Start Server
- Listen on configured port
- Log "TrailHub ready" message
- Return `{ server, io, stop }` handles

## Shutdown Sequence
- Close Socket.IO connections
- Close HTTP server
- End PostgreSQL pool
- Graceful cleanup
