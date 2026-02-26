# Connector Ingestion API

## Trigger GitHub Ingestion
```bash
curl -X POST http://localhost:4000/api/projects/<projectId>/connectors/<connectorId>/ingestion-runs \
  -H "Authorization: Bearer $TOKEN"
```
Response contains the queued run record. Ingestion executes asynchronously via BullMQ.

## List Ingestion Runs
```bash
curl http://localhost:4000/api/projects/<projectId>/connectors/<connectorId>/ingestion-runs \
  -H "Authorization: Bearer $TOKEN"
```
Shows latest runs with status (`QUEUED`, `RUNNING`, `SUCCEEDED`, `FAILED`), timestamps, and file counts.
```
}