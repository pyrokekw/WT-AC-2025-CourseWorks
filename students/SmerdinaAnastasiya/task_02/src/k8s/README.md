# Kubernetes manifests for MoodPlay

How to use (basic):

- Build and push your image to a registry, e.g. `docker build -t myregistry/moodplay:latest .` and `docker push myregistry/moodplay:latest`.
- Edit `k8s/deployment.yaml` and set `image: myregistry/moodplay:latest`.
- Apply manifests:

```bash
kubectl apply -f k8s/deployment.yaml
kubectl apply -f k8s/service.yaml
# optional if you have an ingress controller
kubectl apply -f k8s/ingress.yaml
```

Notes:

- This example uses sqlite for simplicity (DATABASE_URL=sqlite:///app.db). For production use an external database (Postgres) and store connection in a Secret.
- Adjust resources, replicas and probes as needed.
