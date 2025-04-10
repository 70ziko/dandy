# dandy server

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

## Matchmaking

### QuickPlay

1. The server automatically creates the first room with a random id
2. User requests to join and gets added to the room
3. step 2 untill room full
4. Once full, new room gets created

During this an overlay should display (alternatively a component in the corner with card buttons replaced) or a seperate site.
Once the room is created players are redirected to CardGameScene. The game state is initialized, so each user calls the draw api (or a websocket event fires when they load and when all, server sends a trigger) to display the animation and get their appropriate card(s) decided by the server according to the game state.

### Ranked

Each user has an exact number ranking = Chips.
Should I call chips Doins?
Each class is defined by borders in chips:

- Hobo
- Impoverished
- Poor
- Lower Class
- Middle Class
- Top Class
- Rich
- damnn, im too high and fórgot

Players can only match with players not further than 'x' chips.

The equation for matching players:
  User_Chips - NewPlayer_Chips < x
    > Fill the spot
