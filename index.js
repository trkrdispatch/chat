const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);
const path = require('path');
const { createClient } = require('@clickhouse/client');
const { OpenAI } = require('openai');
require('dotenv').config();

// Initialize OpenAI API client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Track connected users
const connectedUsers = new Set();
let aiUserAdded = false;
const AI_USERNAME = 'AI Assistant';

// Set up Express middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// ClickHouse client configuration
const clickhouse = createClient({
    host: `http://${process.env.CLICKHOUSE_HOST || 'clickhouse'}:8123`,
    username: 'default',
    password: 'password123',
    database: 'default',
    compression: false,
    request_timeout: 60000,  // Increase timeout
    clickhouse_settings: {
        allow_experimental_object_type: 1  // Allow object types
    }
});

// Initialize ClickHouse table with retry logic
async function initializeClickHouse(retries = 5, delay = 5000) {
    for (let i = 0; i < retries; i++) {
        try {
            console.log(`Attempt ${i + 1} to initialize ClickHouse table...`);
            
            // First, check if we can connect
            await clickhouse.ping();
            console.log('Successfully connected to ClickHouse');

            // Create the database if it doesn't exist
            await clickhouse.query({
                query: 'CREATE DATABASE IF NOT EXISTS default'
            });
            console.log('Database initialized successfully');

            // Create the table
            await clickhouse.query({
                query: `
                    CREATE TABLE IF NOT EXISTS default.messages (
                        id UInt32,
                        username String,
                        message String,
                        timestamp DateTime DEFAULT now()
                    ) ENGINE = MergeTree()
                    ORDER BY (timestamp)
                    SETTINGS index_granularity = 8192
                `
            });
            console.log('ClickHouse table initialized successfully');

            // Verify table exists
            const tablesStream = await clickhouse.query({
                query: 'SHOW TABLES FROM default',
                format: 'JSONEachRow'  // Explicitly set format for this query
            });
            const tables = await tablesStream.json();
            console.log('Available tables:', tables);

            // Test insert and select with direct VALUES
            await clickhouse.command({
                query: `
                    INSERT INTO default.messages (id, username, message)
                    VALUES (1, 'test', 'Test message')
                `
            });
            console.log('Test message inserted successfully');

            const testResultStream = await clickhouse.query({
                query: 'SELECT * FROM default.messages WHERE id = 1',
                format: 'JSONEachRow'  // Explicitly set format for this query
            });
            const testResult = await testResultStream.json();
            console.log('Test query result:', testResult);

            return;
        } catch (error) {
            console.error(`Error initializing ClickHouse table (attempt ${i + 1}/${retries}):`, error);
            console.error('Error details:', {
                message: error.message,
                code: error.code,
                stack: error.stack
            });
            if (i < retries - 1) {
                const waitTime = delay * (i + 1); // Exponential backoff
                console.log(`Retrying in ${waitTime/1000} seconds...`);
                await new Promise(resolve => setTimeout(resolve, waitTime));
            } else {
                console.error('Failed to initialize ClickHouse table after all retries');
                throw error;
            }
        }
    }
}

// Initialize services on startup
initializeClickHouse().catch(error => {
    console.error('Failed to initialize ClickHouse:', error);
    process.exit(1);
});

// Function to generate response from OpenAI
async function generateAIResponse(message, username) {
    try {
        console.log('Generating AI response for message:', message);
        
        const completion = await openai.chat.completions.create({
            messages: [
                { 
                    role: "system", 
                    content: "You are an AI assistant named 'AI Assistant' in a chat application. Respond in a friendly, helpful, and concise manner. Keep responses to 1-2 short paragraphs maximum." 
                },
                { 
                    role: "user", 
                    content: `User "${username}" says: ${message}` 
                }
            ],
            model: "gpt-3.5-turbo",
            max_tokens: 150,
        });
        
        return completion.choices[0].message.content.trim();
    } catch (error) {
        console.error('Error generating AI response:', error);
        return "Sorry, I'm having trouble processing your request right now.";
    }
}

// Add AI user to the database if not already added
async function ensureAIUserExists() {
    if (aiUserAdded) return;
    
    try {
        // Check if AI user already exists
        const aiCheckStream = await clickhouse.query({
            query: `SELECT * FROM default.messages WHERE username = '${AI_USERNAME}' LIMIT 1`,
            format: 'JSONEachRow'
        });
        const aiCheck = await aiCheckStream.json();
        
        if (aiCheck.length === 0) {
            // Add AI user with a welcome message
            const messageId = Math.floor(Math.random() * 1000000);
            await clickhouse.command({
                query: `
                    INSERT INTO default.messages (id, username, message)
                    VALUES (${messageId}, '${AI_USERNAME}', 'Hello everyone! I am the AI Assistant. I can respond to your messages when asked directly or when you are the only one in the chat.')
                `
            });
            console.log('AI user added successfully to database');
        }
        
        aiUserAdded = true;
    } catch (error) {
        console.error('Error ensuring AI user exists:', error);
    }
}

// Routes
app.get('/', (req, res) => {
    res.render('index');
});

