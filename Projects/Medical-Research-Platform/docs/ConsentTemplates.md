Below are **three fully‑defined consent‑form templates** that you can seed into the `consent_definitions` table.
Each entry contains a human‑readable `name`, the compliance domain (`form_type`), a `version`, and the
`schema_json` that describes the exact fields the front‑end will render.

> **Tip** – The `schema_json` is a standard JSON‑Schema (Draft‑07).
> If you’re using a tool such as **React‑JSON‑Schema‑Form** or **VUE‑FORM‑DESIGNER**, you can drop the
`schema_json` straight into the form builder and let it generate the UI for you.

```json
[
  {
    "id": 1,
    "name": "HIPAA Authorization for Release of Medical Records (2025)",
    "form_type": "HIPAA",
    "version": 1,
    "schema_json": {
      "$schema": "http://json-schema.org/draft-07/schema#",
      "title": "HIPAA Authorization",
      "type": "object",
      "required": ["patient_name","patient_dob","provider_name","purpose","signature","signature_date"],
      "properties": {
        "patient_name": {
          "type": "string",
          "title": "Patient Full Name"
        },
        "patient_dob": {
          "type": "string",
          "format": "date",
          "title": "Date of Birth"
        },
        "patient_address": {
          "type": "string",
          "title": "Patient Address"
        },
        "patient_phone": {
          "type": "string",
          "pattern": "^[0-9]{10}$",
          "title": "Patient Phone (10 digits)"
        },
        "provider_name": {
          "type": "string",
          "title": "Name of Healthcare Provider"
        },
        "provider_address": {
          "type": "string",
          "title": "Provider Address"
        },
        "purpose": {
          "type": "string",
          "enum": [
            "treatment",
            "payment",
            "healthcare operations",
            "research",
            "other"
          ],
          "title": "Purpose of Disclosure"
        },
        "other_purpose": {
          "type": "string",
          "title": "If other, please specify"
        },
        "signature": {
          "type": "string",
          "title": "Signature (digital or typed name)"
        },
        "signature_date": {
          "type": "string",
          "format": "date",
          "title": "Date of Signature"
        },
        "consent_to_share_with": {
          "type": "array",
          "items": { "type": "string" },
          "title": "Individuals/Entities to whom information may be shared"
        }
      },
      "if": {
        "properties": { "purpose": { "const": "other" } }
      },
      "then": {
        "required": ["other_purpose"]
      }
    }
  },

  {
    "id": 2,
    "name": "GDPR Consent for Processing of Personal Data (2025)",
    "form_type": "GDPR",
    "version": 1,
    "schema_json": {
      "$schema": "http://json-schema.org/draft-07/schema#",
      "title": "GDPR Consent",
      "type": "object",
      "required": ["full_name","email","consent_for_processing","terms_and_conditions"],
      "properties": {
        "full_name": {
          "type": "string",
          "title": "Full Name"
        },
        "email": {
          "type": "string",
          "format": "email",
          "title": "Email Address"
        },
        "phone": {
          "type": "string",
          "pattern": "^[+]?\\d{10,15}$",
          "title": "Phone Number (optional)"
        },
        "consent_for_processing": {
          "type": "boolean",
          "title": "I consent to the processing of my personal data",
          "description": "By checking this box you agree to the following purposes: [list purposes]."
        },
        "specific_purposes": {
          "type": "array",
          "items": {
            "type": "string",
            "enum": [
              "marketing",
              "service improvement",
              "analytics",
              "legal obligations"
            ]
          },
          "title": "Select all purposes you consent to"
        },
        "consent_to_share_with": {
          "type": "array",
          "items": {
            "type": "string",
            "enum": [
              "third‑party service providers",
              "law enforcement",
              "public authorities",
              "other"
            ]
          },
          "title": "Who may have access to my data?"
        },
        "other_consent_to_share_with": {
          "type": "string",
          "title": "If other, specify"
        },
        "consent_to_store_forever": {
          "type": "boolean",
          "title": "I consent to indefinite storage of my data"
        },
        "consent_to_anonymized_data_use": {
          "type": "boolean",
          "title": "I consent to the use of my anonymized data for research"
        },
        "terms_and_conditions": {
          "type": "boolean",
          "title": "I have read and accept the Terms & Conditions",
          "description": "By checking this box you acknowledge that you have read the Terms & Conditions."
        }
      },
      "if": {
        "properties": { "consent_to_share_with": { "contains": { "const": "other" } } }
      },
      "then": {
        "required": ["other_consent_to_share_with"]
      }
    }
  },

  {
    "id": 3,
    "name": "CCPA Consent for Sale of Personal Information (2025)",
    "form_type": "CCPA",
    "version": 1,
    "schema_json": {
      "$schema": "http://json-schema.org/draft-07/schema#",
      "title": "CCPA Sale Consent",
      "type": "object",
      "required": ["full_name","email","consent_for_sale","terms_and_conditions"],
      "properties": {
        "full_name": {
          "type": "string",
          "title": "Full Name"
        },
        "email": {
          "type": "string",
          "format": "email",
          "title": "Email Address"
        },
        "consent_for_sale": {
          "type": "boolean",
          "title": "I consent to the sale of my personal information",
          "description": "You may choose to opt‑out by leaving this unchecked."
        },
        "consent_to_share_with": {
          "type": "array",
          "items": {
            "type": "string",
            "enum": [
              "advertisers",
              "service providers",
              "partners",
              "public authorities"
            ]
          },
          "title": "Specify who may receive my data"
        },
        "other_consent_to_share_with": {
          "type": "string",
          "title": "If other, specify"
        },
        "consent_to_anonymized_use": {
          "type": "boolean",
          "title": "I consent to the use of anonymized data for marketing analysis"
        },
        "consent_to_marketing_email": {
          "type": "boolean",
          "title": "I consent to receive marketing emails"
        },
        "terms_and_conditions": {
          "type": "boolean",
          "title": "I have read and accept the Terms & Conditions",
          "description": "By checking this box you acknowledge that you have read the Terms & Conditions."
        }
      },
      "if": {
        "properties": { "consent_to_share_with": { "contains": { "const": "other" } } }
      },
      "then": {
        "required": ["other_consent_to_share_with"]
      }
    }
  }
]
```

