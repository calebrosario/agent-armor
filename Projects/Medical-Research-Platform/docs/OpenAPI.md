Below is a **complete OpenAPI v3 (YAML)** document that describes the API we sketched in the previous answer.
Drop it into a file called `api‑docs.yaml` (or `api‑docs.json` if you prefer) and expose it via `/api-docs` in the
Express app.
The spec is ready to be picked up by **Swagger‑UI** or any other OpenAPI‑compatible UI.

---

## 📄 `api‑docs.yaml`

```yaml
openapi: 3.0.3
info:
  title: Consent‑Hub API
  version: 1.0.0
  description: |
    A Node.js / PostgreSQL service that lets patients (or their agents) fill out
    HIPAA, GDPR, and CCPA consent forms, sign them, and retrieve signed PDFs.
    All mutations are ACID‑compliant and heavy work is off‑loaded to a BullMQ
    queue that workers consume.

servers:
  - url: https://api.consent‑hub.example.com
    description: Production
  - url: http://localhost:4000
    description: Local development

tags:
  - name: Consent Definitions
    description: Publicly available form templates (HIPAA, GDPR, CCPA, …)
  - name: Consents
    description: End‑to‑end lifecycle of a signed consent
  - name: Misc
    description: Helper endpoints (e.g., API audit)

components:
  securitySchemes:
    bearerAuth:
      type: http
      scheme: bearer
      bearerFormat: JWT

  schemas:
    # ----------------------------------------------------
    #  Consent Form Definition
    # ----------------------------------------------------
    ConsentDefinition:
      type: object
      required:
        - id
        - name
        - form_type
        - version
        - schema_json
        - created_at
      properties:
        id:
          type: integer
          format: int64
        name:
          type: string
          description: Human readable name (e.g. "HIPAA Auth 2025")
        form_type:
          type: string
          enum: [HIPAA, GDPR, CCPA]
          description: The compliance domain
        version:
          type: integer
          description: Incremented when the form is updated
        schema_json:
          type: object
          description: JSON‑Schema that the front‑end can use to render the form
        created_at:
          type: string
          format: date-time

    # ----------------------------------------------------
    #  Consent (the signed record)
    # ----------------------------------------------------
    Consent:
      type: object
      required:
        - id
        - user_id
        - form_def_id
        - status
        - created_at
      properties:
        id:
          type: integer
          format: int64
        user_id:
          type: integer
          format: int64
        form_def_id:
          type: integer
          format: int64
        answers:
          type: object
          description: Raw answers supplied by the user (JSONB in the DB)
        signed_at:
          type: string
          format: date-time
          nullable: true
        expires_at:
          type: string
          format: date-time
          nullable: true
        signed_hash:
          type: string
          description: SHA‑256 hash of the signed PDF
          nullable: true
        status:
          type: string
          enum: [pending, active, revoked, expired]
        version:
          type: integer
          description: The form version at the time of signing
        created_at:
          type: string
          format: date-time
        updated_at:
          type: string
          format: date-time

    # ----------------------------------------------------
    #  Request/Response DTOs
    # ----------------------------------------------------
    CreateConsentRequest:
      type: object
      required:
        - form_def_id
        - answers
      properties:
        form_def_id:
          type: integer
          format: int64
        answers:
          type: object
          description: Must conform to the JSON‑Schema of the selected form

    UpdateConsentRequest:
      type: object
      required:
        - answers
      properties:
        answers:
          type: object
          description: New answers (only allowed if status == pending)

    SignConsentResponse:
      type: object
      properties:
        job_id:
          type: string
          description: BullMQ job identifier

    ErrorResponse:
      type: object
      properties:
        status:
          type: integer
          example: 400
        message:
          type: string
          example: "Invalid input"
        details:
          type: array
          items:
            type: string

    # ----------------------------------------------------
    #  Pagination
    # ----------------------------------------------------
    PaginatedConsents:
      type: object
      properties:
        page:
          type: integer
          example: 1
        limit:
          type: integer
          example: 20
        total:
          type: integer
          example: 125
        items:
          type: array
          items:
            $ref: "#/components/schemas/Consent"

  responses:
    # Generic responses
    401:
      description: Unauthorized – missing or invalid JWT
      content:
        application/json:
          schema:
            $ref: "#/components/schemas/ErrorResponse"
    404:
      description: Resource not found
      content:
        application/json:
          schema:
            $ref: "#/components/schemas/ErrorResponse"
    400:
      description: Bad request – validation failed
      content:
        application/json:
          schema:
            $ref: "#/components/schemas/ErrorResponse"
    500:
      description: Internal server error
      content:
        application/json:
          schema:
            $ref: "#/components/schemas/ErrorResponse"

paths:
  # ----------------------------------------------------
  #  Consent Definition Endpoints
  # ----------------------------------------------------
  /api/consent-definitions:
    get:
      tags:
        - Consent Definitions
      summary: List all form templates
      description: |
        Returns every available consent form definition (HIPAA, GDPR, CCPA, etc.).
        The client uses the `schema_json` to build a dynamic form.
      operationId: listConsentDefinitions
      security:
        - bearerAuth: []
      responses:
        "200":
          description: Successful response
          content:
            application/json:
              schema:
                type: array
                items:
                  $ref: "#/components/schemas/ConsentDefinition"

  # ----------------------------------------------------
  #  Consent Endpoints
  # ----------------------------------------------------
  /api/consents:
    post:
      tags:
        - Consents
      summary: Create a new pending consent
      description: |
        The user submits answers for a chosen form.
        The record is created with `status=pending` and a worker will sign it
        when the user hits the “Sign” button.
      operationId: createConsent
      security:
        - bearerAuth: []
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: "#/components/schemas/CreateConsentRequest"
      responses:
        "201":
          description: Consent created
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/Consent"
        "400":
          $ref: "#/components/responses/400"
        "401":
          $ref: "#/components/responses/401"
        "500":
          $ref: "#/components/responses/500"

    get:
      tags:
        - Consents
      summary: List a user’s consents (paginated)
      description: |
        Returns the current user’s consents, optionally filtered by status.
      operationId: listUserConsents
      security:
        - bearerAuth: []
      parameters:
        - name: page
          in: query
          schema:
            type: integer
            default: 1
          description: Page number
        - name: limit
          in: query
          schema:
            type: integer
            default: 20
            maximum: 100
          description: Items per page
        - name: status
          in: query
          schema:
            type: string
            enum: [pending, active, revoked, expired]
          description: Filter by status
      responses:
        "200":
          description: Paginated list
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/PaginatedConsents"
        "401":
          $ref: "#/components/responses/401"
        "500":
          $ref: "#/components/responses/500"

  /api/consents/{consentId}:
    parameters:
      - $ref: "#/components/parameters/consentId"
    get:
      tags:
        - Consents
      summary: Retrieve a single consent
      description: |
        The user’s signed record is returned.
        The signed PDF is available via `/pdf`.
      operationId: getConsent
      security:
        - bearerAuth: []
      responses:
        "200":
          description: Consent details
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/Consent"
        "401":
          $ref: "#/components/responses/401"
        "404":
          $ref: "#/components/responses/404"

    patch:
      tags:
        - Consents
      summary: Edit answers on a pending consent
      description: |
        Allowed only while `status=pending`.
        Validation is performed against the form’s JSON‑Schema.
      operationId: updateConsent
      security:
        - bearerAuth: []
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: "#/components/schemas/UpdateConsentRequest"
      responses:
        "200":
          description: Consent updated
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/Consent"
        "400":
          $ref: "#/components/responses/400"
        "401":
          $ref: "#/components/responses/401"
        "404":
          $ref: "#/components/responses/404"
        "500":
          $ref: "#/components/responses/500"

    delete:
      tags:
        - Consents
      summary: Revoke a signed consent
      description: |
        Only `status=active` consents can be revoked.
        The record is updated atomically and the audit trail is preserved.
      operationId: revokeConsent
      security:
        - bearerAuth: []
      responses:
        "204":
          description: Consent revoked – no body
        "401":
          $ref: "#/components/responses/401"
        "404":
          $ref: "#/components/responses/404"
        "500":
          $ref: "#/components/responses/500"

  /api/consents/{consentId}/sign:
    post:
      tags:
        - Consents
      summary: Queue a signing job
      description: |
        After the user presses “Sign” the API simply queues a BullMQ job.
        The worker will generate the signed PDF, update the consent and
        write the `signed_hash`.
      operationId: signConsent
      security:
        - bearerAuth: []
      responses:
        "202":
          description: Job queued
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/SignConsentResponse"
        "400":
          $ref: "#/components/responses/400"
        "401":
          $ref: "#/components/responses/401"
        "404":
          $ref: "#/components/responses/404"
        "500":
          $ref: "#/components/responses/500"

  /api/consents/{consentId}/pdf:
    get:
      tags:
        - Consents
      summary: Download the signed PDF
      description: |
        The PDF is stored in S3 (or any object store).
        The URL can be either a direct S3 link or a temporary signed URL.
      operationId: getConsentPdf
      security:
        - bearerAuth: []
      responses:
        "200":
          description: PDF stream
          content:
            application/pdf:
              schema:
                type: string
                format: binary
        "401":
          $ref: "#/components/responses/401"
        "404":
          $ref: "#/components/responses/404"
        "500":
          $ref: "#/components/responses/500"

  # ----------------------------------------------------
  #  Miscellaneous Endpoints
  # ----------------------------------------------------
  /api/audit:
    get:
      tags:
        - Misc
      summary: List recent API calls (for debugging only)
      description: |
        Returns the last N audit records.  Only meant for internal dashboards.
      operationId: listAuditLogs
      security:
        - bearerAuth: []
      parameters:
        - name: limit
          in: query
          schema:
            type: integer
            default: 50
          description: Number of rows
      responses:
        "200":
          description: Audit log slice
          content:
            application/json:
              schema:
                type: array
                items:
                  type: object
                  properties:
                    id:
                      type: integer
                    method:
                      type: string
                    path:
                      type: string
                    status:
                      type: integer
                    user_id:
                      type: integer
                    ts:
                      type: string
                      format: date-time
        "401":
          $ref: "#/components/responses/401"
        "500":
          $ref: "#/components/responses/500"
```

