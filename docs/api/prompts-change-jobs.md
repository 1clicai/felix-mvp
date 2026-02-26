# Prompts & Change Jobs API

## Submit Prompt
```bash
curl -X POST http://localhost:4000/api/prompts \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "projectId": "<projectId>",
    "promptText": "Add a new loyalty widget to the dashboard"
  }'
```
Response includes the saved prompt and queued job IDs.

## List Change Jobs for a Project
```bash
curl http://localhost:4000/api/projects/<projectId>/change-jobs \
  -H "Authorization: Bearer $TOKEN"
```

## Change Job Detail
```bash
curl http://localhost:4000/api/projects/<projectId>/change-jobs/<jobId> \
  -H "Authorization: Bearer $TOKEN"
```

## Simulate Worker Transition
```bash
curl -X POST http://localhost:4000/api/change-jobs/<jobId>/transition \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"status":"RUNNING"}'
```
Allowed statuses: `RUNNING`, `SUCCEEDED`, `FAILED`, `CANCELED`.
