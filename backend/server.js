'use strict';

require('./config/env');
const app = require('./app');
const { sequelize } = require('./models');
const { validateEnvironment } = require('./config/env');

const PORT = Number(process.env.PORT || 3000);
let server;

async function shutdown(signal) {
  try {
    console.log(`Received ${signal}. Closing COCONEXUS services...`);

    if (server) {
      await new Promise((resolve, reject) => {
        server.close((error) => {
          if (error) {
            reject(error);
            return;
          }

          resolve();
        });
      });
    }

    await sequelize.close();
    process.exit(0);
  } catch (error) {
    console.error('Failed during graceful shutdown:', error.message);
    process.exit(1);
  }
}

async function startServer() {
  try {
    validateEnvironment();
    await sequelize.authenticate();

    server = app.listen(PORT, () => {
      console.log(`COCONEXUS backend listening on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error.message);
    process.exit(1);
  }
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));

startServer();