### How to Use These Templates

| Step | What to do | Why |
|------|------------|-----|
| 1 | **Insert** the JSON array into the `consent_definitions` table (via a seed script or DB UI). | Each row represents a reusable form template. |
| 2 | **Expose** the list through `GET /api/consent-definitions`. | Clients can fetch the form schema and build the UI dynamically. |
| 3 | **Create** a consent: `POST /api/consents` with `form_def_id` set to one of the IDs above and `answers` matching the `schema_json`. | The service will validate the payload, store the raw answers, and set `status=pending`. |
| 4 | **Sign** the consent (worker job) to produce a signed PDF. | The PDF will include the signed hash for later integrity checks. |
| 5 | **Download** the PDF via `GET /api/consents/{id}/pdf`. | Gives the patient a downloadable copy. |

---

#### Sample *Answers* for Each Form

> These are **not** required by the API – they’re just examples that show a complete payload that would pass
validation.

```json
/* 1. HIPAA Authorization */
{
  "patient_name": "Jane Doe",
  "patient_dob": "1984-07-12",
  "patient_address": "123 Main St, Springfield, IL",
  "patient_phone": "5551234567",
  "provider_name": "Springfield General Hospital",
  "provider_address": "456 Hospital Rd, Springfield, IL",
  "purpose": "research",
  "other_purpose": "clinical trial for new drug",
  "signature": "Jane Doe",
  "signature_date": "2025-09-15",
  "consent_to_share_with": ["Research Institute", "Insurance Company"]
}

/* 2. GDPR Consent */
{
  "full_name": "John Smith",
  "email": "john.smith@example.com",
  "phone": "+15551234567",
  "consent_for_processing": true,
  "specific_purposes": ["marketing", "service improvement"],
  "consent_to_share_with": ["third‑party service providers", "other"],
  "other_consent_to_share_with": "Research Lab",
  "consent_to_store_forever": false,
  "consent_to_anonymized_data_use": true,
  "terms_and_conditions": true
}

/* 3. CCPA Sale Consent */
{
  "full_name": "Alice Johnson",
  "email": "alice.johnson@example.com",
  "consent_for_sale": true,
  "consent_to_share_with": ["advertisers", "other"],
  "other_consent_to_share_with": "Analytics Firm",
  "consent_to_anonymized_use": true,
  "consent_to_marketing_email": true,
  "terms_and_conditions": true
}
```

Feel free to adjust any field values, add new fields, or bump the `version` number whenever you evolve a template.
The JSON‑Schema itself is what drives the front‑end UI and the backend validation, so keep it up‑to‑date!


Below is a **second consent template** that you can add to the `consent_definitions` table.
It’s a **“HIPAA Liability & Release of Claims”** form that patients sign after the standard HIPAA authorization.
The JSON‑Schema is ready for use by the same front‑end renderer that consumes the previous template, so you can
drop it straight into your “templates” table.

