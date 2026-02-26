import type { FastifyInstance } from "fastify";
import { authModule } from "./auth";
import { projectsModule } from "./projects";
import { connectorsModule } from "./connectors";
import { promptsModule } from "./prompts";
import { changeJobsModule } from "./change-jobs";

export async function registerModules(app: FastifyInstance) {
  await app.register(authModule);
  await app.register(projectsModule);
  await app.register(connectorsModule);
  await app.register(promptsModule);
  await app.register(changeJobsModule);
}
