require("dotenv").config();
const { exec } = require("child_process");
const http = require("http");
const app = require("./src/app");
const { initializeSocket } = require("./src/config/socket");
const redisClient = require("./src/config/redis");

const PORT = process.env.PORT || 5000;

// Run migrations before starting the server (production only)
async function startServer() {
  if (process.env.NODE_ENV === "production") {
    exec("npx prisma migrate deploy", (error, stdout, stderr) => {
      if (error) {
        console.error(
          "⚠️ Migration warning (may already be up to date):",
          error.message,
        );
      } else {
      }

      // Start server regardless of migration result
      startApp();
    });
  } else {
    startApp();
  }
}

function startApp() {
  const server = http.createServer(app);
  
  // Initialize WebSocket Server
  initializeSocket(server);

  // Initialize Redis Connection
  redisClient.connect();

  server.listen(PORT, () => {
  });
}

startServer();
