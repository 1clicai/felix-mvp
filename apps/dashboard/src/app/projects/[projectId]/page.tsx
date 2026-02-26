"use client";

import { useCallback, useMemo, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useApiClient } from "../../../lib/api-client";
import { StatusBadge } from "../../../components/status-badge";

interface ProjectResponse {
  data: { id: string; name: string; slug: string; repositoryUrl?: string };
}

interface Connector {
  id: string;
  repoOwner: string;
  repoName: string;
  repoUrl?: string;
  status: string;
  lastValidatedAt?: string;
  lastValidationError?: string;
}

interface ConnectorsResponse {
  data: Connector[];
}

interface PromptSummary {
  overview: string;
  intent: string;
  proposedChanges: Array<{ area: string; description: string }>;
  risks: string[];
  nextSteps: string[];
}

interface Prompt {
  id: string;
  promptText: string;
  status: string;
  category?: string;
  createdAt: string;
  resultSummary?: PromptSummary;
  executionProvider?: string;
  jobs: Array<{ id: string; status: string }>;
}

interface PromptsResponse {
  data: Prompt[];
}

interface JobRecord {
  id: string;
  status: string;
  createdAt: string;
  startedAt?: string;
  completedAt?: string;
  statusReason?: string;
  provider?: string;
  tokenCost?: number;
  metadata?: Record<string, unknown>;
  errorMessage?: string;
}

interface JobsResponse {
  data: JobRecord[];
}

const tabs = ["connectors", "prompts", "jobs"] as const;

