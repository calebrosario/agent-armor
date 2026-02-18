## 📑 1️⃣  Top 10 Legal Forms Most Often Used by Attorneys
*(sorted by usage frequency in U.S. law‑practice)*

| # | Form | Typical Purpose | When It’s Sent |
|---|------|-----------------|----------------|
| 1 | **Power of Attorney (POA)** | Grants another person the legal authority to act on your behalf. | Real‑estate closings, medical decisions, tax filings. |
| 2 | **Affidavit of Support (I‑864)** | Confirms that an immigrant’s sponsor can financially support them. | U.S. visa/green‑card petitions. |
| 3 | **Non‑Disclosure Agreement (NDA)** | Protects confidential information during negotiations. | M&A, partnership discussions, tech licensing. |
| 4 | **Employment Contract** | Outlines terms of employment and duties. | Hiring of employees, independent contractors. |
| 5 | **Lease Agreement** | Governs rental or lease of property. | Commercial or residential rentals. |
| 6 | **Settlement Agreement** | Resolves a dispute without trial. | Litigation, civil claims. |
| 7 | **Wills & Last Will & Testament** | Directs disposition of assets after death. | Estate planning. |
| 8 | **Living Will / Advance Directive** | Specifies medical treatment preferences. | End‑of‑life care planning.
|
| 9 | **Release of Liability / Indemnity Agreement** | Frees a party from future claims. | Service contracts, event contracts. |
| 10 | **Business Formation Documents (LLC/Corp)** | Creates a legal business entity. | Starting a new company. |

> These forms are **static templates** – attorneys rarely “fill them out” via a web UI.
> In a SaaS platform you can turn them into *editable* templates (see the next section).

---

## 📌 2️⃣  New API Route for “Filling Out & Sending” a Legal Form

### 2.1  Data Model

```sql
-- legal_forms – stores the template definition
CREATE TABLE legal_forms (
    id          SERIAL PRIMARY KEY,
    name        TEXT NOT NULL,
    description TEXT,
    version     INT NOT NULL DEFAULT 1,
    schema_json JSONB NOT NULL  -- a JSON‑Schema for the editable fields
);

-- legal_form_responses – stores each attorney’s completed instance
CREATE TABLE legal_form_responses (
    id              SERIAL PRIMARY KEY,
    form_id         INT REFERENCES legal_forms(id) ON DELETE CASCADE,
    customer_id     INT NOT NULL,                      -- the party who fills the form
    filled_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    answers         JSONB NOT NULL,                    -- raw, validated answers
    signed_hash     TEXT,                              -- e.g. SHA‑256 of the signed PDF
    status          TEXT NOT NULL DEFAULT 'draft',      -- draft / sent / delivered / signed
    email_to        TEXT NOT NULL,                      -- primary recipient
    email_subject   TEXT,
    email_body      TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

> We reuse the **JSON‑Schema pattern** you already have for consents, but now in `legal_forms`.
> The *answers* column stores the patient/attorney‑entered data; we’ll sign it with the same PDF‑generation
workflow.

### 2.2  OpenAPI 3.0 Specification (new parts)

```yaml
paths:
  /api/legal-forms:
    get:
      summary: List the most common legal form templates
      tags: [Legal Forms]
      responses:
        '200':
          description: An array of legal form metadata
          content:
            application/json:
              schema:
                type: array
                items:
                  $ref: '#/components/schemas/LegalFormSummary'
    post:
      summary: Create a new legal form template (admin only)
      tags: [Legal Forms]
      security:
        - bearerAuth: []
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/LegalFormCreate'
      responses:
        '201':
          description: Created
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/LegalForm'

  /api/legal-forms/{formId}:
    get:
      summary: Retrieve a single legal form template
      tags: [Legal Forms]
      parameters:
        - in: path
          name: formId
          schema: { type: integer }
          required: true
      responses:
        '200':
          description: Legal form definition
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/LegalForm'

  /api/legal-forms/{formId}/fill:
    post:
      summary: Fill out an existing legal form and send it by email
      tags: [Legal Forms]
      parameters:
        - in: path
          name: formId
          schema: { type: integer }
          required: true
      requestBody:
        required: true
        description: |
          *answers* must match the `schema_json` of the form with the given `formId`.
          The server validates the payload, creates a signed PDF, and pushes the email via the same worker