// Route for messages data
app.get('/messages', async (req, res) => {
    try {
        console.log('Fetching messages from ClickHouse...');
        
        // Ensure AI user exists
        await ensureAIUserExists();
        
        // First, check if table exists
        const tablesStream = await clickhouse.query({
            query: 'SHOW TABLES FROM default',
            format: 'JSONEachRow'  // Explicitly set format for this query
        });
        const tables = await tablesStream.json();
        console.log('Available tables:', tables);

        const resultStream = await clickhouse.query({
            query: 'SELECT * FROM default.messages ORDER BY timestamp DESC LIMIT 100',
            format: 'JSONEachRow'  // Explicitly set format for this query
        });
        
        // Parse the stream into JSON
        const rows = await resultStream.json();
        console.log('Messages fetched successfully:', rows);
        res.json(rows);
    } catch (error) {
        console.error('Error fetching messages:', error);
        console.error('Error details:', {
            message: error.message,
            code: error.code,
            stack: error.stack
        });
        res.status(500).json({ error: 'Failed to fetch messages' });
    }
});

// Socket.IO connection handling
io.on('connection', (socket) => {
    console.log('User connected:', socket.id);
    
    // Handle join chat
    socket.on('join', async (username) => {
        socket.username = username;
        console.log(`${username} joined the chat`);
        
        // Add user to connected users set
        connectedUsers.add(username);
        console.log('Connected users:', Array.from(connectedUsers));
        
        // Ensure AI user exists in database
        await ensureAIUserExists();
        
        // Broadcast join message
        io.emit('user_joined', username);
        
        // If this is the only human user, have AI send a welcome message
        if (connectedUsers.size === 1) {
            setTimeout(async () => {
                const welcomeMessage = `Hello ${username}! I'm the AI Assistant. Since you're the only one here, I'll respond to all your messages. If more users join, I'll only respond when you ask me directly.`;
                
                // Store AI message in database
                const messageId = Math.floor(Math.random() * 1000000);
                await clickhouse.command({
                    query: `
                        INSERT INTO default.messages (id, username, message)
                        VALUES (${messageId}, '${AI_USERNAME}', '${welcomeMessage.replace(/'/g, "''")}')
                    `
                });
                
                // Send message to clients
                io.emit('message', {
                    username: AI_USERNAME,
                    message: welcomeMessage,
                    timestamp: new Date()
                });
                
                // Refresh message history
                io.emit('refresh_messages');
            }, 1000);
        }
    });

    // Handle sending messages
    socket.on('send_message', async (message) => {
        if (!socket.username) {
            socket.emit('error', { message: 'Please join the chat first' });
            return;
        }

        try {
            console.log('Attempting to store message:', {
                username: socket.username,
                message: message
            });

            // Store message in ClickHouse with direct VALUES
            const messageId = Math.floor(Math.random() * 1000000);
            await clickhouse.command({
                query: `
                    INSERT INTO default.messages (id, username, message)
                    VALUES (${messageId}, '${socket.username.replace(/'/g, "''")}', '${message.replace(/'/g, "''").replace(/\n/g, ' ')}')
                `
            });
            console.log('Message insert completed');

            // Verify the message was stored
            const verifyResultStream = await clickhouse.query({
                query: 'SELECT * FROM default.messages ORDER BY timestamp DESC LIMIT 1',
                format: 'JSONEachRow'  // Explicitly set format for this query
            });
            const verifyResult = await verifyResultStream.json();
            console.log('Latest message in database:', verifyResult);

            console.log('Message stored successfully in ClickHouse');

            // Broadcast message to all connected clients
            io.emit('message', {
                username: socket.username,
                message: message,
                timestamp: new Date()
            });

            // Process for AI response
            setTimeout(async () => {
                // Check if AI should respond
                const shouldRespond = 
                    // If there's only one human user, always respond
                    connectedUsers.size === 1 || 
                    // If message directly mentions AI
                    message.toLowerCase().includes('ai') ||
                    message.toLowerCase().includes('assistant') ||
                    message.toLowerCase().includes('@ai');
                
                if (shouldRespond) {
                    // Generate AI response
                    const aiResponse = await generateAIResponse(message, socket.username);
                    
                    // Store AI response in database
                    const aiMessageId = Math.floor(Math.random() * 1000000);
                    await clickhouse.command({
                        query: `
                            INSERT INTO default.messages (id, username, message)
                            VALUES (${aiMessageId}, '${AI_USERNAME}', '${aiResponse.replace(/'/g, "''")}')
                        `
                    });
                    
                    // Send AI response to all clients
                    io.emit('message', {
                        username: AI_USERNAME,
                        message: aiResponse,
                        timestamp: new Date()
                    });
                    
                    // Refresh message history
                    io.emit('refresh_messages');
                }
            }, 1000);

            // Refresh message history for all clients
            io.emit('refresh_messages');
        } catch (error) {
            console.error('Error storing message:', error);
            console.error('Error details:', {
                message: error.message,
                code: error.code,
                stack: error.stack
            });
            socket.emit('error', { 
                message: 'Failed to send message: ' + error.message 
            });
        }
    });

    // Handle disconnect
    socket.on('disconnect', () => {
        if (socket.username) {
            console.log(`${socket.username} left the chat`);
            
            // Remove user from connected users set
            connectedUsers.delete(socket.username);
            console.log('Connected users after disconnect:', Array.from(connectedUsers));
            
            io.emit('user_left', socket.username);
        }
    });
});

// Start server
const PORT = process.env.PORT || 3000;
http.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});