# HL7 v2.5 Message Format Specifications

## Overview

This document describes the HL7 v2.5 message formats used in the Health-Mesh Medical Research Platform for integration with hospital Electronic Health Record (EHR) systems. The FHIR-to-HL7 translator service converts FHIR resources to HL7 v2.5 messages using these specifications.

## Supported Message Types

| HL7 Message Type | FHIR Resource | Description |
|-----------------|---------------|-------------|
| ADT^A04 | Patient | Patient registration/admission |
| ADT^A01 | Encounter | Patient visit/admission |
| ORU^R01 | Observation | Unsolicited observation results |
| DFT^P03 | MedicationRequest | Financial transaction for pharmacy |

## Message Structure

### Standard Components

Every HL7 message consists of:

1. **MSH Segment** (Message Header) - Required first segment
2. **Functional Segments** - Message type specific
3. **Segment Delimiters**:
   - **Field Separator**: `|` (pipe)
   - **Component Separator**: `^` (caret)
   - **Sub-component Separator**: `&` (ampersand)
   - **Repetition Separator**: `~` (tilde)
   - **Escape Character**: `\` (backslash)
   - **Line Separator**: `\r\n` (carriage return + newline)

---

## MSH Segment (Message Header)

### Format: `MSH|^~\&|SendingApp|SendingFacility|DateTime|MessageType|ProcessingID|MessageControlID|VersionID|Security`

### Fields

| Field # | Name | Example | Description |
|----------|-------|---------|-------------|
| 1 | Encoding Characters | `^~\&` | Delimiters in order: `^`, `~`, `\`, `&` |
| 2 | Sending Application | `HEALTH-MESH` | Application sending the message |
| 3 | Sending Facility | `HEALTH-MESH` | Facility sending the message |
| 4 | DateTime | `2025-01-26T18:00:00Z` | Message creation timestamp (ISO 8601) |
| 5 | Message Type | `ADT^A04` | HL7 message type (event code) |
| 6 | Processing ID | `P` | Production, Test, Debug |
| 7 | Message Control ID | `1737812345678901234` | Unique 18-character identifier |
| 8 | Version ID | `2.5` | HL7 version |

### Example MSH Segment
```
MSH|^~\&|HEALTH-MESH|HEALTH-MESH|2025-01-26T18:00:00Z|ADT^A04|P|1737812345678901234|2.5
```

---

## PID Segment (Patient Identification)

### Format: `PID|SetID|ExternalID|PatientName|MotherMaidenName|BirthDate|Sex|Alias|Race|Address|PhoneNumber|...`

### Fields

| Field # | Name | FHIR Mapping | Example | Description |
|----------|-------|-------------|---------|-------------|
| 1 | Set ID | - | `1` | Segment instance ID |
| 2 | External ID | `identifier[0].value` | `MRN12345` | Medical Record Number (MRN) |
| 3 | Patient Name | `name[0]` | `Doe^John^A^^L` | Family^Given^Middle^Suffix^Prefix |
| 4 | Mother's Maiden | - | `Smith` | Mother's maiden name |
| 5 | Birth Date | `birthDate` | `19900115` | YYYYMMDD format |
| 6 | Sex | `gender` | `M` | M=Male, F=Female, U=Unknown |
| 7 | Alias | - | `Jones` | Patient alias |
| 11 | Address | `address[0]` | `90210^Los Angeles^CA^USA` | Zip^City^State^Country |
| 13 | Phone | `telecom[0].value` | `310-555-1234` | Home phone number |
| 18 | Account Number | - | `ACC12345` | Patient account number |
| 25 | Vital Status | `deceasedDateTime` | `Y` | Y=Deceased, N=Alive |
| 26 | Death Date | `deceasedDateTime` | `20150615` | YYYYMMDD format |

### Example PID Segment
```
PID|1||MRN12345^http://hospital.org/mrns|Doe^John^A^^L||19900115|M||90210^Los Angeles^CA^USA|310-555-1234~310-555-5678|||||||||||||||||||||||||N||||||||||||||N||C|||||||||||
```

---

## PV1 Segment (Patient Visit)

### Format: `PV1|SetID|PatientClass|AssignedPatientLocation|AdmissionType|...|AttendingDoctor|...|VisitNumber|...|PatientClass|...`

### Fields

| Field # | Name | FHIR Mapping | Example | Description |
|----------|-------|-------------|---------|-------------|
| 1 | Set ID | - | `2` | Segment instance ID |
| 2 | Patient Class | `class` | `V` | E=Emergency, I=Inpatient, O=Outpatient, V=Virtual |
| 3 | Assigned Location | - | `2^A^R^ER^ER1` | Bed^NurseStation^Facility^Location |
| 18 | Account Number | - | `ACC12345` | Patient account number |
| 44 | Admit Date | `period.start` | `20250115` | YYYYMMDD format |
| 45 | Discharge Date | `period.end` | `20250116` | YYYYMMDD format |

### Example PV1 Segment
```
PV1|2|V|2^A^R|ER|||123^Dr^Smith|||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||ACC12345|||||20250115090000|20250116120000|||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||
```

---

## ORU^R01 Message (Observation/Result)

### Message Structure

1. **MSH** - Message Header
2. **PID** - Patient Identification (if `subject` present)
3. **ORC** - Common Order (optional)
4. **OBR** - Observation Request (required)
5. **OBX** - Observation/Result (one per component)

### OBR Segment (Observation Request)

### Format: `OBR|SetID|PlacerOrderNumber|FillerOrderNumber|UniversalServiceID|Priority|RequestedDateTime|ObservationDateTime|...|ResultStatus|...`

### Fields

| Field # | Name | FHIR Mapping | Example | Description |
|----------|-------|-------------|---------|-------------|
| 1 | Set ID | - | `1` | Segment instance ID |
| 2 | Placer Order # | `id` | `OBS-12345` | Requesting system order number |
| 3 | Filler Order # | - | `FILL-67890` | Filling system order number |
| 4 | Service ID | `code.coding[0]` | `2094-3^Glucose^LOINC` | Code^Display^System |
| 5 | Priority | - | `R` | R=Routine, S=Stat |
| 7 | Observation Date | `effectiveDateTime` | `20250115103000` | YYYYMMDDHHMMSS format |
| 25 | Result Status | `status` | `F` | F=Final, P=Partial, I=Incomplete |

### Example OBR Segment
```
OBR|1|OBS-12345||2094-3^Glucose^http://loinc.org|||20250115103000||||||||||F||||||
```

### OBX Segment (Observation/Result)

### Format: `OBX|SetID|ValueType|ObservationID|SubID|ObservationValue|Units|ReferenceRange|...|AbnormalFlags|...`

### Fields

| Field # | Name | FHIR Mapping | Example | Description |
|----------|-------|-------------|---------|-------------|
| 1 | Set ID | - | `1` | Segment instance ID (starts at 1) |
| 2 | Value Type | `valueQuantity` | `NM` | NM=Numeric, ST=Text, DT=DateTime |
| 3 | Observation ID | `code.coding[0]` | `95^mg/dL^UCUM` | Code^Unit^System |
| 4 | Sub-ID | - | `1` | Sub-component identifier |
| 5 | Observation Value | `valueQuantity.value` | `95` | Numeric or text value |
| 6 | Units | `valueQuantity.unit` | `mg/dL` | Unit of measurement |
| 7 | Reference Range | - | `70-100` | Normal range |
| 8 | Abnormal Flags | `interpretation` | `N` | N=Normal, H=High, L=Low, A=Abnormal |

### Example OBX Segment
```
OBX|1|NM|95^mg/dL^UCUM||95|mg/dL|70-100|||||N|||20250115103000
```

### Complete ORU^R01 Message Example
```
MSH|^~\&|HEALTH-MESH|HEALTH-MESH|2025-01-26T18:00:00Z|ORU^R01|P|1737812345678901234|2.5
PID|1||MRN12345^http://hospital.org/mrns|Doe^John||19900115|M||90210^Los Angeles^CA^USA|310-555-1234
OBR|1|OBS-12345||2094-3^Glucose^http://loinc.org|||20250115103000||||||||||F||||||
OBX|1|NM|95^mg/dL^UCUM||95|mg/dL|70-100|||||N|||20250115103000
```

---

## DFT^P03 Message (Financial Transaction)

### Message Structure

1. **MSH** - Message Header
2. **PID** - Patient Identification (required)
3. **PV1** - Patient Visit (required)
4. **DFT** - Detail Financial Transaction (required)

### DFT Segment (Financial Transaction)

### Format: `DFT|SetID|TransactionID|TransactionPostingDate|TransactionType|TransactionCode|Description|...|TransactionAmount|...|Currency|...`

### Fields

| Field # | Name | FHIR Mapping | Example | Description |
|----------|-------|-------------|---------|-------------|
| 1 | Set ID | - | `1` | Segment instance ID |
| 2 | Transaction ID | `id` | `TXN-12345` | Unique transaction identifier |
| 3 | Posting Date | - | `20250115` | YYYYMMDD format |
| 4 | Transaction Type | - | `DFT` | DFT=Detail Financial Transaction |
| 5 | Transaction Code | - | `RX` | RX=Prescription, CO=Co-pay |
| 6 | Description | `medicationCodeableConcept.text` | `Lipitor 20mg daily` | Transaction description |
| 7 | Transaction Amount | `cost[0].value` | `150.00` | Amount (2 decimals) |
| 8 | Currency | `cost[0].currency` | `USD` | ISO 4217 currency code |
| 9 | Performing Facility | - | `HEALTH-MESH` | Facility name |
| 10 | Transaction Date | - | `20250115` | YYYYMMDD format |

### Example DFT Segment
```
DFT|1|TXN-12345|20250115|DFT|RX|Lipitor 20mg daily|150.00|USD|HEALTH-MESH|20250115
```

### Complete DFT^P03 Message Example
```
MSH|^~\&|HEALTH-MESH|HEALTH-MESH|2025-01-26T18:00:00Z|DFT^P03|P|1737812345678901234|2.5
PID|1||MRN12345^http://hospital.org/mrns|Doe^John||19900115|M||90210^Los Angeles^CA^USA|310-555-1234
PV1|2|V|2^A^R|ER|||123^Dr^Smith|||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||
DFT|1|TXN-12345|20250115|DFT|RX|Lipitor 20mg daily|150.00|USD|HEALTH-MESH|20250115
```

---

## Field Validation Rules

### MSH Validation
- **Required**: Fields 1-3, 5, 7-8
- **Field 1**: Must be exactly `^~\&`
- **Field 7**: Must be 18 characters (timestamp + 4-digit random)
- **Field 8**: Must be `2.5`

### PID Validation
- **Required**: Fields 1-3, 5-6
- **Field 5**: Must be 8 digits (YYYYMMDD)
- **Field 6**: Must be single character (M, F, or U)
- **Field 2**: MRN must be present if using identifier

### OBR Validation
- **Required**: Fields 1-3, 5, 7, 25
- **Field 7**: Must be 14 digits (YYYYMMDDHHMMSS)

### OBX Validation
- **Required**: Fields 1-3, 5
- **Field 2**: Must be valid HL7 value type (NM, ST, DT, TS, etc.)
- **Field 5**: Must be numeric if type is NM

### DFT Validation
- **Required**: Fields 1-3, 5-7, 8
- **Field 7**: Must be numeric with 2 decimal places
- **Field 8**: Must be valid ISO 4217 currency code (USD, EUR, GBP, etc.)

---

## Common Pitfalls and Solutions

### 1. Delimiter Confusion
**Problem**: Using wrong delimiters for nested components
**Solution**: Remember the order: `|` (field), `^` (component), `&` (sub-component)

### 2. Date Format Mismatches
**Problem**: Sending ISO dates instead of HL7 dates
**Solution**: Convert `2025-01-15T10:30:00Z` → `20250115103000`

### 3. Missing Required Segments
**Problem**: Message rejected for missing PID in ORU^R01
**Solution**: Always include PID if `subject` reference exists

### 4. Incorrect Field Indexing
**Problem**: Using 1-based indexing incorrectly
**Solution**: HL7 uses 1-based field numbering (MSH-1 is first field)

### 5. Empty Fields
**Problem**: Leaving gaps in segment fields
**Solution**: Use double pipes `||` for empty fields

### 6. Special Character Escaping
**Problem**: Sending unescaped special characters in text fields
**Solution**: Escape special chars: `\S\` for `|`, `\T\` for `^`, `\R\` for `\r\n`

### 7. Message Length Limits
**Problem**: Exceeding EHR system limits
**Solution**: Keep individual fields under 200 characters, full message under 10KB

### 8. Case Sensitivity
**Problem**: Wrong case in codes (e.g., `adt^a04` instead of `ADT^A04`)
**Solution**: Always use uppercase for message types and codes

---

## Transport Methods

### HTTP/REST
- **Endpoint**: Hospital EHR REST API
- **Method**: POST
- **Headers**: `Content-Type: text/plain; charset=ASCII`
- **Timeout**: 30 seconds default
- **Implementation**: `api/services/fhir-hl7-translator.service.ts`

### MLLP (Minimal Lower Layer Protocol)
- **Port**: 2575 (default HL7 port)
- **Wrap**: `\x0B` (start of block), `\x1C\x0D` (end of block)
- **Status**: Placeholder for future implementation
- **Implementation**: Not yet implemented

### File Transfer
- **Location**: SFTP/FTP directory
- **Format**: One HL7 message per file (`.hl7` extension)
- **Batching**: Multiple files per transmission allowed
- **Status**: Placeholder for future implementation
- **Implementation**: Not yet implemented

---

## Compliance Considerations

### HIPAA
- **PHI Handling**: All patient identifiers must be logged
- **Audit Trail**: Every HL7 message logged in `hl7_message_logs` table
- **Access Control**: Hospital EHR configs store encrypted credentials

### GDPR
- **Data Minimization**: Only send required fields
- **Right to Erasure**: PID-25 (deceased) for data retention policies
- **Consent Tracking**: Link HL7 messages to consent forms via `subject` references

### CCPA
- **Opt-Out Tracking**: Flag patient data as "Do Not Sell" in custom field mappings
- **Breach Notification**: Anomaly detection in `hl7-monitoring.service.ts` alerts on >10% failure rate

---

## Testing Guidelines

### Unit Tests
- **Coverage**: 80%+ target (implemented in `test/unit/fhir-hl7-translator.test.ts`)
- **Test Cases**: Minimal data, complete data, edge cases (nulls, large strings)
- **Validation**: Run `npx mocha test/unit/fhir-hl7-translator.test.ts`

### Integration Tests
- **EHR Sandbox**: Test against hospital test EHR environments
- **End-to-End**: Verify message receipt and acknowledgment
- **Performance**: Target <100ms per translation

### Validation Tools
- **HL7 Validator**: Use external HL7 v2.5 validator for compliance
- **Schema Check**: Ensure all required fields present per segment
- **Error Handling**: Verify graceful degradation on malformed input

---

## Reference Links

- [HL7 v2.5 Standard](http://www.hl7.org/documentcenter/public/wg/HL7%20v2.5%20Tables%20Library%20v2.5.pdf)
- [LOINC Codes](https://loinc.org/)
- [UCUM Units](https://unitsofmeasure.org/)
- [ISO 4217 Currency Codes](https://www.currency-iso.org/en/home/tables/table-a1.html)
- [Health-Mesh FHIR Implementation](./API_Design.md)

---

## Change Log

| Date | Version | Changes |
|-------|----------|---------|
| 2025-01-26 | 1.0 | Initial documentation for Phase 1 HL7 integration |
