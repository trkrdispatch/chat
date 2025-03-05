# Real-time Chat Application

A real-time chat application built with Node.js, Socket.IO, and ClickHouse for message storage.

## Features

- Real-time messaging using Socket.IO
- Message persistence using ClickHouse
- Simple username-based chat system
- Message history with timestamp
- System notifications for user join/leave events
- Responsive design

## Prerequisites

- Docker
- Docker Compose
- Node.js (for local development)

## Getting Started

1. Clone the repository:
```bash
git clone <your-repository-url>
cd <repository-name>
```

2. Create a `.env` file in the root directory with the following content:
```
PORT=3000
CLICKHOUSE_HOST=clickhouse
CLICKHOUSE_PORT=8123
```

3. Start the application using Docker Compose:
```bash
docker-compose up --build
```

4. Open your browser and navigate to `http://localhost:3000`

## Usage

1. Enter a username to join the chat
2. Start sending messages
3. Messages are stored in ClickHouse and displayed in the message history
4. Use the refresh button to update the message history

## Architecture

- Frontend: HTML, CSS, JavaScript with Socket.IO client
- Backend: Node.js with Express and Socket.IO
- Database: ClickHouse for message storage
- Containerization: Docker and Docker Compose

## Development

To run the application locally without Docker:

1. Install dependencies:
```bash
npm install
```

2. Start the application:
```bash
node index.js
```

## License

MIT 