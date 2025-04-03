# Dandy - Multiplayer Card Game

A modern multiplayer card game with real-time fluid dynamics background effects, built with Bun, React and Three.js. And secure server running on Bun.js.

## 🎮 Features

- Real-time multiplayer card game mechanics
- Interactive fluid simulation background using WebGL shaders
- Guest player support
- Real-time game state synchronization
- Responsive card and deck animations

## 🔧 Technology Stack

### Frontend

- React 19
- Three.js for WebGL rendering
- TypeScript
- GSAP & React Spring for animations
- React Router for navigation

### Backend

- Bun runtime
- Express.js
- Socket.IO for real-time communication
- TypeScript

### Infrastructure

- **MongoDB** for game state persistence
- **Redis** for session management and caching
- **Docker** and *Docker Compose* for containerization
- **WebSockets** for real-time game updates

## 🚀 Quick Start

### Prerequisites

- Docker and Docker Compose
- Node.js 18+ (for local development)

### Running with Docker

```bash
# Clone the repository
git clone [repository-url]

# Building and running all services in dev mode
docker compose -f docker-compose.dev.yml up --build
```

```bash
# Building and running in a production environment
docker compsoe -f docker-compose.prd.yml up --build
```

The application will be available at:

- Frontend: <http://localhost:3000>
- Backend API: <http://localhost:3001>

### Local Development

#### Client

```bash
cd client
bun install
bun start
```

#### Server

```bash
cd server
bun install
bun start
```

or use `npm` with the same commands.

## 🔒 Environment Variables

### Frontend Configuration

- `API_URL`: Backend API URL

### Backend Configuration

- `MONGODB_URI`: MongoDB connection string
- `REDIS_URL`: Redis connection string