pipeline you already use for consents.
        content:
          application/json:
            schema:
              type: object
              required:
                - answers
                - email_to
              properties:
                answers:
                  type: object
                  description: “Key‑value” pairs that map to the template’s JSON‑Schema.
                email_to:
                  type: string
                  format: email
                  description: Primary recipient of the completed form
                email_subject:
                  type: string
                  default: "Completed {form_name}"
                email_body:
                  type: string
                  description: Optional custom message that will appear above the PDF attachment
                cc:
                  type: array
                  items: { type: string, format: email }
                bcc:
                  type: array
                  items: { type: string, format: email }
      responses:
        '202':
          description: |
            Accepted – the request is queued for PDF generation & email delivery.
            Returns a `LegalFormResponse` preview (incl. the signed PDF URL).
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/LegalFormResponse'
        '400':
          description: Validation error – payload does not satisfy the form’s JSON‑Schema.
        '404':
          description: The requested `formId` does not exist.
        '500':
          description: Unexpected server error.

components:
  schemas:
    LegalFormSummary:
      type: object
      properties:
        id:          { type: integer }
        name:        { type: string }
        description: { type: string }
        version:     { type: integer }
      required: [id, name, version]

    LegalForm:
      type: object
      properties:
        id:          { type: integer }
        name:        { type: string }
        description: { type: string }
        version:     { type: integer }
        schema_json: { type: object }
      required: [id, name, version, schema_json]

    LegalFormCreate:
      type: object
      properties:
        name:        { type: string }
        description: { type: string }
        schema_json: { type: object }
      required: [name, schema_json]

    LegalFormResponse:
      type: object
      properties:
        id:              { type: integer }
        form_id:         { type: integer }
        customer_id:     { type: integer }
        answers:         { type: object }
        signed_pdf_url:  { type: string, format: uri }
        status:          { type: string }
        created_at:      { type: string, format: date-time }
        delivered_at:    { type: string, format: date-time, nullable: true }
        delivered_to:    { type: string }
        delivery_log:    { type: array, items: { type: string } }
      required: [id, form_id, answers, signed_pdf_url, status, created_at]

securitySchemes:
  bearerAuth:
    type: http
    scheme: bearer
    bearerFormat: JWT
```

---

## 🏗️ 3️⃣  How the New Route Fits Into the Existing App

| Layer | What Happens | Where it Lives |
|-------|--------------|----------------|
| **Request** | Attorney (or end‑user) submits JSON that satisfies the form’s `schema_json`. | `POST /api/legal-forms/{formId}/fill` |
| **Validation** | The same JSON‑Schema validation you use for consents (`ajv`, `zod`, etc.). | Backend (Express/ Nest/ Fastify). |
| **Storage** | Persist a *response* record in `legal_form_responses`. | PostgreSQL (`legal_form_responses` table). |
| **PDF Generation** | Same worker that signs consents (uses `pdf-lib`, `html-pdf`, etc.) | Worker queue (BullMQ/Redis). |
| **Email** | Push an email job (nodemailer, SES, SendGrid). | Worker queue; `email_to`, `cc`, `bcc`, `email_body`. |
| **Return** | Immediately reply with a `202` and a preview of the signed PDF URL. | Client can poll `/api/legal-form-responses/{id}` to check status. |

### Optional Enhancements

| Feature | Why it matters | How to add |
|---------|----------------|------------|
| **Template versioning** | Attorneys may change language over time. | Add `version` column in `legal_forms`. |
| **Signature‑hash** | Verify that the PDF wasn’t tampered with after signing. | Store a SHA‑256 of the signed PDF; expose in the response. |
| **Audit trail** | Legal compliance requires knowing who did what and when. | Add `created_by`, `updated_by` foreign keys to `legal_form_responses`. |
| **Multi‑step wizard** | Some forms (e.g., NDAs) have long sections that benefit from progressive disclosure. | The UI can break the schema into pages; the API only needs to accept the full JSON. |
| **Doc‑Signing integration** | Many firms use DocuSign/Adobe Sign. | Include an `external_service` field and a
“send to DocuSign” sub‑route. |

---

## 🎯 Quick Example: “Filling Out an NDA”

```bash
curl -X POST "https://api.myplatform.com/api/legal-forms/3/fill" \
  -H "Authorization: Bearer <JWT>" \
  -H "Content-Type: application/json" \
  -d '{
        "answers": {
          "disclosing_party": "Acme Corp.",
          "receiving_party": "Beta LLC",
          "confidential_information": ["source code", "proprietary process"],
          "term": "5 years",
          "jurisdiction": "State of California"
        },
        "email_to": "beta@betallc.com",
        "email_subject": "NDA between Acme Corp. & Beta LLC",
        "email_body": "Please find the signed NDA attached."
      }'
