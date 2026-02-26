# Prompts API

## Submit Prompt (auto-creates Change Job)
```bash
curl -X POST http://localhost:4000/api/prompts \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "projectId": "<projectId>",
    "connectorId": "<connectorId optional>",
    "promptText": "Add a customer loyalty widget to the dashboard",
    "category": "ui-change"
  }'
```
Response includes `{ prompt, job }` objects (no secrets).

## List Prompts By Project
```bash
curl http://localhost:4000/api/projects/<projectId>/prompts \
  -H "Authorization: Bearer $TOKEN"
```

## Prompt Detail (with linked jobs)
```bash
curl http://localhost:4000/api/projects/<projectId>/prompts/<promptId> \
  -H "Authorization: Bearer $TOKEN"
```
