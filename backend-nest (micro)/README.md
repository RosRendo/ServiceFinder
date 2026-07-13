#!/bin/bash
# ============================================================
# ServiceFinder Microservices — Quick Start Guide
# ============================================================
#
# PREREQUISITES:
#   - Docker Desktop running
#   - Node.js 20+ installed
#   - Copy .env.example to .env and fill in secrets
#
# ============================================================
# LOCAL DEVELOPMENT (Docker Compose)
# ============================================================

# 1. Start all services + databases
docker-compose up -d

# 2. Check all services are healthy
docker-compose ps

# 3. View logs for a specific service
docker-compose logs -f auth-service
docker-compose logs -f payment-service

# 4. Test health checks
curl http://localhost:3001/api/health/ping    # auth
curl http://localhost:3004/api/health/ping    # company
curl http://localhost:3003/api/health/ping    # booking
curl http://localhost:3002/api/health/ping    # payment
curl http://localhost:3006/api/health/ping    # review
curl http://localhost:3005/api/health/ping    # notification

# 5. Or test via Nginx API Gateway (port 80)
curl http://localhost/api/auth/health/ping
curl http://localhost/api/companies/health/ping

# 6. Swagger docs (direct service)
# http://localhost:3001/api/docs  → Auth
# http://localhost:3004/api/docs  → Company
# http://localhost:3003/api/docs  → Booking
# http://localhost:3002/api/docs  → Payment
# http://localhost:3006/api/docs  → Review

# 7. Stop all services
docker-compose down

# 8. Stop and remove ALL data (volumes)
docker-compose down -v

# ============================================================
# KUBERNETES (Production)
# ============================================================

# Install Minikube for local K8s testing
# https://minikube.sigs.k8s.io/docs/start/
minikube start

# Create namespaces
kubectl apply -f kubernetes/ingress.yaml   # creates namespaces + ingress

# Create secrets (run once)
kubectl create secret generic jwt-secret \
  --from-literal=secret=YOUR_JWT_SECRET \
  -n production

kubectl create secret generic smtp-secret \
  --from-literal=user=YOUR_SMTP_USER \
  --from-literal=pass=YOUR_SMTP_PASS \
  -n production

kubectl create secret generic auth-db-secret \
  --from-literal=connection-string=postgresql://... \
  -n production

# Deploy auth service
kubectl apply -f kubernetes/auth-service/deployment.yaml -n production

# Check status
kubectl get pods -n production
kubectl get services -n production
kubectl describe pod auth-service -n production

# Scale a service manually
kubectl scale deployment payment-service --replicas=6 -n production

# Roll out a new image version
kubectl set image deployment/auth-service \
  auth-service=YOUR_REGISTRY/auth-service:v2 \
  -n production

# Watch rollout progress
kubectl rollout status deployment/auth-service -n production

# Roll back if needed
kubectl rollout undo deployment/auth-service -n production

# View logs
kubectl logs -f deployment/auth-service -n production

# ============================================================
# DATABASE PORTS (direct access for dev tools like TablePlus)
# ============================================================
#
# auth-db:     localhost:5433
# company-db:  localhost:5434
# booking-db:  localhost:5435
# payment-db:  localhost:5436
# review-db:   localhost:5437
#
# User: sf_user | Password: sf_password
