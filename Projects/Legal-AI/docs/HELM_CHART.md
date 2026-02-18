## 1. Helm Chart Skeleton

```
prvcy-suite/
├── Chart.yaml
├── values.yaml
├── values-dev.yaml
├── values-prod.yaml
├── templates/
│   ├── _helpers.tpl
│   ├── namespace.yaml
│   ├── pvc.yaml
│   ├── configmap.yaml
│   ├── secret.yaml
│   ├── deployment-slim.yaml
│   ├── deployment-standard.yaml
│   ├── deployment-full-suite.yaml
│   ├── deployment-byom.yaml
│   ├── deployment-privacy.yaml
│   ├── service-slim.yaml
│   ├── service-standard.yaml
│   ├── service-full-suite.yaml
│   ├── service-byom.yaml
│   ├── service-privacy.yaml
│   ├── ingress.yaml
│   └── job-data-cleaning.yaml
└── .helmignore
```

> All the templates are written with **Go‑Template** syntax so that you can use a single
chart for both AWS EKS *and* local Kubernetes (kind, minikube, …).

### 1.1 `Chart.yaml`

```yaml
apiVersion: v2
name: prvcy-suite
description: Prvcy‑Suite – MCP + RAG + UI + Ollama + BYOM + Cyber‑Audit
type: application
version: 0.1.0
appVersion: "1.0.0"
```

### 1.2 `values.yaml` (common defaults)

```yaml
# Common defaults – these will be overridden by values-dev.yaml / values-prod.yaml
# ---------------------------------------------------------------------------

# Which namespace the chart will own
namespace: prvcy

# Docker image defaults
image:
  registry: ghcr.io
  repository: prvcy
  tag: latest
  pullSecret: ghcr-creds     # name of imagePullSecret

# Generic PVC size – overridden per sub‑chart
pvc:
  size: 10Gi

# RAG / vector‑store defaults – also overridden per sub‑chart
rag:
  vectorStore: pgvector
  vectorDb: pgvector

# Database (PostgreSQL) – override host/name/port per environment
db:
  host: ""
  name: ""
  port: "5432"
  user: "postgres"
  password: ""

# Ingress defaults – override in dev/prod
ingress:
  host: "prvcy.local"          # e.g. prvcy.example.com
  tlsSecret: ""

# -----------------------------------------------------------------------------
# Package‑specific defaults – all overridden in values‑dev.yaml / values‑prod.yaml
# -----------------------------------------------------------------------------
packages:
  slim:
    image: ""
    replicas: 1
    envName: "POD_MODE"
    envValue: "slim"
    resources:
      requests:
        cpu: "0.5"
        memory: "512Mi"
      limits:
        cpu: "1"
        memory: "1Gi"
  standard:
    image: ""
    replicas: 1
    envName: "POD_MODE"
    envValue: "standard"
    resources:
      requests:
        cpu: "0.75"
        memory: "1Gi"
      limits:
        cpu: "1.5"
        memory: "2Gi"
  fullSuite:
    uiImage: ""
    ollamaImage: ""
    replicas: 1
    resources:
      web:
        requests:
          cpu: "1"
          memory: "2Gi"
        limits:
          cpu: "2"
          memory: "4Gi"
      ollama:
        requests:
          cpu: "4"
          memory: "4Gi"
        limits:
          cpu: "8"
          memory: "8Gi"
  byom:
    uiImage: ""
    ollamaImage: ""
    replicas: 1
  privacy:
    uiImage: ""
    ollamaImage: ""
    replicas: 1
```

> *The `values-dev.yaml` / `values-prod.yaml` files only need to override the parts that
change between environments (image tags, pull secrets, DB credentials, etc.).*


### 1.3 `_helpers.tpl`

```yaml
{{/* Name helpers – keeps chart tidy */}}
{{- define "prvcy.name" -}}
{{- printf "%s-%s" .Release.Name .Chart.Name -}}
{{- end -}}

{{- define "prvcy.labels" -}}
app.kubernetes.io/name: {{ .Chart.Name }}
app.kubernetes.io/instance: {{ .Release.Name }}
app.kubernetes.io/version: {{ .Chart.AppVersion }}
app.kubernetes.io/managed-by: Helm
{{- end -}}
```

### 1.4 `templates/namespace.yaml`

```yaml
{{- if .Values.namespace }}
apiVersion: v1
kind: Namespace
metadata:
  name: {{ .Values.namespace }}
{{- end }}
```

### 1.5 `templates/pvc.yaml`

