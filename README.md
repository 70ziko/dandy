# Dandy - Multiplayer Card Game

A modern multiplayer card game featuring real-time fluid dynamics background effects, built with React and Three.js.

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

# Start all services
docker compose up
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

## 🏗 Architecture

The project follows a microservices architecture:

- **Client Service**: React application with Three.js for cards and webGL for fluid simulation
- **Game Server**: Handles game logic and real-time communication
- **MongoDB**: Stores game state and user data
- **Redis**: Manages sessions and provides caching

## 🔒 Environment Variables

### Frontend Configuration

- `API_URL`: Backend API URL

### Backend Configuration

- `MONGODB_URI`: MongoDB connection string
- `REDIS_URL`: Redis connection string

## 🎨 Features in Detail

### Fluid Background

- Real-time WebGL fluid simulation
- Interactive touch/mouse input
- Multiple render passes for complex fluid effects
- Custom shader implementations

### Game Mechanics

- Deck management system
- Real-time card animations
- Multiplayer synchronization
- Guest player support

## 📁 Project Structure

```bash
├── client/                  # Frontend application
│   ├── src/
│   │   ├── components/     # React components
│   │   │   └── fluidBackground/  # WebGL fluid simulation
│   │   ├── game/          # Game-specific components
│   │   ├── contexts/      # React contexts
│   │   └── services/      # API services
├── server/                 # Backend application
│   ├── src/
│   │   ├── lib/          # Core functionality
│   │   ├── services/     # Business logic
│   │   ├── middleware/   # Express middleware
│   │   ├── routers/     # API routes
│   │   └── types/       # TypeScript types
└── docker-compose.yml     # Container orchestration
```
