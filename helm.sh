#!/bin/bash

# helm repo add apache-airflow https://airflow.apache.org
# helm repo update

helm upgrade --install airflow apache-airflow/airflow \
  --namespace airflow --create-namespace \
  -f values.yaml \
  --set executor=CeleryExecutor \
  --set dags.persistence.enabled=true \
  --set dags.persistence.size=2Gi \
  --set logs.persistence.enabled=true \
  --set logs.persistence.size=1Gi \
  --set scheduler.logCleanup.enabled=false \
  --set workers.logCleanup.enabled=false \
  --set postgresql.enabled=true \
  --set postgresql.image.registry=docker.io \
  --set postgresql.image.repository=postgres \
  --set postgresql.image.tag=15-alpine \
  --set workers.replicas=1 \
  --set ingress.enabled=true \
  --set ingress.className=nginx \
  --set ingress.web.hosts[0].host=airflow.local \
  --set ingress.web.hosts[0].paths[0].path="/" \
  --set ingress.web.hosts[0].paths[0].pathType=Prefix