```yaml
{{- if .Values.pvc.size }}
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: {{ .Values.pvc.name }}
  namespace: {{ .Values.namespace }}
spec:
  accessModes:
    - ReadWriteOnce
  resources:
    requests:
      storage: {{ .Values.pvc.size }}
{{- end }}
```

> *Add separate PVC templates for each sub‑chart – e.g. `pvc-slim.yaml`, `pvc-upload.yaml`, …
– if you want separate storage classes or sizes.*

### 1.6 `templates/configmap.yaml`

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: prvcy-config
  namespace: {{ .Values.namespace }}
data:
  POSTGRES_HOST: "{{ .Values.db.host }}"
  POSTGRES_DB:   "{{ .Values.db.name }}"
  POSTGRES_PORT: "{{ .Values.db.port }}"
  RAG_VECTOR_STORE: "{{ .Values.rag.vectorStore }}"
```

### 1.7 `templates/secret.yaml`

```yaml
apiVersion: v1
kind: Secret
metadata:
  name: prvcy-db-creds
  namespace: {{ .Values.namespace }}
type: Opaque
stringData:
  POSTGRES_USER:     "{{ .Values.db.user }}"
  POSTGRES_PASSWORD: "{{ .Values.db.password }}"
```

> *For AWS EKS you normally create the secret from the EKS console or from a *helm secrets*
plugin.*

### 1.8 `templates/deployment-slim.yaml`

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: {{ include "prvcy.name" . }}-slim
  namespace: {{ .Values.namespace }}
  labels: {{- include "prvcy.labels" . | nindent 4 }}
spec:
  replicas: {{ .Values.packages.slim.replicas }}
  selector:
    matchLabels:
      app: {{ include "prvcy.name" . }}-slim
  template:
    metadata:
      labels:
        app: {{ include "prvcy.name" . }}-slim
    spec:
      containers:
        - name: slim
          image: "{{ .Values.packages.slim.image }}"
          imagePullPolicy: IfNotPresent
          envFrom:
            - configMapRef:
                name: prvcy-config
          env:
            - name: POD_MODE
              value: "slim"
          resources:
            requests:
              cpu: "{{ .Values.packages.slim.resources.requests.cpu }}"
              memory: "{{ .Values.packages.slim.resources.requests.memory }}"
            limits:
              cpu: "{{ .Values.packages.slim.resources.limits.cpu }}"
              memory: "{{ .Values.packages.slim.resources.limits.memory }}"
          ports:
            - containerPort: 80
              name: http
      imagePullSecrets:
        - name: {{ .Values.image.pullSecret }}
```

### 1.9 `templates/service-slim.yaml`

```yaml
apiVersion: v1
kind: Service
metadata:
  name: slim-svc
  namespace: {{ .Values.namespace }}
spec:
  selector:
    app: {{ include "prvcy.name" . }}-slim
  ports:
    - name: http
      port: 80
      targetPort: 80
  type: ClusterIP
```

### 1.10 `templates/ingress.yaml`

```yaml
{{- if .Values.ingress.host }}
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: prvcy-ingress
  namespace: {{ .Values.namespace }}
  annotations:
    kubernetes.io/ingress.class: nginx
    {{- if .Values.ingress.tlsSecret }}
    kubernetes.io/tls-acme: "true"
    {{- end }}
spec:
  tls:
    - hosts:
        - {{ .Values.ingress.host }}
      secretName: {{ .Values.ingress.tlsSecret }}
  rules:
    - host: {{ .Values.ingress.host }}
      http:
        paths:
          - path: /slim
            pathType: Prefix
            backend:
              service:
                name: slim-svc
                port:
                  name: http
          - path: /standard
            pathType: Prefix
            backend:
              service:
                name: standard-svc
                port:
                  name: http
          - path: /full-suite
            pathType: Prefix
            backend:
              service:
                name: full-suite-svc
                port:
                  name: web
{{- end }}
```

> *The chart only exposes the **UI** services – you can comment out any path you don’t want
to be public.*

### 1.11 `templates/deployment-standard.yaml`, `deployment-full-suite.yaml`, etc.

Copy the *slim* template, tweak the `image`, `replicas`, `resources`, and `env` for each
package.
(You only need to create the *sub‑charts* you actually want to deploy.)

---

## 2. Deployment Script (`deploy.sh`)

Below is a **single‑file Bash script** that will:

1. Detect whether you want to deploy to *AWS EKS* or *local* (kind/minikube).
2. Ensure the appropriate Kubernetes context is active.
3. Install or upgrade the chart with the correct values file.
4. Optionally clean up the chart.

```bash
#!/usr/bin/env bash
#
# deploy.sh – Deploy the Prvcy‑Suite Helm chart
#
# Usage:
#   ./deploy.sh  --env=dev|prod   --platform=aws|local   [--cleanup]
#
# Prereqs (must be on PATH):
#   helm     (v3)
#   kubectl  (>=1.20)
#   aws-cli  (for aws sub‑commands)
#   eksctl   (for creating EKS clusters, optional)
#   kind     (for local cluster)
#
# The script keeps the logic very small – you can copy it into your
# own repo and tweak it as needed.
#
set -euo pipefail

# ------------------------------------------------------------------
# Default values – overridden by flags
# ------------------------------------------------------------------
ENVIRONMENT="dev"
PLATFORM="local"
CLEANUP=false
CHART_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../prvcy-suite" && pwd)"   # <-- adapt if you
place chart elsewhere
RELEASE_NAME="prvcy-suite"
VALUES_FILE="values-${ENVIRONMENT}.yaml"

# ------------------------------------------------------------------
# Helper functions
# ------------------------------------------------------------------
usage() {
  echo "Usage: $0 [--env=dev|prod] [--platform=aws|local] [--cleanup] [--help]"
  exit 1
}

fail() { echo "❌  $*" >&2; exit 1; }

# Resolve kubecontext
current_context() {
  kubectl config current-context
}

set_context() {
  case "$PLATFORM" in
    aws)
      # We assume an EKS cluster called "prvcy-$ENVIRONMENT"
      eksctl create cluster --name "prvcy-${ENVIRONMENT}" --region us-east-1 --nodes 2
--nodes-min 1 --nodes-max 4
      eksctl update kubeconfig --name "prvcy-${ENVIRONMENT}"
      echo "✅  Context set to: $(current_context)"
      ;;
    local)
      # Either kind or minikube – we default to kind
      kind create cluster --name "prvcy-${ENVIRONMENT}" --config=kind-config.yaml || true
      kubectl config use-context "kind-prvcy-${ENVIRONMENT}"
      echo "✅  Context set to: $(current_context)"
      ;;
    *)
      fail "Unsupported platform: $PLATFORM"
      ;;
  esac
}

# ------------------------------------------------------------------
# Parse flags
# ------------------------------------------------------------------
while [[ $# -gt 0 ]]; do
  case "$1" in
    --env=*)
      ENVIRONMENT="${1#*=}"
      shift
      ;;
    --platform=*)
      PLATFORM="${1#*=}"
      shift
      ;;
    --cleanup)
      CLEANUP=true
      shift
      ;;
    --help|-h)
      usage
      ;;
    *)
      echo "Unknown argument: $1"
      usage
      ;;
  esac
done

# ------------------------------------------------------------------
# Validation
# ------------------------------------------------------------------
if [[ ! -d "$CHART_DIR" ]]; then
  fail "Chart directory not found: $CHART_DIR"
fi

if [[ ! -f "$CHART_DIR/Chart.yaml" ]]; then
  fail "Chart.yaml missing in: $CHART_DIR"
fi

if [[ ! -f "$CHART_DIR/values-${ENVIRONMENT}.yaml" ]]; then
  fail "Missing values-$ENVIRONMENT.yaml – please create it (dev/prod)."
fi

# ------------------------------------------------------------------
# Switch context
# ------------------------------------------------------------------
set_context

# ------------------------------------------------------------------
# Deploy Helm chart
# ------------------------------------------------------------------
echo "🔧  Helm installing $RELEASE_NAME from $CHART_DIR ..."
helm upgrade --install "$RELEASE_NAME" "$CHART_DIR" \
  --namespace "$RELEASE_NAME" \
  --create-namespace \
  -f "$CHART_DIR/values-${ENVIRONMENT}.yaml"

echo "✅  $RELEASE_NAME deployed (context: $(current_context))"

# ------------------------------------------------------------------
# Optional cleanup
# ------------------------------------------------------------------
if [[ "$CLEANUP" == true ]]; then
  echo "🧹  Cleaning up: helm uninstall $RELEASE_NAME ..."
  helm uninstall "$RELEASE_NAME"
  echo "🧹  Removed chart"

  if [[ "$PLATFORM" == "aws" ]]; then
    echo "🧹  Deleting EKS cluster ..."
    eksctl delete cluster --name "prvcy-${ENVIRONMENT}"
  else
    echo "🧹  Deleting kind cluster ..."
    kind delete cluster --name "prvcy-${ENVIRONMENT}"
  fi
fi

echo "🎉  Done!"
```

