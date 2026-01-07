# Chat Gateway Events

## Room Pattern
- **Namespace**: Default (`/`) - could be `/chat` later
- **Room Format**: `chat:hike:{hikeId}`
- **Example**: `chat:hike:123` for hike with ID 123

## Client → Server Events

### joinRoom
- **Payload**: `{ hikeId: string }`
- **Action**: Join the hike's chat room
- **Server Response**: Emits `systemNotice` to room

### leaveRoom
- **Payload**: `{ hikeId: string }`
- **Action**: Leave the hike's chat room
- **Server Response**: Emits `systemNotice` to room

### sendMessage
- **Payload**: `{ hikeId: string, text: string }`
- **Action**: Send text message to hike chat
- **Server Response**: Emits `message` to room

### sendPhoto
- **Payload**: `{ hikeId: string, url: string }`
- **Action**: Send photo to hike chat
- **Server Response**: Emits `photo` to room

## Server → Client Events

### message
- **Payload**: `{ from: string, text: string }`
- **Trigger**: When user sends text message

### photo
- **Payload**: `{ from: string, url: string }`
- **Trigger**: When user sends photo

### systemNotice
- **Payload**: `{ text: string }`
- **Trigger**: User join/leave events

## Implementation Status
- Gateway registered in `src/modules/chat/gateway/index.js`
- All events are stubbed with minimal logic
- TODO: Add message persistence and user identification
