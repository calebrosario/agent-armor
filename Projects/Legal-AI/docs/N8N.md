elow is a concise, high‑level overview of the guidelines that govern how I respond.
I’m designed to follow these principles consistently across every conversation.

---

## 1.  **Safety & Harm Prevention**

| Rule | What it means | Example |
|------|----------------|---------|
| **No disallowed content** | I must not provide instructions, code, or data that can be used
to create or distribute malicious software, commit wrongdoing, or facilitate illegal
activity. | I won’t give you a step‑by‑step guide to scrape private data. |
| **Protect personal data** | I can’t share or reveal private information about real people
(names, addresses, etc.) unless it’s publicly available and the user specifically requests it
in a context that respects privacy. | I can’t give you an email address for a private
individual. |
| **Disallowed content types** | Advice on hacking, phishing, social engineering, weapons, or
any illegal behavior. | I refuse to write a phishing script. |

---

## 2.  **Privacy & Ethics**

| Rule | What it means | Example |
|------|----------------|---------|
| **No personal data extraction** | I can’t help extract or list personal data that is not
publicly available. | I can’t provide a list of phone numbers that are not publicly posted. |
| **Respect user intent** | If a user explicitly asks for disallowed content, I refuse or
safe‑guard the request. | If you say, “Help me create a phishing email,” I refuse. |
| **Transparency** | I disclose limitations and encourage safe, legal alternatives. | “I’m
sorry, but I can’t help with that. Here’s a legal way to get the data you need.” |

---

## 3.  **Copyright & Intellectual Property**

| Rule | What it means | Example |
|------|----------------|---------|
| **No copyrighted text** | I can’t provide large blocks of copyrighted text (e.g., a novel,
a technical manual) unless it’s in the public domain. | I’ll summarize a book, not quote it
verbatim. |
| **No “plagiarism”** | I can’t give you code or text that is directly copied from a
proprietary source without permission. | I’ll explain how a concept works, not paste the
code. |

---

## 4.  **Content Moderation**

| Rule | What it means | Example |
|------|----------------|---------|
| **No extremist or hate content** | I refuse to produce or repeat extremist propaganda, hate
speech, or content that targets protected groups. | I refuse to repeat a hateful slogan. |
| **No explicit sexual content** | I avoid pornographic or exploitative sexual content. | I
refuse to provide graphic sexual detail. |
| **No self‑harm or suicide encouragement** | I must not facilitate or encourage self‑harm. |
I provide a safe‑harbor resource instead. |

---

## 5.  **User‑Focused Interaction**

| Rule | What it means | Example |
|------|----------------|---------|
| **No disallowed instructions** | If a user’s request is disallowed, I refuse or safe‑guard.
| “Help me write a script to scrape private data” → refusal. |
| **Encourage lawful alternatives** | I can suggest legitimate ways to achieve a goal. |
“Here’s how to use LinkedIn’s official API.” |
| **Non‑commercial, privacy‑respecting data** | I can mention publicly available sources or
datasets that are free to use. | “You can use the OpenCorporates API.” |

---

## 6.  **General Principles**

* **Accuracy & Clarity** – Provide helpful, correct answers.
* **Transparency** – Disclose that a request is disallowed when it is.
* **Respect for Boundaries** – Never provide content that violates the policy.

---

### How This Applies to You

If you want help with a legitimate business or tech question—such as building a product,
using open APIs, or designing an architecture—I’m happy to help.
If a request involves scraping private data, automating data extraction from protected sites,
or other activities that could be illegal or unethical, I will refuse or redirect you to a
lawful alternative.

>>> create a business plan where the go to market stratagy leverages n8n workflow for a quick local
...  rag instance and migrates to the previous plan
Thinking...
User wants a business plan with Go to Market strategy leveraging n8n workflow for quick local
RAG instance, then migrating to previous plan. They want a plan, not disallowed content. It's
fine: providing a business plan is allowed. So I can comply. Should produce business plan,
describing market, product, go-to-market with n8n workflow to quickly spin up a local RAG
instance, then migration to the previous plan (likely the full suite). No disallowed content.
So comply.
...done thinking.

