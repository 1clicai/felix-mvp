# Change Jobs API

Jobs are created automatically when prompts are submitted. Use these endpoints to inspect progress.

## List Jobs for a Project
```bash
curl http://localhost:4000/api/projects/<projectId>/change-jobs \
  -H "Authorization: Bearer $TOKEN"
```

## Job Detail
```bash
curl http://localhost:4000/api/projects/<projectId>/change-jobs/<jobId> \
  -H "Authorization: Bearer $TOKEN"
```

## Simulate Worker Transition (MVP)
Stub workers run automatically, but you can force a transition via:
```bash
curl -X POST http://localhost:4000/api/change-jobs/<jobId>/transition \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"status":"RUNNING"}'
```
Allowed statuses: `RUNNING`, `SUCCEEDED`, `FAILED`, `CANCELED`.
