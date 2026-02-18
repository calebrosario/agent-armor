Below is a **starter kit** of YAML templates that you can drop into a Git‑repo or Helm chart.

Each “package” (Slim, Standard, Full‑Suite, BYOM, Privacy, etc.) is represented by a
**Deployment** + **Service** (and, where necessary, a **ConfigMap/Secret** and an
**Ingress**).

> **Tip:** Replace the `{{ … }}` placeholders with your actual values or, if you use Helm,
reference them via `{{ .Values.xxx }}`.

---

## 1. Common Namespace & Resource Quotas

```yaml
# namespace.yaml
apiVersion: v1
kind: Namespace
metadata:
  name: prvcy-{{ .Values.environment }}   # e.g., prvcy-prod, prvcy-dev
---
apiVersion: v1
kind: ResourceQuota
metadata:
  name: pod-quota
  namespace: prvcy-{{ .Values.environment }}
spec:
  hard:
    requests.cpu: "20"
    requests.memory: 50Gi
    limits.cpu: "40"
    limits.memory: 100Gi
```

---

## 2. Shared ConfigMap & Secret (DB creds, API keys, etc.)

```yaml
# configmap.yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: prvcy-config
  namespace: prvcy-{{ .Values.environment }}
data:
  POSTGRES_HOST: "{{ .Values.db.host }}"
  POSTGRES_DB:   "{{ .Values.db.name }}"
  POSTGRES_PORT: "{{ .Values.db.port }}"
  RAG_VECTOR_STORE: "{{ .Values.rag.vectorStore }}"
```

```yaml
# secret.yaml
apiVersion: v1
kind: Secret
metadata:
  name: prvcy-db-creds
  namespace: prvcy-{{ .Values.environment }}
type: Opaque
stringData:
  POSTGRES_USER:   "{{ .Values.db.user }}"
  POSTGRES_PASSWORD: "{{ .Values.db.password }}"
```

---

## 3. Base Pod Template (used by every package)

```yaml
# base-pod.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: {{ .Values.pod.name }}-{{ .Values.environment }}
  namespace: prvcy-{{ .Values.environment }}
  labels:
    app.kubernetes.io/name: {{ .Values.pod.name }}
    app.kubernetes.io/part-of: prvcy
spec:
  replicas: {{ .Values.pod.replicas | default 1 }}
  selector:
    matchLabels:
      app.kubernetes.io/name: {{ .Values.pod.name }}
  template:
    metadata:
      labels:
        app.kubernetes.io/name: {{ .Values.pod.name }}
    spec:
      containers:
        - name: {{ .Values.pod.name }}
          image: "{{ .Values.image.registry }}/{{ .Values.image.repository }}:{{
.Values.image.tag }}"
          imagePullPolicy: IfNotPresent
          ports:
            - containerPort: 80
              name: http
          envFrom:
            - configMapRef:
                name: prvcy-config
          env:
            - name: DATABASE_URL
              valueFrom:
                secretKeyRef:
                  name: prvcy-db-creds
                  key: POSTGRES_URL
            - name: RAG_VECTOR_DB
              value: "{{ .Values.rag.vectorDb }}"
            - name: {{ .Values.pod.envName }}
              value: "{{ .Values.pod.envValue }}"
          resources:
            requests:
              cpu:    "{{ .Values.pod.resources.requests.cpu }}"
              memory: "{{ .Values.pod.resources.requests.memory }}"
            limits:
              cpu:    "{{ .Values.pod.resources.limits.cpu }}"
              memory: "{{ .Values.pod.resources.limits.memory }}"
          volumeMounts:
            - name: {{ .Values.pod.volumeClaimName }}
              mountPath: "/data"
          # OPTIONAL: add a read‑only volume for the vector store
          # - name: vector-store
          #   mountPath: "/vector"
          #   readOnly: true
      volumes:
        - name: {{ .Values.pod.volumeClaimName }}
          persistentVolumeClaim:
            claimName: {{ .Values.pod.pvcName }}
      imagePullSecrets:
        - name: {{ .Values.image.pullSecret }}
```

