# Chat Application with ClickHouse

A real-time chat application built with Node.js, Socket.IO, and ClickHouse for message storage.

## Features

- Real-time messaging with Socket.IO
- Message history stored in ClickHouse database
- Docker containerization for easy deployment
- Responsive web interface

## Technologies

- Node.js and Express
- Socket.IO for real-time communication
- ClickHouse for high-performance message storage
- Docker and Docker Compose for containerization
- EJS templates for the frontend

## Getting Started

### Prerequisites

- Docker and Docker Compose
- Node.js (for local development)

### Running the Application

1. Clone the repository:
   ```
   git clone https://github.com/yourusername/chat-app-clickhouse.git
   cd chat-app-clickhouse
   ```

2. Start the application with Docker Compose:
   ```
   docker-compose up --build
   ```

3. Access the application at http://localhost:3000

## Project Structure

- `index.js` - Main application file
- `views/` - EJS templates for the frontend
- `docker-compose.yml` - Docker Compose configuration
- `package.json` - Node.js dependencies

## Development

For local development:

1. Install dependencies:
   ```
   npm install
   ```

2. Run ClickHouse in Docker:
   ```
   docker-compose up clickhouse
   ```

3. Start the application in development mode:
   ```
   npm run dev
   ```

## License

MIT 