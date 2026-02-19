#!/bin/bash

# helm repo add apache-airflow https://airflow.apache.org
# helm repo update

helm upgrade --install airflow airflow-helm/airflow \
  --namespace airflow --create-namespace \
  --set executor=CeleryExecutor \
  --set dags.persistence.enabled=true \
  --set dags.persistence.size=2Gi \
  --set logs.persistence.enabled=true \
  --set logs.persistence.size=1Gi \
  --set scheduler.logCleanup.enabled=false \
  --set workers.logCleanup.enabled=false \
  --set workers.replicas=1 \
  --set ingress.enabled=true \
  --set ingress.className=nginx \
  --set ingress.web.hosts[0].host=airflow.local \
  --set ingress.web.hosts[0].paths[0].path="/" \
  --set ingress.web.hosts[0].paths[0].pathType=Prefix \
  -f values.yaml

