const app = require('./app');
const { PORT } = require('./config/env');

const port = PORT || 3001;

app.listen(port, () => {
  console.log(`REBUILD backend running on port ${port}`);
});
