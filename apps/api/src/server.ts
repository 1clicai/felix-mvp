import { buildServer } from "./app";
import { env } from "./config/env";

const app = buildServer();

app
  .listen({ port: env.PORT, host: "0.0.0.0" })
  .then(() => {
    app.log.info(`API listening on http://localhost:${env.PORT}`);
  })
  .catch((error) => {
    app.log.error(error, "Failed to start API");
    process.exit(1);
  });