---

## 3. Package‑Specific Deployments & Services

### 3.1 Slim Package (MCP + RAG + DB)

```yaml
# slim.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: slim
  namespace: prvcy-{{ .Values.environment }}
spec:
  replicas: 1
  selector:
    matchLabels:
      app: slim
  template:
    metadata:
      labels:
        app: slim
    spec:
      containers:
        - name: slim
          image: "{{ .Values.slim.image }}"
          imagePullPolicy: IfNotPresent
          env:
            - name: POD_MODE
              value: "slim"
          resources:
            requests:
              cpu: "0.5"
              memory: "512Mi"
            limits:
              cpu: "1"
              memory: "1Gi"
          ports:
            - containerPort: 8080
          volumeMounts:
            - name: data-pvc
              mountPath: "/app/data"
      volumes:
        - name: data-pvc
          persistentVolumeClaim:
            claimName: prvcy-slim-pvc
```

```yaml
# slim-service.yaml
apiVersion: v1
kind: Service
metadata:
  name: slim-svc
  namespace: prvcy-{{ .Values.environment }}
spec:
  selector:
    app: slim
  ports:
    - name: http
      port: 80
      targetPort: 8080
  type: ClusterIP
```

### 3.2 Standard Package (Slim + Uploader)

```yaml
# standard.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: standard
  namespace: prvcy-{{ .Values.environment }}
spec:
  replicas: 1
  selector:
    matchLabels:
      app: standard
  template:
    metadata:
      labels:
        app: standard
    spec:
      containers:
        - name: standard
          image: "{{ .Values.standard.image }}"
          env:
            - name: POD_MODE
              value: "standard"
          resources:
            requests:
              cpu: "0.75"
              memory: "1Gi"
            limits:
              cpu: "1.5"
              memory: "2Gi"
          ports:
            - containerPort: 8080
          volumeMounts:
            - name: upload-volume
              mountPath: "/uploads"
      volumes:
        - name: upload-volume
          persistentVolumeClaim:
            claimName: prvcy-upload-pvc
```

```yaml
# standard-service.yaml
apiVersion: v1
kind: Service
metadata:
  name: standard-svc
  namespace: prvcy-{{ .Values.environment }}
spec:
  selector:
    app: standard
  ports:
    - name: http
      port: 80
      targetPort: 8080
  type: ClusterIP
```

### 3.3 Full‑Suite Package (UI + Ollama)

```yaml
# full-suite.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: full-suite
  namespace: prvcy-{{ .Values.environment }}
spec:
  replicas: 1
  selector:
    matchLabels:
      app: full-suite
  template:
    metadata:
      labels:
        app: full-suite
    spec:
      containers:
        - name: web
          image: "{{ .Values.fullSuite.uiImage }}"
          env:
            - name: POD_MODE
              value: "full-suite"
          resources:
            requests:
              cpu: "1"
              memory: "2Gi"
            limits:
              cpu: "2"
              memory: "4Gi"
          ports:
            - containerPort: 80
        - name: ollama
          image: "{{ .Values.fullSuite.ollamaImage }}"
          resources:
            requests:
              cpu: "4"
              memory: "4Gi"
            limits:
              cpu: "8"
              memory: "8Gi"
          env:
            - name: MODEL
              value: "gpt-4o"
          ports:
            - containerPort: 11434
      volumes:
        - name: vector-store
          persistentVolumeClaim:
            claimName: prvcy-vector-pvc
```

```yaml
# full-suite-service.yaml
apiVersion: v1
kind: Service
metadata:
  name: full-suite-svc
  namespace: prvcy-{{ .Values.environment }}
spec:
  selector:
    app: full-suite
  ports:
    - name: web
      port: 80
      targetPort: 80
    - name: ollama
      port: 11434
      targetPort: 11434
  type: ClusterIP
```

