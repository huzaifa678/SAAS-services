FROM apache/airflow:3.1.7

USER root

RUN apt-get update && \
    apt-get install -y gcc librdkafka-dev && \
    apt-get clean

USER airflow

COPY requirements.txt .

RUN pip install --no-cache-dir -r requirements.txt
