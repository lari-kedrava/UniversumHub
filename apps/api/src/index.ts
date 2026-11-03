import { startServer } from "./server.js";

startServer().catch((error) => {
  console.error("Falha ao iniciar a API:", error);
  process.exit(1);
});