### 3.4 BYOM (Bring‑Your‑Own‑LLM) Package

```yaml
# byom.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: byom
  namespace: prvcy-{{ .Values.environment }}
spec:
  replicas: 1
  selector:
    matchLabels:
      app: byom
  template:
    metadata:
      labels:
        app: byom
    spec:
      containers:
        - name: byom-ui
          image: "{{ .Values.byom.uiImage }}"
          env:
            - name: POD_MODE
              value: "byom"
          resources:
            requests:
              cpu: "1"
              memory: "2Gi"
            limits:
              cpu: "2"
              memory: "4Gi"
          ports:
            - containerPort: 80
        - name: ollama
          image: "{{ .Values.byom.ollamaImage }}"
          env:
            - name: MODEL
              value: "gpt-4o"   # or whatever LLM you provide
          resources:
            requests:
              cpu: "4"
              memory: "4Gi"
            limits:
              cpu: "8"
              memory: "8Gi"
          ports:
            - containerPort: 11434
      volumes:
        - name: vector-store
          persistentVolumeClaim:
            claimName: prvcy-vector-pvc
```

```yaml
# byom-service.yaml
apiVersion: v1
kind: Service
metadata:
  name: byom-svc
  namespace: prvcy-{{ .Values.environment }}
spec:
  selector:
    app: byom
  ports:
    - name: ui
      port: 80
      targetPort: 80
    - name: ollama
      port: 11434
      targetPort: 11434
  type: ClusterIP
```

### 3.5 Privacy Package (No upload – only local DB & UI)

```yaml
# privacy.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: privacy
  namespace: prvcy-{{ .Values.environment }}
spec:
  replicas: 1
  selector:
    matchLabels:
      app: privacy
  template:
    metadata:
      labels:
        app: privacy
    spec:
      containers:
        - name: web
          image: "{{ .Values.privacy.uiImage }}"
          env:
            - name: POD_MODE
              value: "privacy"
          resources:
            requests:
              cpu: "1"
              memory: "2Gi"
            limits:
              cpu: "2"
              memory: "4Gi"
          ports:
            - containerPort: 80
        - name: ollama
          image: "{{ .Values.privacy.ollamaImage }}"
          env:
            - name: MODEL
              value: "gpt-4o"
          resources:
            requests:
              cpu: "4"
              memory: "4Gi"
            limits:
              cpu: "8"
              memory: "8Gi"
          ports:
            - containerPort: 11434
      volumes:
        - name: vector-store
          persistentVolumeClaim:
            claimName: prvcy-vector-pvc
```

```yaml
# privacy-service.yaml
apiVersion: v1
kind: Service
metadata:
  name: privacy-svc
  namespace: prvcy-{{ .Values.environment }}
spec:
  selector:
    app: privacy
  ports:
    - name: ui
      port: 80
      targetPort: 80
    - name: ollama
      port: 11434
      targetPort: 11434
  type: ClusterIP
```

### 3.6 Data‑Cleaning Pod

```yaml
# data-cleaning.yaml
apiVersion: batch/v1
kind: Job
metadata:
  name: data-cleaning
  namespace: prvcy-{{ .Values.environment }}
spec:
  template:
    spec:
      containers:
        - name: cleaner
          image: "{{ .Values.cleaner.image }}"
          envFrom:
            - secretRef:
                name: prvcy-db-creds
          command: ["python", "cleaner.py"]
          resources:
            requests:
              cpu: "2"
              memory: "4Gi"
            limits:
              cpu: "4"
              memory: "8Gi"
      restartPolicy: OnFailure
```

> Use `kubectl apply -f data-cleaning.yaml` to launch a one‑off cleaning job.

### 3.7 Cyber Audit Pod