```

> **Response (202 Accepted)**
> ```json
> {
>   "id": 1024,
>   "form_id": 3,
>   "customer_id": 567,
>   "answers": { … },
>   "signed_pdf_url": "https://cdn.myplatform.com/pdfs/1024.pdf",
>   "status": "draft",
>   "created_at": "2025-09-15T12:34:56Z",
>   "delivered_at": null,
>   "delivered_to": "beta@betallc.com",
>   "delivery_log": []
> }
> ```

After the worker finishes signing the PDF and sending the email, the `status` will flip to `sent` (or `delivered`)
and the client can poll the `/api/legal-form-responses/{id}` endpoint to see the final state.

---

### TL;DR

| ✅  | Item |
|----|------|
| 1 | **10 most‑used legal forms** – list above. |
| 2 | **New API route** (`POST /api/legal-forms/{formId}/fill`) that: <br>• Accepts a JSON payload that matches the form’s JSON‑Schema.<br>• Persists the response, signs a PDF, and emails it. |
| 3 | **Schema & data model** ready to plug into your existing consent/worker pipeline. |

Feel free to copy‑paste the OpenAPI snippet into your `consent`‑oriented `paths` section, or let me know if you’d
like the full `openapi.yaml` file regenerated.


Below are **10 ready‑to‑drop React‑JSON‑Schema‑Form (RJSF)** templates.
Each one is a plain **JSON‑Schema** (Draft‑07) that can be passed to `<Form schema={...} />`.
Feel free to tweak the fields, add `ui:options`, or split the schema into “pages” with a wizard‑style form.

> **Tip** – For the *Power‑of‑Attorney* and *Will* templates you’ll usually need an **electronic signature field**.
> RJSF doesn’t ship one out of the box, but you can replace the `signature` field with a custom widget that captures a typed name or draws a signature.

---

## 1️⃣ Power of Attorney (POA)

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "Power of Attorney",
  "type": "object",
  "required": ["principal_name","principal_dob","agent_name","agent_dob","authority_type","signature","signature_date"],
  "properties": {
    "principal_name": { "type":"string", "title":"Principal Full Name" },
    "principal_dob":   { "type":"string", "format":"date", "title":"Principal DOB" },
    "principal_address": { "type":"string", "title":"Principal Address" },

    "agent_name": { "type":"string", "title":"Agent (Attorney) Full Name" },
    "agent_dob":   { "type":"string", "format":"date", "title":"Agent DOB" },
    "agent_address": { "type":"string", "title":"Agent Address" },

    "authority_type": {
      "type":"string",
      "title":"Scope of Authority",
      "enum":["General","Specific","Durable","Limited"],
      "default":"General"
    },

    "specific_authority": {
      "type":"string",
      "title":"Specific Authority (if selected)",
      "description":"E.g., \"Financial, Medical, Real‑Estate\""
    },

    "effective_date": { "type":"string", "format":"date", "title":"Effective Date" },
    "termination_date": { "type":"string", "format":"date", "title":"Termination Date (optional)" },

    "signature": { "type":"string", "title":"Signature (typed or drawn)" },
    "signature_date": { "type":"string", "format":"date", "title":"Date of Signature" },

    "witness_name": { "type":"string", "title":"Witness Full Name (optional)" },
    "witness_signature": { "type":"string", "title":"Witness Signature (optional)" },
    "witness_date": { "type":"string", "format":"date", "title":"Witness Signature Date (optional)" }
  },
  "if": { "properties": { "authority_type": { "const":"Specific" } } },
  "then": { "required": ["specific_authority"] }
}
```

---

