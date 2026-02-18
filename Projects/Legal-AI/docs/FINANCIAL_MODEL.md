## 2. Financial Model (Projected 3‑Year)

### 2.1 Assumptions

| Category | Assumption | Rationale |
|----------|------------|-----------|
| **Customer Mix** | 50% Slim, 20% Slim BYOM, 20% Standard, 10% Full‑Suite | Market research indicates high demand for lightweight on‑prem solutions. |
| **ARR Growth** | 120 % YoY (due to 100% new ARR + 20 % upsell) | Aggressive sales targeting; high churn expected early but will drop. |
| **Average Contract Value** | 18 k /year (mid‑tier) | Derived from pod pricing (mid‑tier = Standard). |
| **Upsell Rate** | 30 % of customers upgrade after 12 months | Based on early pilot feedback. |
| **Consulting Revenue** | 25 % of ARR (consulting & training) | 100 h at $250/hr per customer. |
| **Operating Costs** | 35 % of ARR (incl. dev, sales, cloud) | Typical SaaS margin. |
| **Capital Expenditure** | $1 M initial dev + $0.5 M cloud | Build MVP and host on cloud. |
| **Tax & Depreciation** | 25 % corporate tax | Standard US corporate. |

### 2.2 Revenue Projections

| Year | New Customers | Upsell Customers | ARR (USD) | Consulting (USD) | Total ARR |
|------|---------------|------------------|-----------|------------------|-----------|
| 1    | 100           | 0                | 1.8 M     | 450 k            | 2.25 M    |
| 2    | 250           | 60 (30% of 200)  | 6.0 M     | 1.5 M            | 7.5 M     |
| 3    | 500           | 180 (30% of 600) | 15 M      | 3.75 M           | 18.75 M   |

*Notes:*
- **Year 1** – 100 customers on average $18 k/yr (Standard & Full).
- **Year 2** – New + upsell = 310 customers → $6 M ARR.
- **Year 3** – Market penetration grows to 680 customers → $F15 IMN ARR.

### 2A.3 Expense BreakdownN

| Category | Year 1 | Year 2 | Year 3 |
|----------|--------|--------|--------|
| **Salaries** (Dev, Ops, Sales, Consulting) | 1.2 M | 2.0 M | 3.0 M |
| **Cloud & Hosting** | 0.6 M | 1.0 M | 1.5 M |
| **Marketing / Sales** | 0.3 M | 0.5 M | 0.8 M |
| **Legal / Compliance** | 0.1 M | 0.1 M | 0.1 M |
| **Other (Office, Travel)** | 0.1 M | 0.15 M | 0.2 M |
| **CapEx** | 1.5 M | 0 | 0 |
| **Total Operating Cost** | 3.7 M | 3.8 M | 5.6 M |

### 2.4 EBITDA & Cash Flow

| Year | Total ARR | Total Revenue | Operating Cost | EBITDA | Tax (25%) | Net Cash Flow |
|------|-----------|---------------|----------------|--------|-----------|---------------|
| 1    | 2.25 M    | 2.25 M        | 3.7 M          | -1.45 M | 0         | -1.45 M       |
| 2    | 7.5 M     | 7.5 M         | 3.8 M          | 3.7 M  | 0.925 M   | 2.775 M       |
| 3    | 18.75 M   | 18.75 M       | 5.6 M          | 13.15 M| 3.29 M    | 9.86 M        |

*Key Takeaway:* The business becomes **breakeven** in Q4 of Year 2 and achieves **positive
cash flow** by Year 3. Profitability is driven by high gross margin (≈ 60 %) and the ability
to add consulting services without significant incremental cost.

### 2.5 Sensitivity Analysis

| Variable | Base | ±10 % | Impact on Year 3 Net Cash Flow |
|----------|------|-------|--------------------------------|
| ARR Growth | 120 % | 108 % / 132 % | -$2.2 M / +$1.0 M |
| Upsell Rate | 30 % | 27 % / 33 % | -$1.0 M / +$0.8 M |
| Consulting % | 25 % | 22.5 % / 27.5 % | -$0.8 M / +$0.8 M |
| Operating Cost | 35 % | 32 % / 38 % | -$1.2 M / +$1.6 M |

The model is robust to reasonable swings in key parameters.

---

## 3. Implementation Roadmap (Next 12 Months)

| Month | Milestone | KPI |
|-------|-----------|-----|
| 1 | Finalize architecture & security plan | Architecture diagram signed off |
| 2 | Build Slim pod MVP (MCP + RAG + DB) | MVP ready for internal QA |
| 3 | Integrate Uploader + Auth | 100% functional ingestion |
| 4 | Pilot with 3 early‑adopter SMEs | Feedback score ≥ 8/10 |
| 5 | Launch Data‑Cleaning service (prototype) | 10 GB cleaned per month |
| 6 | Release Standard pod (add uploader) | 5 pilot users |
| 7 | Publish OpenWeb UI | 80 % user satisfaction |
| 8 | Deploy Full‑Suite pod (UI + Ollama) | 3 full‑suite pilots |
| 9 | Implement BYOM flow (Ollama runtime) | 2 BYOM customers |
|10 | Scale cloud infra to 10 GB storage | 95 % uptime |
|11 | Integrate Cyber Audit & Contract Validation | 2 use‑cases |
|12 | Official public launch | 50 paying customers |

---

## 4. Summary

* **Financials** – 3‑year model projects breakeven by Q4 Year 2 and > $10 M net cash flow by
Year 3, driven by high gross margin and consulting add‑ons.
* **Execution** – 12‑month build‑test‑release cycle, starting with a lightweight Slim pod and
expanding to full‑suite with BYOM support.

Feel free to request deeper dives into any component (e.g., cost‑per‑pod detailed, detailed
KPI dashboards, or investor pitch deck).