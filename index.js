
const WebSocket = require('ws');
const axios = require('axios');
const qs = require('qs');
require('dotenv').config();
const express = require('express')
const app = express();
const cors =  require('cors');
app.use(cors());
var clientCount = 0;
const PORT = process.env.POST || 5000;
const LIVE_MATCH_LIST = process.env.LIVE_MATCH_LIST_URL
const COMMENTRY_LIVE_MATCH =  process.env.COMMENTRY_LIVE_MATCH;
const server = new WebSocket.Server({ noServer: true });



// Map to store active WebSocket connections for each match ID
const activeConnections = new Map();
// Function to fetch all live match IDs from the API
const fetchAllLiveMatchIds = async () => {
  try {
    const matchList= [];
    const response = await axios.get(LIVE_MATCH_LIST);
    // console.log("response.data.data",response.data.data);
    for(let i=0;i< response.data.data.length;i++){
        
        matchList.push(response.data.data[i].match_id)
    }
    // console.log(matchList);
    return matchList || [];
  } catch (error) {
    console.error('Error fetching live match IDs:', error.message);
    return [];
  }
};

// Function to fetch live score data for a specific match ID from the API
const fetchCommentryData = async (matchId) => {
  try {
const formData = {
            match_id:matchId,
        };
    const HEADERS = {
        'Content-Type': 'application/x-www-form-urlencoded',
        }; 

        const response = await axios.post(COMMENTRY_LIVE_MATCH, qs.stringify(formData), { headers: HEADERS });
        // console.log("API Hit");
        return response.data || null;
    
  } catch (error) {
    console.error(`Error fetching live score data for Match ID ${matchId}:`, error.message);
    return error.message;
  }
};


// Function to broadcast live score data to all connected clients for a specific match ID
const broadcastLiveScoreToClients = async (matchId) => {
  if (activeConnections.has(matchId)) {
    const liveSCommentryData = await fetchCommentryData(matchId);
    if (liveSCommentryData !== null) {
      activeConnections.get(matchId).forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify({ type: 'liveCommentry', matchId, data: liveSCommentryData ,'liveUserCount': clientCount  }));
        }
      });
    }
  }
};

// Function to handle WebSocket connections

const handleWebSocketConnection = (socket, request) => {
  console.log('Client connected');
  clientCount++;
  // socket.send(`Total clients: ${clientCount}`);
  // Extract matchId from the WebSocket URL
  const matchId = request.url.split('/').pop();

  // Add the connection to the activeConnections map for the specific matchId
  if (!activeConnections.has(matchId)) {
    activeConnections.set(matchId, new Set());
  }
  activeConnections.get(matchId).add(socket);

  // Event listener when a client disconnects from the WebSocket server
  socket.on('close', () => {
    console.log('Client disconnected');
    // clientCount--;
    // Remove the connection from the activeConnections map
    activeConnections.get(matchId).delete(socket);
  });

  // Periodically fetch live score data for the connected client and broadcast it
  const intervalId = setInterval(() => {
    broadcastLiveScoreToClients(matchId);
  }, 4000); // Adjust the interval as needed

  // Clean up the interval when a client disconnects
  socket.on('close', () => {
    clientCount--;
    console.log('Client disconnected');
    clearInterval(intervalId);
  });
};



// Assign the WebSocket server to an existing HTTP server
const httpServer = require('http').createServer();
httpServer.on('upgrade', (request, socket, head) => {
  server.handleUpgrade(request, socket, head, (ws) => {
    server.emit('connection', ws, request);
  });
});
 // Periodically fetch live score data for the connected client and broadcast it
 const intervalId = setInterval( async() => {
     // Fetch all live match IDs from the API
  const liveMatchIds = await fetchAllLiveMatchIds();
//   console.log('Available live match IDs:', liveMatchIds);
  }, 4000); // Adjust the interval as needed

// Start the HTTP server
httpServer.listen(PORT, async () => {
  console.log(`WebSocket server running on ws://3.111.7.67:${PORT}`);


  // Handle WebSocket connections
  server.on('connection', (socket, request) => {
    handleWebSocketConnection(socket, request);
  });
});
const port = 5003;

app.get('/total-count',function(req, res){
  return res.json({"clientCount":clientCount})
})
app.listen(port,function(err){
  if(err){
    console.log('Error in Server');
  }
  console.log(`Express Server is Running on port: ${port}`);
})