## 2️⃣ Affidavit of Support (I‑864)

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "Affidavit of Support",
  "type": "object",
  "required": ["sponsor_name","sponsor_address","sponsor_employer","sponsor_income","beneficiary_name","beneficiary_relation","signature","signature_date"],
  "properties": {
    "sponsor_name": { "type":"string", "title":"Sponsor Full Name" },
    "sponsor_address": { "type":"string", "title":"Sponsor Address" },

    "sponsor_employer": { "type":"string", "title":"Employer Name" },
    "sponsor_job_title": { "type":"string", "title":"Job Title" },
    "sponsor_years_employed": { "type":"integer", "title":"Years Employed", "minimum":0 },

    "sponsor_income": { "type":"number", "title":"Annual Household Income ($)" },
    "sponsor_filing_status": {
      "type":"string",
      "enum":["Single","Married Filing Jointly","Married Filing Separately","Head of Household","Qualifying Widow(er)"],
      "title":"Filing Status"
    },

    "beneficiary_name": { "type":"string", "title":"Beneficiary Full Name" },
    "beneficiary_relation": {
      "type":"string",
      "enum":["Spouse","Child","Parent","Sibling","Other"],
      "title":"Relationship to Sponsor"
    },
    "beneficiary_birthdate": { "type":"string", "format":"date", "title":"Beneficiary DOB" },

    "signature": { "type":"string", "title":"Sponsor Signature" },
    "signature_date": { "type":"string", "format":"date", "title":"Signature Date" }
  }
}
```

---

## 3️⃣ Non‑Disclosure Agreement (NDA)

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "Non‑Disclosure Agreement",
  "type": "object",
  "required": ["disclosing_party","receiving_party","effective_date","termination_date","confidential_items","signature","signature_date"],
  "properties": {
    "disclosing_party": { "type":"string", "title":"Disclosing Party" },
    "receiving_party": { "type":"string", "title":"Receiving Party" },

    "effective_date": { "type":"string", "format":"date", "title":"Effective Date" },
    "termination_date": { "type":"string", "format":"date", "title":"Termination Date" },

    "confidential_items": {
      "type":"array",
      "title":"Confidential Items",
      "items": { "type":"string", "title":"Item" }
    },

    "scope_of_disclosure": {
      "type":"string",
      "enum":["All Information","Excludes Publicly Known","Excludes Information Already in Receiver's Possession"],
      "title":"Scope of Disclosure"
    },

    "non_circumvention": { "type":"boolean", "title":"Non‑Circumvention Clause (Yes/No)", "default":true },

    "governing_law": { "type":"string", "title":"Jurisdiction / Governing Law" },

    "signature": { "type":"string", "title":"Signature (typed or drawn)" },
    "signature_date": { "type":"string", "format":"date", "title":"Signature Date" }
  }
}
```

---

## 4️⃣ Employment Contract

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "Employment Contract",
  "type": "object",
  "required": ["employee_name","employee_address","employer_name","position","salary","start_date","termination_provisions","signature","signature_date"],
  "properties": {
    "employee_name": { "type":"string", "title":"Employee Full Name" },
    "employee_address": { "type":"string", "title":"Employee Address" },

    "employer_name": { "type":"string", "title":"Employer / Company Name" },
    "position": { "type":"string", "title":"Job Title" },
    "department": { "type":"string", "title":"Department (optional)" },

    "salary": { "type":"number", "title":"Annual Salary ($)" },
    "payment_frequency": {
      "type":"string",
      "enum":["Monthly","Bi‑Weekly","Weekly"],
      "title":"Payment Frequency"
    },

    "start_date": { "type":"string", "format":"date", "title":"Start Date" },
    "probation_period_months": { "type":"integer", "title":"Probation (months)", "minimum":0 },

    "termination_provisions": {
      "type":"object",
      "title":"Termination Terms",
      "properties": {
        "notice_period": { "type":"integer", "title":"Notice Period (days)", "minimum":0 },
        "cause_for_termination": { "type":"boolean", "title":"Termination for Cause" }
      },
      "required": ["notice_period"]
    },

    "signature": { "type":"string", "title":"Employee Signature" },
    "signature_date": { "type":"string", "format":"date", "title":"Signature Date" }
  }
}
```

---

## 4️⃣ Lease Agreement (Residential/Commercial)

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "Lease Agreement",
  "type": "object",
  "required": ["landlord_name","landlord_address","tenant_name","tenant_address","property_address","rent_amount","security_deposit","term_start","term_end","signature","signature_date"],
  "properties": {
    "landlord_name": { "type":"string", "title":"Landlord Full Name" },
    "landlord_address": { "type":"string", "title":"Landlord Address" },

    "tenant_name": { "type":"string", "title":"Tenant Full Name" },
    "tenant_address": { "type":"string", "title":"Tenant Address" },

    "property_address": { "type":"string", "title":"Leased Property Address" },

    "rent_amount": { "type":"number", "title":"Monthly Rent ($)" },
    "payment_day": { "type":"integer", "title":"Day of Month Rent is Due", "minimum":1, "maximum":31 },

    "security_deposit": { "type":"number", "title":"Security Deposit ($)" },

    "term_start": { "type":"string", "format":"date", "title":"Lease Start Date" },
    "term_end":   { "type":"string", "format":"date", "title":"Lease End Date" },

    "subletting_allowed": { "type":"boolean", "title":"Subletting Allowed?" },
    "maintenance_responsibilities": {
      "type":"string",
      "title":"Maintenance Responsibilities",
      "enum":["Landlord","Tenant","Shared"],
      "default":"Landlord"
    },

    "signature": { "type":"string", "title":"Signature (typed/drawn)" },
    "signature_date": { "type":"string", "format":"date", "title":"Signature Date" }
  }
}
```

