const { createApp } = require('./app');
const { env } = require('./config/env');

const app = createApp();

if (require.main === module) {
  app.listen(env.port, () => {
    // eslint-disable-next-line no-console
    console.log(`🚀 API listening on http://localhost:${env.port}`);
    // eslint-disable-next-line no-console
    console.log(`   Health: http://localhost:${env.port}/api/health`);
  });
}

module.exports = app;
