"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { useApiClient } from "../lib/api-client";

interface Project {
  id: string;
  name: string;
  slug: string;
  repositoryUrl?: string;
}

interface ProjectsResponse {
  data: Project[];
}

export default function ProjectListPage() {
  const api = useApiClient();
  const { data, isLoading, error } = useQuery<ProjectsResponse>({
    queryKey: ["projects"],
    queryFn: () => api("/api/projects"),
  });

  return (
    <main style={{ maxWidth: "1000px", margin: "0 auto", padding: "2rem" }}>
      <section style={{ marginBottom: "2rem" }}>
        <p style={{ color: "#38bdf8", letterSpacing: "0.2em", fontSize: "0.8rem" }}>PROJECTS</p>
        <h1 style={{ margin: "0.5rem 0 0" }}>Workspace Overview</h1>
        <p style={{ color: "#94a3b8", maxWidth: "640px" }}>
          Select a project to manage connectors, submit prompts, and monitor change jobs.
        </p>
      </section>

      {isLoading && <p>Loading projects…</p>}
      {error && <p style={{ color: "#f87171" }}>{(error as Error).message}</p>}

      <div style={{ display: "grid", gap: "1rem" }}>
        {data?.data?.map((project) => (
          <Link
            key={project.id}
            href={`/projects/${project.id}`}
            style={{
              padding: "1.25rem",
              borderRadius: "1rem",
              border: "1px solid rgba(148,163,184,0.3)",
              background: "rgba(15,23,42,0.6)",
            }}
          >
            <h2 style={{ margin: 0 }}>{project.name}</h2>
            <p style={{ color: "#94a3b8", margin: "0.35rem 0 0" }}>{project.slug}</p>
            {project.repositoryUrl && (
              <p style={{ color: "#38bdf8", margin: "0.5rem 0 0" }}>{project.repositoryUrl}</p>
            )}
          </Link>
        ))}
        {!isLoading && data?.data?.length === 0 && <p>No projects yet. Seed via API first.</p>}
      </div>
    </main>
  );
}