---

## 5️⃣ Settlement Agreement

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "Settlement Agreement",
  "type": "object",
  "required": ["party_a","party_b","settlement_amount","payment_terms","effective_date","signature","signature_date"],
  "properties": {
    "party_a": { "type":"string", "title":"Party A Name" },
    "party_b": { "type":"string", "title":"Party B Name" },

    "settlement_amount": { "type":"number", "title":"Settlement Amount ($)" },
    "payment_method": {
      "type":"string",
      "enum":["Cash","Check","Wire Transfer","Credit Card"],
      "title":"Payment Method"
    },

    "payment_terms": { "type":"string", "title":"Payment Terms / Schedule" },

    "effective_date": { "type":"string", "format":"date", "title":"Effective Date" },

    "release_of_claims": {
      "type":"boolean",
      "title":"Release of Claims (Yes/No)",
      "default":true
    },

    "confidentiality_clause": {
      "type":"boolean",
      "title":"Include Confidentiality Clause?",
      "default":true
    },

    "signature": { "type":"string", "title":"Signature" },
    "signature_date": { "type":"string", "format":"date", "title":"Signature Date" }
  }
}
```

---

## 6️⃣ Will & Last Will & Testament

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "Last Will & Testament",
  "type": "object",
  "required": ["testator_name","testator_dob","assets","guardianship","signature","signature_date"],
  "properties": {
    "testator_name": { "type":"string", "title":"Testator Full Name" },
    "testator_dob":   { "type":"string", "format":"date", "title":"Testator DOB" },
    "testator_address": { "type":"string", "title":"Testator Address" },

    "assets": {
      "type":"array",
      "title":"Assets / Property",
      "items": { "type":"object",
        "required":["description","value"],
        "properties":{
          "description":{ "type":"string", "title":"Description" },
          "value":      { "type":"number", "title":"Value ($)" }
        }
      }
    },

    "guardianship": {
      "type":"object",
      "title":"Minor Children Guardianship",
      "properties":{
        "child_name":{ "type":"string", "title":"Child Full Name" },
        "child_dob":  { "type":"string", "format":"date", "title":"Child DOB" },
        "guardian_name":{ "type":"string", "title":"Guardian Full Name" }
      },
      "required":["child_name","child_dob","guardian_name"]
    },

    "alternate_executors": {
      "type":"array",
      "title":"Alternate Executors (optional)",
      "items": { "type":"string" }
    },

    "signature": { "type":"string", "title":"Testator Signature" },
    "signature_date": { "type":"string", "format":"date", "title":"Date of Signature" },

    "witness_name": { "type":"string", "title":"Witness Name (optional)" },
    "witness_signature": { "type":"string", "title":"Witness Signature (optional)" }
  }
}
```

---