```yaml
# cyber-audit.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: cyber-audit
  namespace: prvcy-{{ .Values.environment }}
spec:
  replicas: 1
  selector:
    matchLabels:
      app: cyber-audit
  template:
    metadata:
      labels:
        app: cyber-audit
    spec:
      containers:
        - name: auditor
          image: "{{ .Values.cyber.image }}"
          envFrom:
            - configMapRef:
                name: prvcy-config
          env:
            - name: AUDIT_MODE
              value: "full"
          resources:
            requests:
              cpu: "1"
              memory: "2Gi"
            limits:
              cpu: "2"
              memory: "4Gi"
          ports:
            - containerPort: 9000
      volumes:
        - name: logs
          persistentVolumeClaim:
            claimName: prvcy-logs-pvc
```

```yaml
# cyber-audit-service.yaml
apiVersion: v1
kind: Service
metadata:
  name: cyber-audit-svc
  namespace: prvcy-{{ .Values.environment }}
spec:
  selector:
    app: cyber-audit
  ports:
    - name: http
      port: 80
      targetPort: 9000
  type: ClusterIP
```

---

## 4. Ingress (Optional – expose a subset of packages externally)

```yaml
# ingress.yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: prvcy-ingress
  namespace: prvcy-{{ .Values.environment }}
  annotations:
    kubernetes.io/ingress.class: "nginx"
spec:
  tls:
    - hosts:
        - "{{ .Values.ingress.host }}"
      secretName: {{ .Values.ingress.tlsSecret }}
  rules:
    - host: "{{ .Values.ingress.host }}"
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
          - path: /byom
            pathType: Prefix
            backend:
              service:
                name: byom-svc
                port:
                  name: ui
          - path: /privacy
            pathType: Prefix
            backend:
              service:
                name: privacy-svc
                port:
                  name: ui
```

> **Note:**
> *Only the packages that are exposed to the Internet (UI/OLLAMA) need an Ingress.  The
others stay internal‑cluster.*

---

## 5. PersistentVolumeClaims (for all storage‑heavy pods)

```yaml
# pvc-<name>.yaml
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: {{ .Values.pvc.name }}   # e.g., prvcy-slim-pvc
  namespace: prvcy-{{ .Values.environment }}
spec:
  accessModes:
    - ReadWriteOnce
  resources:
    requests:
      storage: "{{ .Values.pvc.size }}"
```

> Use a separate PVC for:
> * slim & standard pods (`prvcy-slim-pvc`)
> * full‑suite & privacy pods (`prvcy-full-pvc`)
> * upload volumes (`prvcy-upload-pvc`)
> * vector store (`prvcy-vector-pvc`)
> * logs (`prvcy-logs-pvc`)

---

## 6. Quick “helm‑style” values file

```yaml
# values.yaml
environment: prod
db:
  host: "pg.prvcy.svc.cluster.local"
  name: "prvcy"
  port: "5432"
ingress:
  host: "prvcy.example.com"
  tlsSecret: "prvcy-tls"
image:
  registry: "ghcr.io"
  pullSecret: "ghcr-creds"
slim:
  image: "ghcr.io/prvcy/slim:latest"
  replicas: 1
  resources:
    requests:
      cpu: "0.5"
      memory: "512Mi"
    limits:
      cpu: "1"
      memory: "1Gi"
# … add similar sections for standard, full‑suite, etc.
```

---

### How to Use

1. **Create the namespace**
   ```bash
   kubectl apply -f namespace.yaml
   ```
2. **Deploy the ConfigMap & Secret**
   ```bash
   kubectl apply -f configmap.yaml
   kubectl apply -f secret.yaml
   ```
3. **Deploy a package**
   ```bash
   kubectl apply -f slim.yaml      # or standard.yaml, full-suite.yaml, etc.
   ```
4. **Expose with Ingress** (if needed)
   ```bash
   kubectl apply -f ingress.yaml
   ```

Feel free to copy‑paste each file into your own repo, replace `{{ … }}` with static values or
Helm values, and run `kubectl apply -f <file>.yaml`. Happy deploying!