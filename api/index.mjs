import { app, errorHandler } from '../server/src/app.js';

app.use(errorHandler);

export default app;