**Business Plan: “Prvcy‑Suite – Local‑First, Cloud‑Ready”**

| Section | Key Points |
|---------|------------|
| **Executive Summary** |  • *Prvcy‑Suite* is a modular, privacy‑first data‑analysis platform
(RAG + UI + BYOM).  <br>• Launch with a “Local‑First” offering that lets customers spin up a
full RAG stack on their own laptop or on‑prem server using an automated *n8n* workflow.
<br>• After 90 days, customers automatically migrate to the fully managed cloud version (EKS
+ managed Postgres + auto‑scale).  <br>• Go‑to‑market (GTM) leverages a low‑barrier trial,
self‑service onboarding, and a community‑driven “DevOps‑as‑Code” model. |
| **Problem & Opportunity** | • Many enterprises can’t run a private RAG stack due to lack of
data‑engineering expertise. <br>• GDPR/CCPA & corporate policy make “cloud‑only” solutions
risky. <br>• Quick, repeatable local prototypes lower the friction for data‑science teams to
test the technology. <br>• Opportunity: first‑mover in “local‑to‑cloud” privacy‑AI pipeline.
|
| **Solution Overview** | 1. **Local Starter Kit** – a single‑click `n8n` workflow that
pulls in a Docker‑based RAG stack (vector store, web‑scraper, UI, Ollama). <br>2. **Managed
Cloud Offering** – same product but hosted on EKS, auto‑scaling, managed database, S3‑backed
storage. <br>3. **Migration Path** – `n8n` workflow detects data drift & offers a one‑click
“Migrate to Cloud” button that pushes the current state to the cloud environment. |
| **Target Market** | • **Tech‑savvy SMBs** (500‑2,000 employees) that need internal
data‑analysis tools but lack a data‑science team. <br>• **Enterprise data‑science squads**
who want a local sandbox before scaling. <br>• **Consultants / Freelancers** who need a
quick, reproducible demo. <br>• **Government & Finance** where privacy laws dictate local
hosting. |
| **Pricing Model** | • **Free Tier** – 1 GB local vector store, 1 CPU, 2 GB RAM, 30 days
trial. <br>• **Starter** – $49 / month (local) or $99 / month (cloud) with 5 GB vector store.
<br>• **Pro** – $199 / month (cloud) with 25 GB vector store, auto‑scaling, SLA. <br>•
**Enterprise** – custom pricing, dedicated support, on‑prem hosting option. |
| **Go‑to‑Market Strategy** | 1. **Launch “Quick‑Start” Landing Page** – Highlight the
“One‑click n8n” flow, demo videos, and customer testimonials. <br>2. **Community‑Built
Starter Kit** – Publish the n8n workflow on GitHub and n8n’s own workflow library. <br>3.
**Self‑Serve Onboarding** – When a user clicks “Run in Docker” the n8n workflow installs
Docker, pulls the container images, spins up the stack, and seeds it with sample queries.
<br>4. **Lead Capture** – The same workflow prompts the user to sign up for a free account;
the signup data is sent to a CRM via an API call. <br>5. **Education & Thought‑Leadership** –
Webinars, “Build‑Your‑Own RAG” challenges, hackathons that encourage users to publish their
n8n workflow. <br>6. **Enterprise Outreach** – Targeted LinkedIn ads for CTOs, data‑science
managers, compliance officers. <br>7. **Migrate‑to‑Cloud Upsell** – After 90 days, the n8n
workflow offers an automated “Migrate to Cloud” button that provisions the user’s EKS
environment and transfers data. |
| **n8n Workflow – Quick‑Start (Simplified Flow)** | 1. **Trigger** – User clicks “Run on
Local”. <br>2. **Check Docker** – Verify Docker is installed; if not, offer a one‑click
installer. <br>3. **Pull Images** – Pull `prvcy/rag‑base:latest`, `prvcy/ui:latest`,
`prvcy/ollama:latest`. <br>4. **Compose** – Run `docker‑compose up -d`. <br>5. **Seed Data**
– Insert a default vector store schema and sample data (public‑domain documents). <br>6.
**Expose UI** – Generate a random port and share a short‑link. <br>7. **Collect Lead** – Send
`POST` to `/api/lead` with `email`, `name`, `company`, `jobTitle`. <br>8. **Send Welcome
Email** – Call the email service (SendGrid, SES). <br>9. **Track Usage** – Periodic `metrics`
endpoint that logs number of queries, memory usage, etc. to a central analytics DB. |
| **Technology Stack** | • **Front‑End** – Vue.js / Nuxt + Quasar. <br>• **Back‑End** –
Python (FastAPI) for the RAG API. <br>• **Vector Store** – pgvector on PostgreSQL. <br>•
**LLM** – Ollama (Open‑source) or custom fine‑tuned models. <br>• **Orchestration** – n8n for
the local bootstrap and migration. <br>• **Cloud** – EKS + managed PostgreSQL (Amazon RDS).
<br>• **CI/CD** – GitHub Actions + ArgoCD. |
| **Key Partnerships** | • **Docker Hub / GHCR** – For container distribution. <br>• **AWS**
– Managed services, credits for early adopters. <br>• **OpenAI / HuggingFace** – Model
integration. <br>• **Data‑Provider** – Partnerships with public data portals (e.g., Kaggle).
|
| **Financial Projections (Year 1)** | • **Revenue** – $300K (30 % from cloud upsell). <br>•
**Cost of Goods Sold** – $50K (cloud infra + support). <br>• **Operating Expenses** – $150K
(engineering, marketing, office). <br>• **Gross Margin** – 70 %. <br>• **Burn** – 12 months
runway with $500K seed. |
| **Milestones** | | • **Month 1–3** – MVP of n8n workflow, local demo. <br>• **Month 4–6** –
Public beta, first 50 paying customers. <br>• **Month 7–9** – Launch cloud migration feature,
first enterprise contract. <br>• **Month 10–12** – Scale marketing, add additional LLM
integrations. |
| **Risk & Mitigation** | • **Data‑privacy regulations** – Mitigate by keeping data local
until migration. <br>• **Adoption barrier** – Lower with the n8n workflow; provide a
“no‑code” UI. <br>• **Competition** – Differentiate with full local‑first + easy migration.
<br>• **Infrastructure cost** – Use spot instances for development; lock‑in AWS credits for
early pilots. |
| **Conclusion** | The “Local‑First, Cloud‑Ready” model uses *n8n* to lower the technical
barrier, give prospects a tangible, risk‑free demo, and then smoothly transition them to a
fully managed cloud solution. The modular product, clear pricing tiers, and community‑driven
workflow pipeline create a sustainable growth engine. |

---

### How the n8n Workflow Fits Into the GTM

1. **Zero‑Touch Onboarding** – Prospects run the n8n workflow with one click; they see a
working RAG system in seconds.
2. **Lead Generation** – The same workflow pushes a lead record to your CRM, so you have a
funnel from the first click.
3. **Self‑Help Resources** – The n8n workflow is open‑source; users can fork it, tweak it,
and even publish their own versions.
4. **Migration Automation** – When the local instance is mature, the workflow automatically
provisions the cloud stack, copies the vector store, and updates DNS records.
5. **Analytics Loop** – The workflow reports usage back to a central server, enabling
data‑driven decisions on feature‑rollouts and pricing tiers.

With this strategy you give prospects an immediate, hands‑on experience, capture leads
automatically, and convert those leads into paying customers—both in the local and cloud
deployments—while keeping operational costs low and scalability high.