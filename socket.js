const https = require('https');
const WebSocket = require('ws');
const fs = require('fs');

// Load SSL/TLS certificate and key
const serverOptions = {
  key: fs.readFileSync('server.key'),
  cert: fs.readFileSync('server.crt')
};

// Create an HTTPS server
const server = https.createServer(serverOptions);

// Create a WebSocket server using the HTTPS server
const wss = new WebSocket.Server({ server });

wss.on('connection', function connection(ws) {
  console.log('A new client connected!');

  ws.on('message', function incoming(message) {
    console.log('Received:', message);
  });

  ws.send('Hello, client!');
});


// Start the HTTPS server
server.listen(5000, function(err) {
    if (err) {
      console.error('Error starting server:', err);
    } else {
      console.log('Server is running on port 5000');
    }
  });
  
