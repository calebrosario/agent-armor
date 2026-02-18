# HL7 FHIR Research Report

---

## Table of Contents

1. [Part 1: FHIR (Fast Healthcare Interoperability Resources)](#part-1-fhir-fast-healthcare-interoperability-resources)
2. [Part 2: HL7 (Health Level Seven)](#part-2-hl7-health-level-seven)
3. [Part 3: Comparison: FHIR vs HL7](#part-3-comparison-fhir-vs-hl7)
4. [Part 4: Code Implementation Examples](#part-4-code-implementation-examples)
5. [Part 5: When to Use Which Standard](#part-5-when-to-use-which-standard)
6. [Official Resources](#official-resources)

---

## Part 1: FHIR (Fast Healthcare Interoperability Resources)

### What is FHIR?

**FHIR** (Fast Healthcare Interoperability Resources) is a next-generation healthcare interoperability standard developed by HL7 that combines the best features of HL7 v2, v3, and CDA while leveraging modern web technologies.

**Key Benefits:**
- Fast to implement - developers can have simple interfaces working in a single day
- Multiple implementation libraries available
- Free to use with no restrictions
- Built on web standards: JSON, XML, HTTP, OAuth 2.0
- Supports RESTful APIs, messaging, and documents
- Human-readable formats

### FHIR Architecture

FHIR is built on two core components:

**1. Resources** - Modular information models defining healthcare business objects (Patient, Observation, Condition, etc.)

**2. APIs** - RESTful interfaces for interacting with resources using standard HTTP methods.

### FHIR RESTful API Interactions

| Level | Interaction | Description |
|-------|-------------|-------------|
| **Instance** | `read` | Read current state of a resource |
| | `vread` | Read specific version of a resource |
| | `update` | Update an existing resource |
| | `patch` | Partial update of a resource |
| | `delete` | Delete a resource |
| | `history` | Retrieve change history |
| **Type** | `create` | Create new resource (POST) |
| | `search` | Search resources by criteria (GET with parameters) |
| | `history` | Retrieve type-level history |
| **System** | `capabilities` | Get system CapabilityStatement |
| | `batch/transaction` | Execute multiple operations in one request |
| | `search` | Search across all resource types |
| | `history` | System-wide history |

### FHIR Versions

| Version | Status | Release Date |
|---------|--------|--------------|
| **R5** | Standard for Trial Use | March 2023 (current published) |
| **R4** | Mixed (Normative + STU) | 2019 (most widely adopted) |
| **R4B** | STU changes only | 2022 |
| **STU3** | Standard for Trial Use | 2017 |

### Key FHIR Resources

**Patient Resource (JSON Example):**
```json
{
  "resourceType": "Patient",
  "id": "example",
  "identifier": [
    {
      "use": "usual",
      "system": "http://hospital.org/mrns",
      "value": "123456"
    }
  ],
  "name": [
    {
      "use": "official",
      "family": "Doe",
      "given": ["John"]
    }
  ],
  "gender": "male",
  "birthDate": "1980-11-15"
}
```

**Observation Resource (JSON Example):**
```json
{
  "resourceType": "Observation",
  "id": "blood-pressure",
  "status": "final",
  "category": [
    {
      "coding": [
        {
          "system": "http://terminology.hl7.org/CodeSystem/observation-category",
          "code": "vital-signs",
          "display": "Vital Signs"
        }
      ]
    }
  ],
  "code": {
    "coding": [
      {
        "system": "http://loinc.org",
        "code": "55284-4",
        "display": "Blood pressure systolic and diastolic"
      }
    ]
  },
  "subject": {
    "reference": "Patient/example"
  },
  "effectiveDateTime": "2025-01-21T14:30:00Z",
  "valueQuantity": {
    "value": 120,
    "unit": "mmHg",
    "system": "http://unitsofmeasure.org"
  }
}
```

**Condition Resource (JSON Example):**
```json
{
  "resourceType": "Condition",
  "id": "condition-example",
  "clinicalStatus": {
    "coding": [
      {
        "system": "http://terminology.hl7.org/CodeSystem/condition-clinical",
        "code": "active",
        "display": "Active"
      }
    ]
  },
  "code": {
    "coding": [
      {
        "system": "http://snomed.info/sct",
        "code": "44054006",
        "display": "Diabetes mellitus type 2"
      }
    ]
  },
  "subject": {
    "reference": "Patient/example"
  },
  "onsetDateTime": "2023-05-15"
}
```

### FHIR Security (SMART on FHIR)

SMART on FHIR provides OAuth 2.0-based security for FHIR APIs:

**Authentication Flow:**
1. Client redirects user to authorization server
2. User authenticates and grants consent
3. Authorization server issues access token (and refresh token)
4. Client uses access token in Bearer header
5. Refresh token used to get new access tokens

---

## Part 2: HL7 (Health Level Seven)

### What is HL7?

**HL7** is a set of international standards for electronic health information exchange. Founded in 1987, HL7 enables different healthcare systems to communicate effectively through standardized protocols.

**HL7 Standards Family:**
- **HL7 v2.x** - Event-driven messaging (most widely deployed)
- **HL7 v3** - Model-driven, XML-based
- **CDA** - Clinical Document Architecture (document exchange)
- **FHIR** - Modern RESTful API standard

### HL7 v2.x Message Structure

**Hierarchy:**
```
Message
├── Segments (lines, separated by \r)
│   ├── Fields (separated by |)
│   │   ├── Components (separated by ^)
│   │   │   └── Subcomponents (separated by &)
```

**Delimiters (default):**
| Character | Purpose |
|-----------|---------|
| `\r` | Segment terminator |
| `|` | Field separator |
| `^` | Component separator |
| `&` | Subcomponent separator |
| `~` | Repetition separator |
| `\` | Escape character |

### HL7 v2.x Common Segments

| Segment | Name | Purpose |
|---------|------|---------|
| MSH | Message Header | Message metadata |
| PID | Patient Identification | Demographics |
| NK1 | Next of Kin | Emergency contacts |
| PV1 | Patient Visit | Hospital stay info |
| OBR | Observation Request | Lab/test orders |
| OBX | Observation Result | Lab results |

### HL7 v2.x Message Types

**ADT (Admission, Discharge, Transfer):**
- **A01** - Patient admit
- **A02** - Patient transfer
- **A03** - Patient discharge
- **A04** - Patient registration

**ORU (Observation/Result - Unsolicited):**
- **R01** - Unsolicited observation (lab results)

### HL7 Message Examples

**ADT^A01 - Patient Admission:**
```hl7
MSH|^~\&|EPIC|EPICADT|iFW|SMSADT|20250121143000||ADT^A04|1817457|D|2.5|
PID||0493575^^^2^ID 1|454721||DOE^JOHN^^^^|19480203|M||B|254 MYSTREET AVE^^MYTOWN^OH^44123^USA
```

**ORU^R01 - Lab Results:**
```hl7
MSH|^~\&|LAB|XYZHosp|EKG|ABCImgCtr|20250121143000||ORU^R01|67890|P|2.5|
PID||1234||Doe^John||19611015|M|||123 Main St.^Apt 101^Benbrook^TX^76107||555-555-5555||M||1234567890
OBR|||1234567890||GLUCOSE^Glucose^^LN|||20250121143000
OBX|1|NM|GLU^Glucose^^LN||95|mg/dL|||||F|||20250121143000
```

### CDA (Clinical Document Architecture)

CDA is an XML-based document standard for clinical documents.

**CDA Example (Discharge Summary):**
```xml
<?xml version="1.0" encoding="UTF-8"?>
<ClinicalDocument xmlns="urn:hl7-org:v3">
  <typeId root="2.16.840.1.113883.1.3" extension="POCD_HD000040"/>
  <id root="2.16.840.1.113883.1.3" extension="c1c7d9d2-3b2a-4695-858d"/>
  <code codeSystem="2.16.840.1.113883.6.1" codeSystemName="LOINC">
    <code code="18842-5"/>
    <displayName>Discharge summary</displayName>
  </code>
  <title>Discharge Summary</title>
  <effectiveTime value="20250121143000"/>
  <recordTarget>
    <patientRole>
      <id extension="123456" root="2.16.840.1.113883.4.57"/>
      <patient>
        <name>
          <given>John</given>
          <family>Doe</family>
        </name>
        <administrativeGenderCode code="M"/>
        <birthTime value="19801115"/>
      </patient>
    </patientRole>
  </recordTarget>
</ClinicalDocument>
```

---

## Part 3: Comparison: FHIR vs HL7

| Aspect | FHIR | HL7 v2.x | HL7 v3/CDA |
|--------|------|----------|------------|
| **Format** | JSON/XML | ER7 (pipe-delimited) | XML |
| **Architecture** | RESTful APIs | Event-driven messaging | Model-driven |
| **Ease of Use** | High (web-friendly) | Moderate (requires parsing) | Low (complex) |
| **Adoption** | Growing rapidly | Very high (legacy systems) | Medium (documents) |
| **Learning Curve** | Low/Moderate | Moderate | High |
| **Validation** | Strong | Loose | Strong |
| **Use Case** | Modern web apps | Real-time integration | Document exchange |

---

## Part 4: Code Implementation Examples

### Python - Parse HL7 v2.x Message

```python
from hl7apy.parser import parse_message

hl7_string = """MSH|^~\&|EPIC|EPICADT|iFW|SMSADT|20250121143000||ADT^A04|1817457|D|2.5|
PID||0493575^^^2^ID 1||DOE^JOHN^^^^|19480203|M|"""

message = parse_message(hl7_string)
print(f"Message Type: {message.msh.msh_9}")  # ADT^A04
print(f"Patient Name: {message.pid.pid_5}")  # DOE^JOHN^^^^
```

### Python - Create FHIR Resource

```python
import requests

patient_data = {
    "resourceType": "Patient",
    "name": [{"family": "Smith", "given": ["Jane"]}],
    "gender": "female",
    "birthDate": "1990-05-20"
}

response = requests.post(
    "https://hapi.fhir.org/baseR4/Patient",
    json=patient_data,
    headers={"Content-Type": "application/fhir+json"}
)
print(f"Created: {response.json()}")
```

### TypeScript/JavaScript - Parse HL7 Message

```typescript
import { Hl7Message } from '@medplum/core';

const hl7String = `MSH|^~\\&|EPIC|EPICADT|iFW|SMSADT|20250121143000||ADT^A04|1817457|D|2.5|
PID||0493575^^^2^ID 1||DOE^JOHN^^^^|19480203|M|`;

const message = new Hl7Message(hl7String);
const pid = message.getSegment('PID');
console.log('Patient Name:', pid?.getField(5)?.toString());
```

### Java - Parse HL7 Message with HAPI

```java
import ca.uhn.hl7v2.model.v27.message.*;
import ca.uhn.hl7v2.parser.*;

Parser parser = new PipeParser();
String messageString = "MSH|^~\\&|EPIC|EPICADT|iFW|SMSADT|20250121143000||ADT^A01|1817457|D|2.5|\n" +
                       "PID||0493575||DOE^JOHN^^^^|19480203|M|";

Message message = parser.parse(messageString);

if (message instanceof ADT_A01) {
    ADT_A01 adt = (ADT_A01) message;
    PID pid = adt.getPID();
    System.out.println("Patient Name: " + pid.getPatientName(0).getFamilyName().getValue());
}
```

---

## Part 5: When to Use Which Standard

**Use FHIR when:**
- Building modern web applications
- Mobile app integration
- Patient-facing applications
- RESTful API is preferred
- JSON format is acceptable
- Real-time data access needed

**Use HL7 v2.x when:**
- Integrating with legacy hospital systems
- Existing infrastructure uses HL7 v2
- High-volume message exchange
- MLLP-based communication

**Use CDA when:**
- Exchanging clinical documents
- Patient summaries
- Discharge summaries
- Document persistence needed
- Regulatory compliance requires documents

---

## Official Resources

**FHIR:**
- https://hl7.org/fhir/ - Official specification
- https://build.fhir.org/ - Current build documentation
- https://fhir.org/ - Community resources

**HL7:**
- https://hl7.org/ - HL7 International
- https://www.hl7.org/hl7v2plus/ - HL7 v2.x resources
- https://www.hl7.org/cda/ - CDA documentation

**SMART on FHIR:**
- https://hl7.org/fhir/smart-app-launch/ - App launch specification
- https://docs.smarthealthit.org/ - Implementation guides

---

**Report Generated:** January 21, 2026
**Research Sources:** Official HL7 documentation, implementation guides, and open-source repositories
