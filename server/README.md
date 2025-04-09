# server

To install dependencies:

```bash
bun install
```

To run:

```bash
bun run index.ts
```

This project was created using `bun init` in bun v1.2.0. [Bun](https://bun.sh) is a fast all-in-one JavaScript runtime.

## Protocols Architecture

For user actions that influence game state, REST API over HTTPS should be used with correct headers:

- x-guest-id
- JWT token
  - x-guest-id / user-id
  - using assymetric keys: RS256 (preferably)
- anti-CSRF token
- signed payload

However for broadcasting changes to the clients, user <=> scene interactions, etc. websockets will be used.

### Routes

1. Rest API
    1.1. Guest router
      - GET /guest : returns the guestId (handled with middleware for all table routes)
    1.2. Table router (table = game)
      - middleware: validate request
      - GET /:tableId/draw : draws cards for users on the table, while updating the game state
      - POST /:tableId/action : performs the user action on the state and resolves/continues the game
    1.3. Matchmaking
2. Websockets
  - joining the channel
  - disconnecting from the channel
  - user interactions with the scene (streaming card, mouse movements, hand state, etc.)
  - sending game state updates to individual users