export default function ProjectDetailPage() {
  const params = useParams<{ projectId: string }>();
  const searchParams = useSearchParams();
  const router = useRouter();
  const projectId = params.projectId;
  const tabParam = searchParams?.get("tab") ?? "connectors";
  const activeTab = tabs.includes(tabParam as typeof tabs[number]) ? tabParam : "connectors";

  const api = useApiClient();
  const queryClient = useQueryClient();

  const { data: project } = useQuery<ProjectResponse>({
    queryKey: ["project", projectId],
    queryFn: () => api(`/api/projects/${projectId}`),
  });

  const connectorsQuery = useQuery<ConnectorsResponse>({
    queryKey: ["project", projectId, "connectors"],
    queryFn: () => api(`/api/projects/${projectId}/connectors`),
  });

  const promptsQuery = useQuery<PromptsResponse>({
    queryKey: ["project", projectId, "prompts"],
    queryFn: () => api(`/api/projects/${projectId}/prompts`),
  });

  const jobsQuery = useQuery<JobsResponse>({
    queryKey: ["project", projectId, "jobs"],
    queryFn: () => api(`/api/projects/${projectId}/change-jobs`),
    refetchInterval: 8000,
  });

  const [selectedJob, setSelectedJob] = useState<JobRecord | null>(null);

  const setTab = useCallback(
    (next: string) => {
      const url = new URL(window.location.href);
      url.searchParams.set("tab", next);
      router.replace(url.pathname + url.search);
    },
    [router],
  );

  const createConnector = useMutation({
    mutationFn: (payload: { repoOwner: string; repoName: string; token: string }) =>
      api(`/api/projects/${projectId}/connectors`, {
        method: "POST",
        body: JSON.stringify({ provider: "github", authType: "pat", ...payload }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project", projectId, "connectors"] });
    },
  });

  const validateConnector = useMutation({
    mutationFn: (connectorId: string) =>
      api(`/api/projects/${projectId}/connectors/${connectorId}/validate`, { method: "POST" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project", projectId, "connectors"] });
    },
  });

  const submitPrompt = useMutation({
    mutationFn: (payload: { promptText: string; connectorId?: string }) =>
      api(`/api/prompts`, {
        method: "POST",
        body: JSON.stringify({ projectId, ...payload }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project", projectId, "prompts"] });
      queryClient.invalidateQueries({ queryKey: ["project", projectId, "jobs"] });
    },
  });

  const connectorOptions = useMemo(() => connectorsQuery.data?.data ?? [], [connectorsQuery.data]);

  return (
    <main style={{ maxWidth: "1200px", margin: "0 auto", padding: "2rem" }}>
      <button
        onClick={() => router.push("/")}
        style={{ background: "transparent", border: "none", color: "#38bdf8", marginBottom: "0.5rem" }}
      >
        ← Back to projects
      </button>
      <h1 style={{ margin: 0 }}>{project?.data.name ?? "Project"}</h1>
      <p style={{ color: "#94a3b8" }}>{project?.data.repositoryUrl ?? "No repository linked yet"}</p>

      <div style={{ display: "flex", gap: "1rem", marginTop: "2rem", marginBottom: "1.5rem" }}>
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setTab(tab)}
            style={{
              padding: "0.65rem 1.25rem",
              borderRadius: "999px",
              border: "1px solid",
              borderColor: activeTab === tab ? "#22d3ee" : "rgba(148,163,184,0.3)",
              background: activeTab === tab ? "rgba(34,211,238,0.12)" : "transparent",
              color: "#f8fafc",
            }}
          >
            {tab.toUpperCase()}
          </button>
        ))}
      </div>

      {activeTab === "connectors" && (
        <section>
          <h2>GitHub Connectors</h2>
          <p style={{ color: "#94a3b8" }}>Register a repo (PAT only for now).</p>
          <ConnectorForm isLoading={createConnector.isPending} error={createConnector.error as Error | undefined} onSubmit={createConnector.mutateAsync} />

          <div style={{ marginTop: "2rem", display: "grid", gap: "1rem" }}>
            {connectorsQuery.isLoading && <p>Loading connectors…</p>}
            {connectorsQuery.data?.data.map((connector) => (
              <article
                key={connector.id}
                style={{
                  padding: "1rem",
                  borderRadius: "1rem",
                  border: "1px solid rgba(148,163,184,0.3)",
                  background: "rgba(15,23,42,0.6)",
                  display: "flex",
                  justifyContent: "space-between",
                  gap: "1rem",
                }}
              >
                <div>
                  <h3 style={{ margin: 0 }}>
                    {connector.repoOwner}/{connector.repoName}
                  </h3>
                  <p style={{ color: "#94a3b8", margin: "0.25rem 0" }}>{connector.repoUrl}</p>
                  <StatusBadge status={connector.status} />
                  {connector.lastValidationError && (
                    <p style={{ color: "#f87171" }}>Last error: {connector.lastValidationError}</p>
                  )}
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                  <button
                    onClick={() => validateConnector.mutate(connector.id)}
                    style={{
                      borderRadius: "0.75rem",
                      border: "1px solid rgba(148,163,184,0.4)",
                      background: "transparent",
                      color: "#f8fafc",
                      padding: "0.5rem 1rem",
                    }}
                  >
                    Validate
                  </button>
                  {connector.lastValidatedAt && (
                    <small style={{ color: "#94a3b8" }}>
                      Last validated {new Date(connector.lastValidatedAt).toLocaleString()}
                    </small>
                  )}
                </div>
              </article>
            ))}
            {!connectorsQuery.isLoading && connectorsQuery.data?.data.length === 0 && <p>No connectors yet.</p>}
          </div>
        </section>
      )}

      {activeTab === "prompts" && (
        <section>
          <h2>Prompts</h2>
          <PromptForm
            connectors={connectorOptions}
            isSubmitting={submitPrompt.isPending}
            error={submitPrompt.error as Error | undefined}
            onSubmit={(payload) => submitPrompt.mutateAsync(payload)}
          />
          <div style={{ marginTop: "2rem", display: "grid", gap: "1rem" }}>
            {promptsQuery.isLoading && <p>Loading prompts…</p>}
            {promptsQuery.data?.data.map((prompt) => (
              <article key={prompt.id} style={{ border: "1px solid rgba(148,163,184,0.3)", borderRadius: "1rem", padding: "1rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <StatusBadge status={prompt.status} />
                  <span style={{ color: "#94a3b8", fontSize: "0.85rem" }}>
                    {new Date(prompt.createdAt).toLocaleString()}
                  </span>
                </div>
                <p style={{ marginTop: "0.75rem" }}>{prompt.promptText}</p>
                {prompt.resultSummary ? (
                  <PromptSummaryCard summary={prompt.resultSummary} provider={prompt.executionProvider} />
                ) : (
                  <p style={{ color: "#94a3b8", fontSize: "0.9rem" }}>Awaiting plan generation…</p>
                )}
                {prompt.jobs?.length ? (
                  <div style={{ marginTop: "0.5rem", color: "#94a3b8", fontSize: "0.9rem" }}>
                    Linked jobs: {prompt.jobs.map((job) => job.status).join(", ")}
                  </div>
                ) : null}
              </article>
            ))}
            {!promptsQuery.isLoading && promptsQuery.data?.data.length === 0 && <p>No prompts yet.</p>}
          </div>
        </section>
      )}

      {activeTab === "jobs" && (
        <section>
          <h2>Change Jobs</h2>
          {jobsQuery.isLoading && <p>Loading jobs…</p>}
          <div style={{ display: "grid", gap: "1rem" }}>
            {jobsQuery.data?.data.map((job) => (
              <article key={job.id} style={{ padding: "1rem", borderRadius: "1rem", border: "1px solid rgba(148,163,184,0.3)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <h3 style={{ margin: 0 }}>{job.id.slice(0, 8)}</h3>
                    <p style={{ color: "#94a3b8", margin: 0 }}>Queued {new Date(job.createdAt).toLocaleString()}</p>
                  </div>
                  <StatusBadge status={job.status} />
                </div>
                {job.statusReason && <p style={{ color: "#94a3b8" }}>Reason: {job.statusReason}</p>}
                <button
                  onClick={() => setSelectedJob(job)}
                  style={{
                    marginTop: "0.5rem",
                    borderRadius: "0.75rem",
                    border: "1px solid rgba(148,163,184,0.3)",
                    background: "transparent",
                    color: "#f8fafc",
                    padding: "0.4rem 0.9rem",
                  }}
                >
                  View details
                </button>
              </article>
            ))}
            {!jobsQuery.isLoading && jobsQuery.data?.data.length === 0 && <p>No jobs yet.</p>}
          </div>
          {selectedJob && (
            <JobDetailModal job={selectedJob} onClose={() => setSelectedJob(null)} />
          )}
        </section>
      )}
    </main>
  );
}

function ConnectorForm({
  isLoading,
  error,
  onSubmit,
}: {
  isLoading: boolean;
  error?: Error;
  onSubmit: (payload: { repoOwner: string; repoName: string; token: string }) => Promise<unknown>;
}) {
  const [form, setForm] = useState({ repoOwner: "", repoName: "", token: "" });

  return (
    <form
      onSubmit={async (event) => {
        event.preventDefault();
        await onSubmit(form);
        setForm({ repoOwner: "", repoName: "", token: "" });
      }}
      style={{
        display: "grid",
        gap: "0.75rem",
        maxWidth: "600px",
        marginTop: "1rem",
        padding: "1rem",
        borderRadius: "1rem",
        border: "1px solid rgba(148,163,184,0.3)",
      }}
    >
      <div style={{ display: "flex", gap: "0.75rem" }}>
        <input
          required
          placeholder="Repo owner"
          value={form.repoOwner}
          onChange={(event) => setForm((prev) => ({ ...prev, repoOwner: event.target.value }))}
          style={{ flex: 1, padding: "0.75rem", borderRadius: "0.75rem", border: "1px solid rgba(148,163,184,0.3)", background: "transparent", color: "#f8fafc" }}
        />
        <input
          required
          placeholder="Repo name"
          value={form.repoName}
          onChange={(event) => setForm((prev) => ({ ...prev, repoName: event.target.value }))}
          style={{ flex: 1, padding: "0.75rem", borderRadius: "0.75rem", border: "1px solid rgba(148,163,184,0.3)", background: "transparent", color: "#f8fafc" }}
        />
      </div>
      <textarea
        required
        placeholder="GitHub PAT"
        value={form.token}
        onChange={(event) => setForm((prev) => ({ ...prev, token: event.target.value }))}
        rows={2}
        style={{ padding: "0.75rem", borderRadius: "0.75rem", border: "1px solid rgba(148,163,184,0.3)", background: "transparent", color: "#f8fafc" }}
      />
      {error && <p style={{ color: "#f87171" }}>{error.message}</p>}
      <button
        type="submit"
        disabled={isLoading}
        style={{
          justifySelf: "flex-start",
          padding: "0.65rem 1.5rem",
          borderRadius: "0.75rem",
          border: 0,
          background: isLoading ? "#1e293b" : "#22d3ee",
          color: isLoading ? "#94a3b8" : "#082f49",
          fontWeight: 600,
        }}
      >
        {isLoading ? "Saving…" : "Save connector"}
      </button>
    </form>
  );
}

function PromptForm({
  connectors,
  isSubmitting,
  error,
  onSubmit,
}: {
  connectors: Connector[];
  isSubmitting: boolean;
  error?: Error;
  onSubmit: (payload: { promptText: string; connectorId?: string }) => Promise<unknown>;
}) {
  const [promptText, setPromptText] = useState("");
  const [connectorId, setConnectorId] = useState<string>("");

  return (
    <form
      onSubmit={async (event) => {
        event.preventDefault();
        await onSubmit({ promptText, connectorId: connectorId || undefined });
        setPromptText("");
      }}
      style={{
        display: "grid",
        gap: "0.75rem",
        border: "1px solid rgba(148,163,184,0.3)",
        borderRadius: "1rem",
        padding: "1rem",
        maxWidth: "700px",
      }}
    >
      <textarea
        required
        value={promptText}
        onChange={(event) => setPromptText(event.target.value)}
        placeholder="Describe the change you want in plain language"
        rows={4}
        style={{ padding: "0.75rem", borderRadius: "0.75rem", border: "1px solid rgba(148,163,184,0.3)", background: "transparent", color: "#f8fafc" }}
      />
      <select
        value={connectorId}
        onChange={(event) => setConnectorId(event.target.value)}
        style={{ padding: "0.65rem", borderRadius: "0.75rem", border: "1px solid rgba(148,163,184,0.3)", background: "transparent", color: "#f8fafc" }}
      >
        <option value="">Link connector (optional)</option>
        {connectors.map((connector) => (
          <option key={connector.id} value={connector.id}>
            {connector.repoOwner}/{connector.repoName}
          </option>
        ))}
      </select>
      {error && <p style={{ color: "#f87171" }}>{error.message}</p>}
      <button
        type="submit"
        disabled={isSubmitting}
        style={{
          justifySelf: "flex-start",
          padding: "0.65rem 1.5rem",
          borderRadius: "0.75rem",
          border: 0,
          background: isSubmitting ? "#1e293b" : "#22d3ee",
          color: isSubmitting ? "#94a3b8" : "#082f49",
          fontWeight: 600,
        }}
      >
        {isSubmitting ? "Submitting…" : "Submit prompt"}
      </button>
    </form>
  );
}

function PromptSummaryCard({ summary, provider }: { summary: PromptSummary; provider?: string }) {
  return (
    <div style={{ marginTop: "1rem", border: "1px solid rgba(34,211,238,0.3)", borderRadius: "1rem", padding: "1rem", background: "rgba(15,23,42,0.4)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <p style={{ margin: 0, fontWeight: 600 }}>LLM Plan</p>
        {provider && <small style={{ color: "#94a3b8" }}>Provider: {provider}</small>}
      </div>
      <p style={{ color: "#cbd5f5" }}>{summary.overview}</p>
      <div style={{ marginTop: "0.5rem" }}>
        <strong>Intent:</strong>
        <p style={{ margin: "0.25rem 0 0", color: "#94a3b8" }}>{summary.intent}</p>
      </div>
      {summary.proposedChanges.length > 0 && (
        <div style={{ marginTop: "0.5rem" }}>
          <strong>Proposed changes</strong>
          <ul>
            {summary.proposedChanges.map((change, index) => (
              <li key={`${change.area}-${index}`} style={{ color: "#cbd5f5" }}>
                <span style={{ color: "#38bdf8" }}>{change.area}:</span> {change.description}
              </li>
            ))}
          </ul>
        </div>
      )}
      {summary.risks.length > 0 && (
        <div style={{ marginTop: "0.5rem" }}>
          <strong>Risks</strong>
          <ul>
            {summary.risks.map((risk, index) => (
              <li key={`risk-${index}`} style={{ color: "#f87171" }}>
                {risk}
              </li>
            ))}
          </ul>
        </div>
      )}
      {summary.nextSteps.length > 0 && (
        <div style={{ marginTop: "0.5rem" }}>
          <strong>Next steps</strong>
          <ul>
            {summary.nextSteps.map((step, index) => (
              <li key={`step-${index}`} style={{ color: "#94a3b8" }}>
                {step}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function JobDetailModal({ job, onClose }: { job: JobRecord; onClose: () => void }) {
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(5,6,10,0.85)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 50,
        padding: "1rem",
      }}
      onClick={onClose}
    >
      <div
        onClick={(event) => event.stopPropagation()}
        style={{
          width: "min(600px, 95vw)",
          background: "#0f172a",
          borderRadius: "1rem",
          padding: "1.5rem",
          border: "1px solid rgba(148,163,184,0.3)",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h3 style={{ margin: 0 }}>Job {job.id}</h3>
          <StatusBadge status={job.status} />
        </div>
        <p style={{ color: "#94a3b8" }}>Queued {new Date(job.createdAt).toLocaleString()}</p>
        {job.startedAt && <p style={{ color: "#94a3b8" }}>Started {new Date(job.startedAt).toLocaleString()}</p>}
        {job.completedAt && <p style={{ color: "#94a3b8" }}>Completed {new Date(job.completedAt).toLocaleString()}</p>}
        {job.provider && <p style={{ color: "#94a3b8" }}>Provider: {job.provider}</p>}
        {typeof job.tokenCost === "number" && <p style={{ color: "#94a3b8" }}>Tokens used: {job.tokenCost}</p>}
        {job.errorMessage && <p style={{ color: "#f87171" }}>Error: {job.errorMessage}</p>}
        {job.metadata && Object.keys(job.metadata).length > 0 && (
          <details style={{ marginTop: "1rem" }}>
            <summary style={{ cursor: "pointer" }}>Metadata</summary>
            <pre style={{ background: "#020617", padding: "0.75rem", borderRadius: "0.75rem", color: "#94a3b8" }}>
              {JSON.stringify(job.metadata, null, 2)}
            </pre>
          </details>
        )}
        <button
          onClick={onClose}
          style={{
            marginTop: "1rem",
            borderRadius: "0.75rem",
            border: 0,
            background: "#22d3ee",
            color: "#082f49",
            fontWeight: 600,
            padding: "0.6rem 1.25rem",
          }}
        >
          Close
        </button>
      </div>
    </div>
  );
}