> **Why it works on both AWS & local**
> *The script only differs in the `set_context()` function:*
> * On **AWS** it creates/updates an EKS cluster with `eksctl`, switches the kubeconfig and
deploys.
> * On **local** it creates a kind cluster (you can change to minikube if you prefer).
> After that everything is pure Kubernetes – Helm does the same thing in both cases.

### 2.1 Optional `kind-config.yaml`

If you want a reproducible kind cluster (without AWS credentials) add:

```yaml
kind: Cluster
apiVersion: kind.x-k8s.io/v1alpha4
nodes:
  - role: control-plane
    image: kindest/node:v1.27.3
  - role: worker
    image: kindest/node:v1.27.3
```

Save it next to `deploy.sh` and the script will pick it up automatically.

### 2.2 Optional `values-dev.yaml` & `values-prod.yaml`

*Only copy the parts that differ per environment.*

```yaml
# values-dev.yaml
image:
  registry: "docker.io"
  pullSecret: "docker-credentials"
ingress:
  host: "prvcy.dev.local"
  tlsSecret: ""

packages:
  slim:
    image: "docker.io/prvcy/slim:dev"
    replicas: 1
    resources:
      requests:
        cpu: "0.5"
        memory: "512Mi"
      limits:
        cpu: "1"
        memory: "1Gi"
# … repeat for other packages
```

```yaml
# values-prod.yaml
image:
  registry: "ghcr.io"
  pullSecret: "ghcr-creds"
ingress:
  host: "prvcy.example.com"
  tlsSecret: "prvcy-tls"

packages:
  slim:
    image: "ghcr.io/prvcy/slim:1.0.0"
    replicas: 2
    resources:
      requests:
        cpu: "0.5"
        memory: "512Mi"
      limits:
        cpu: "1"
        memory: "1Gi"
# … repeat for other packages
```

> **Tip:** `helm upgrade --install` automatically merges `values.yaml` with `-f
values-dev.yaml`.
> So if you call:

```
helm upgrade --install prvcy-suite ./prvcy-suite -f ./prvcy-suite/values-dev.yaml
```

> the dev‑specific overrides will be applied.

---

## 3. Full Example Flow

### 3.1 Deploy to AWS (EKS)

```bash
# 1️⃣ Create/choose cluster (auto‑created by the script)
./deploy.sh --env=prod --platform=aws

# 2️⃣ Verify
kubectl get all -n prvcy-suite
```

### 3.2 Deploy to Local (kind)

```bash
# 1️⃣ Deploy
./deploy.sh --env=dev --platform=local

# 2️⃣ Verify
kubectl get all -n prvcy-suite
```

### 3.3 Clean Up

```bash
# Remove chart + cluster
./deploy.sh --env=prod --platform=aws --cleanup
```

---

## 4. Checklist & Gotchas

| Item | Prerequisite | Notes |
|------|--------------|-------|
| **kubectl** | v1.20+ | Must be configured for the target cluster |
| **helm** | v3+ | `helm repo add` etc. |
| **aws‑cli** | – | For `eksctl` if you want to create/delete clusters |
| **eksctl** | – | `eksctl create cluster --name prvcy-prod ...` |
| **kind** | – | `kind create cluster` |
| **Docker registry creds** | ImagePullSecrets | Add `--set image.pullSecret=…` or create a `secret.yaml` |
| **TLS** | Ingress | For prod, create a `prvcy-tls` secret (`kubectl create secret tls …`) |

*If you run into “permission denied” errors when pulling images, make sure `image.pullSecret`
matches a Secret that contains your registry credentials.*

---

### 5. What You Get

* A **single Helm chart** that contains everything you need: deployments, services, ingress,
PVCs, ConfigMap/Secret.
* A **portable deployment script** (`deploy.sh`) that works on *AWS EKS* and on *local
hardware* (kind or minikube).
* Clear instructions on what to tweak in `values‑dev.yaml` / `values‑prod.yaml` (image tags,
DB hosts, TLS secrets, etc.).

Happy deploying! 🚀
```

This answer gives you the full, reusable Helm chart plus a simple deployment script that will
let you install the chart on both AWS and locally with the same code base. Adjust the values
files for your image registry and database credentials, and you’re ready to ship.