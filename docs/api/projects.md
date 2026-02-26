# Projects API

All endpoints require `Authorization: Bearer <token>` obtained from `POST /auth/token`.

## Obtain Token
```bash
curl -X POST http://localhost:4000/auth/token \
  -H "Content-Type: application/json" \
  -d '{"email":"founder@example.com","tenantSlug":"demo"}'
```

## List Projects
```bash
curl http://localhost:4000/api/projects \
  -H "Authorization: Bearer $TOKEN"
```

## Create Project
```bash
curl -X POST http://localhost:4000/api/projects \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Core Storefront",
    "slug": "core-storefront",
    "repositoryUrl": "https://github.com/acme/core-storefront"
  }'
```

## Update Project
```bash
curl -X PUT http://localhost:4000/api/projects/<projectId> \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"defaultBranch":"develop"}'
```

## Delete Project
```bash
curl -X DELETE http://localhost:4000/api/projects/<projectId> \
  -H "Authorization: Bearer $TOKEN"
```