```json
{
  "id": 4,
  "name": "HIPAA Liability and Release of Claims (2025)",
  "form_type": "HIPAA",
  "version": 1,
  "schema_json": {
    "$schema": "http://json-schema.org/draft-07/schema#",
    "title": "HIPAA Liability & Release",
    "type": "object",
    "required": [
      "patient_name",
      "patient_dob",
      "signature",
      "signature_date",
      "release_statement"
    ],
    "properties": {
      "patient_name": {
        "type": "string",
        "title": "Patient Full Name"
      },
      "patient_dob": {
        "type": "string",
        "format": "date",
        "title": "Date of Birth"
      },
      "patient_address": {
        "type": "string",
        "title": "Patient Address"
      },
      "patient_phone": {
        "type": "string",
        "pattern": "^[0-9]{10}$",
        "title": "Patient Phone (10 digits)"
      },
      "provider_name": {
        "type": "string",
        "title": "Name of Healthcare Provider / Facility"
      },
      "provider_address": {
        "type": "string",
        "title": "Provider Address"
      },
      /* ------------------------------------------------------------------ */
      /*  --- 1️⃣ The Release Statement (read‑only text)  -------------------*/
      "release_statement": {
        "type": "string",
        "title": "Release of Liability",
        "const": "I, the undersigned, acknowledge that I have received full disclosure of the purpose and risks of
the medical services to be provided. I understand that the healthcare provider and its employees, agents, and
volunteers are not liable for any loss, injury, or damage arising from the normal practice of medical care,
including but not limited to the following:\n\n• Routine diagnostic tests, imaging, laboratory studies, and
treatment procedures\n• Use of standard medical equipment and devices\n• Minor adverse events such as temporary
discomfort or allergic reaction\n• Transient or temporary deterioration of my medical condition\n\nI release the
provider, its employees, agents, volunteers, and any subcontractors from all claims, demands, or actions, present
or future, arising out of or relating to the above services, except for claims based on gross negligence, willful
misconduct, or fraud.\n\nI understand that I have the right to seek a second opinion and that I may discontinue
treatment at any time.\n\nI affirm that I have read this release, understand its contents, and consent to its
terms."
      },

      /* ------------------------------------------------------------------ */
      /*  --- 2️⃣ Signature Block ------------------------------------------*/
      "signature": {
        "type": "string",
        "title": "Signature (typed or digital)",
        "description": "Sign or type your full legal name"
      },
      "signature_date": {
        "type": "string",
        "format": "date",
        "title": "Date of Signature"
      },

      /* ------------------------------------------------------------------ */
      /*  --- 3️⃣ Witness (optional) ---------------------------------------*/
      "witness_name": {
        "type": "string",
        "title": "Witness Full Name",
        "description": "If a witness signs, enter their name here"
      },
      "witness_signature": {
        "type": "string",
        "title": "Witness Signature",
        "description": "Signed by the witness"
      },
      "witness_date": {
        "type": "string",
        "format": "date",
        "title": "Witness Signature Date"
      },

      /* ------------------------------------------------------------------ */
      /*  --- 4️⃣ Patient’s Understanding ---------------------------------*/
      "acknowledge_understanding": {
        "type": "boolean",
        "title": "I understand the risks and responsibilities described above",
        "description": "Check this box to confirm you read and understand the release"
      }
    },

    /* ------------------------------------------------------------------ */
    /*  Conditional requirement: If witness is used, they must sign  -------*/
    "if": {
      "properties": {
        "witness_name": { "type": "string", "minLength": 1 }
      }
    },
    "then": {
      "required": ["witness_name", "witness_signature", "witness_date"]
    }
  }
}
```

### How to Seed It

```sql
INSERT INTO consent_definitions (id, name, form_type, version, schema_json)
VALUES (
  4,
  'HIPAA Liability and Release of Claims (2025)',
  'HIPAA',
  1,
  '[the JSON above – make it a single‑line string or use Postgres’s jsonb literal]'
);
```

### What the Schema Does

| Section | Purpose | Notes |
|---------|---------|-------|
| **Release Statement** | Static legal text that is displayed read‑only. | The `const` value is the full clause. |
| **Signature Block** | Patient must sign and date. | Stored as a plain string; you can hash it for integrity. |
| **Witness** | Optional; used if the patient wants a witness. | Conditional requirement – if a name is entered,
the signature and date are required. |
| **Acknowledgment Checkbox** | Explicit confirmation that the patient reads and understands. | Must be `true` to
pass validation. |

### Example Payload (valid)

```json
{
  "patient_name": "John Doe",
  "patient_dob": "1978-04-23",
  "patient_address": "123 Main St, Springfield, IL",
  "patient_phone": "5551234567",
  "provider_name": "Springfield General Hospital",
  "provider_address": "456 Hospital Rd, Springfield, IL",
  "release_statement": "I, the undersigned, acknowledge that I have received full disclosure …",   /* truncated
for brevity */
  "signature": "John Doe",
  "signature_date": "2025-09-15",
  "acknowledge_understanding": true,
  "witness_name": "Jane Smith",
  "witness_signature": "Jane Smith",
  "witness_date": "2025-09-15"
}
```

> **Tip** – If you want the form to be read‑only until the patient checks the acknowledgment box, you can use your
front‑end form‑builder’s “disable after check” logic. The JSON‑Schema already enforces that the acknowledgment
checkbox must be true, so the backend is safe even if the UI skips that guard.

Now you have two fully‑formed, database‑ready consent templates:
1. **HIPAA Authorization for Release of Medical Records** (`id=1`)
2. **HIPAA Liability & Release of Claims** (`id=4`)

You can fetch them via `GET /api/consent-definitions` and render the appropriate UI for each. Happy signing!