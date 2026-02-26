# GitHub Connector API

All requests require `Authorization: Bearer $TOKEN` scoped to the tenant/project.

## Create Connector (GitHub PAT)
```bash
curl -X POST http://localhost:4000/api/projects/<projectId>/connectors \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "provider": "github",
    "authType": "pat",
    "repoOwner": "1clicai",
    "repoName": "felix-mvp",
    "token": "ghp_exampletoken1234567890"
  }'
```
> PATs are encrypted at rest; connector APIs never return the token.

## List Connectors for a Project
```bash
curl http://localhost:4000/api/projects/<projectId>/connectors \
  -H "Authorization: Bearer $TOKEN"
```

## Get Connector Detail
```bash
curl http://localhost:4000/api/projects/<projectId>/connectors/<connectorId> \
  -H "Authorization: Bearer $TOKEN"
```

## Update Connector Metadata / Rotate Token
```bash
curl -X PUT http://localhost:4000/api/projects/<projectId>/connectors/<connectorId> \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"token":"ghp_newtoken456"}'
```

## Validate Connector
```bash
curl -X POST http://localhost:4000/api/projects/<projectId>/connectors/<connectorId>/validate \
  -H "Authorization: Bearer $TOKEN"
```
Response returns status + GitHub repo metadata (no secrets).