## 7️⃣ Living Will / Advance Directive

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "Living Will / Advance Directive",
  "type": "object",
  "required": ["patient_name","patient_dob","directive_type","signature","signature_date"],
  "properties": {
    "patient_name": { "type":"string", "title":"Patient Full Name" },
    "patient_dob": { "type":"string", "format":"date", "title":"Patient DOB" },

    "directive_type": {
      "type":"string",
      "title":"Directive Type",
      "enum":["Life‑Sustaining Treatment","Organ Donation","Hospice Care","No Directive"],
      "default":"No Directive"
    },

    "instructions": {
      "type":"string",
      "title":"Specific Instructions (if any)",
      "description":"Describe the preferred treatment or care."
    },

    "alternate_directive": {
      "type":"string",
      "title":"Alternate Directive (if another person has authority)",
      "description":"Name of the alternate decision maker."
    },

    "signature": { "type":"string", "title":"Patient Signature" },
    "signature_date": { "type":"string", "format":"date", "title":"Signature Date" },

    "witness_name": { "type":"string", "title":"Witness Name (optional)" },
    "witness_signature": { "type":"string", "title":"Witness Signature (optional)" },
    "witness_date": { "type":"string", "format":"date", "title":"Witness Signature Date (optional)" }
  }
}
```

---

## 8️⃣ Release of Liability / Indemnity Agreement

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "Release of Liability",
  "type": "object",
  "required": ["party_name","party_address","releasee_name","releasee_address","scope_of_release","signature","signature_date"],
  "properties": {
    "party_name": { "type":"string", "title":"Releasing Party Full Name" },
    "party_address": { "type":"string", "title":"Releasing Party Address" },

    "releasee_name": { "type":"string", "title":"Releasee Full Name" },
    "releasee_address": { "type":"string", "title":"Releasee Address" },

    "scope_of_release": {
      "type":"string",
      "title":"Scope of Release",
      "enum":["All Claims","Specific Claim","Damages","Liability"],
      "default":"All Claims"
    },

    "specific_claim": {
      "type":"string",
      "title":"Specific Claim (if any)",
      "description":"E.g., \"Property Damage – $12,000\""
    },

    "consideration": { "type":"string", "title":"Consideration Provided" },

    "effective_date": { "type":"string", "format":"date", "title":"Effective Date" },

    "signature": { "type":"string", "title":"Releasing Party Signature" },
    "signature_date": { "type":"string", "format":"date", "title":"Date of Signature" },

    "witness_name": { "type":"string", "title":"Witness Name (optional)" },
    "witness_signature": { "type":"string", "title":"Witness Signature (optional)" },
    "witness_date": { "type":"string", "format":"date", "title":"Witness Date (optional)" }
  },
  "if": { "properties": { "scope_of_release": { "const":"Specific Claim" } } },
  "then": { "required": ["specific_claim"] }
}
```

---

## 9️⃣ Business Formation Documents (LLC / Corp)

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "Business Formation Documents – LLC",
  "type": "object",
  "required": ["entity_name","entity_type","state","registered_agent_name","registered_agent_address","members","signature","signature_date"],
  "properties": {
    "entity_name": { "type":"string", "title":"Entity Name" },
    "entity_type": { "type":"string", "enum":["LLC","Corporation","S‑Corp","C‑Corp"], "default":"LLC" },
    "state": { "type":"string", "title":"State of Formation" },

    "registered_agent_name": { "type":"string", "title":"Registered Agent Full Name" },
    "registered_agent_address": { "type":"string", "title":"Registered Agent Address" },

    "members": {
      "type":"array",
      "title":"Members / Owners",
      "items":{
        "type":"object",
        "required":["member_name","member_address","member_percent"],
        "properties":{
          "member_name":{ "type":"string", "title":"Member Full Name" },
          "member_address":{ "type":"string", "title":"Member Address" },
          "member_percent":{ "type":"number", "title":"Ownership %", "minimum":0, "maximum":100 }
        }
      }
    },

    "manager_name": { "type":"string", "title":"Manager Name (if managed LLC)" },
    "manager_address": { "type":"string", "title":"Manager Address (optional)" },

    "signature": { "type":"string", "title":"Signature of Organizer" },
    "signature_date": { "type":"string", "format":"date", "title":"Signature Date" }
  }
}
```

---

## 🔄 10️⃣ How to Use Them in Your React App

```tsx
import { Form } from "@rjsf/core";

// Pick the POA template above
import poaSchema from "./schemas/poa.json";

export default function PoaForm() {
  return (
    <Form
      schema={poaSchema}
      onSubmit={({formData}) => {
        // send formData to your new POST /api/legal-forms/1/fill endpoint
      }}
      // uiSchema / widgets can be added if you want custom UI
    />
  );
}
```

* **Validation** – RJSF will automatically enforce the `required` and `enum` rules.
* **Signature** – If you want a drawing widget, create a `SignatureWidget` and replace the `signature` field with `"widget": "signature"` in the `uiSchema`.
* **Wizard** – If the schema is too large, wrap it with `react‑json‑schema‑form‑wizard` or split it into multiple pages manually.

---

**All 10 templates are JSON‑serialisable – you can drop them into your backend DB (see the `legal_forms` table) and expose them via the new `/api/legal‑forms` endpoint.**