> **Tip** – If you prefer JSON, just run `yaml2json < api‑docs.yaml > api‑docs.json`.

---

## 🛠  How to Wire It Up

### 1. Install the UI

```bash
npm install swagger-ui-express js-yaml
```

### 2. Add the route to your Express app

```ts
import fs from 'fs';
import yaml from 'js-yaml';
import swaggerUi from 'swagger-ui-express';

const swaggerDocument = yaml.load(
  fs.readFileSync('./api‑docs.yaml', 'utf8')
);

app.use(
  '/api-docs',
  swaggerUi.serve,
  swaggerUi.setup(swaggerDocument, {
    explorer: true,          # lets you click “Explore” in the UI
    swaggerOptions: {
      docExpansion: 'none',   # collapse all sections by default
    },
  })
);
```

### 3. Run

```bash
docker‑compose up
```

Open your browser at `http://localhost:4000/api-docs` and you’ll see the
full, interactive API documentation.

---

## 🎉  What’s Covered

| Endpoint | Purpose |
|----------|---------|
| `GET /api/consent-definitions` | List all form templates (public) |
| `POST /api/consents` | Create a pending consent |
| `GET /api/consents` | List the authenticated user’s consents (paginated) |
| `GET /api/consents/{id}` | Retrieve one consent |
| `PATCH /api/consents/{id}` | Edit answers (only while pending) |
| `DELETE /api/consents/{id}` | Revoke a signed consent |
| `POST /api/consents/{id}/sign` | Queue a signing job |
| `GET /api/consents/{id}/pdf` | Download the signed PDF |
| `GET /api/consent‑definitions` | (Same as first) |
| `GET /api/audit` | (Optional) View recent API calls |

All routes are protected with **JWT bearer authentication** (`bearerAuth`).
The spec also ships with **standard error responses** (`400`, `401`, `404`, `500`) so that the UI can display
useful messages.
