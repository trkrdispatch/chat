# Chat Application with ClickHouse

A real-time chat application built with Node.js, Socket.IO, and ClickHouse for message storage.

## Features

- Real-time messaging with Socket.IO
- Message history stored in ClickHouse database
- Docker containerization for easy deployment
- Responsive web interface
- AI Assistant powered by OpenAI

## Technologies

- Node.js and Express
- Socket.IO for real-time communication
- ClickHouse for high-performance message storage
- Docker and Docker Compose for containerization
- EJS templates for the frontend
- OpenAI API for AI Assistant functionality

## Getting Started

### Prerequisites

- Docker and Docker Compose
- Node.js (for local development)
- OpenAI API key

### Running the Application

1. Clone the repository:
   ```
   git clone https://github.com/yourusername/chat-app-clickhouse.git
   cd chat-app-clickhouse
   ```

2. Set up environment variables:
   ```
   cp .env.example .env
   ```
   Edit the `.env` file and add your OpenAI API key.

3. Start the application with Docker Compose:
   ```
   docker-compose up --build
   ```

4. Access the application at http://localhost:3000

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

## Security Best Practices

### Environment Variables

- Never commit real API keys or sensitive credentials to version control
- Always use the `.env.example` file as a template with placeholder values
- Ensure `.env` is in your `.gitignore` file (it already is in this project)
- Rotate API keys if they've been accidentally exposed

### API Key Management

- Create API keys with the minimum required permissions
- Regularly rotate your OpenAI API keys as a security practice
- Consider using a secrets management service for production deployments
- Monitor API usage to detect unauthorized access

## AI Usage and Privacy

- **AI Credits**: When you use the "/" command to interact with the AI Assistant, it triggers a request to the OpenAI API, consuming AI credits based on the number of tokens processed.
- **Message Privacy**: The AI only processes messages explicitly sent to it using the "/" command. Regular messages between users do not involve the AI and do not consume AI credits.

## License

MIT 