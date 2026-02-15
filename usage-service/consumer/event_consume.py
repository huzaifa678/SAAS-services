import os
from confluent_kafka import DeserializingConsumer
from confluent_kafka.schema_registry import SchemaRegistryClient
from confluent_kafka.schema_registry.avro import AvroDeserializer
from decimal import Decimal
from dotenv import load_dotenv

load_dotenv()

schema_registry_conf = {'url': os.getenv("SCHEMA_REGISTRY_URL")}
schema_registry_client = SchemaRegistryClient(schema_registry_conf)

with open("avro/usage_event.avsc", "r") as f:
    avro_schema_str = f.read()

def decimal_deserializer(obj, ctx):
    if isinstance(obj, bytes):
        unscaled = int.from_bytes(obj, byteorder='big', signed=True)
        return Decimal(unscaled) / (10 ** 2)
    return obj

avro_deserializer = AvroDeserializer(
    avro_schema_str,
    schema_registry_client=schema_registry_client,
    from_dict=decimal_deserializer
)

consumer_conf = {
    "bootstrap.servers": os.getenv("KAFKA_BOOTSTRAP_SERVERS"),
    "key.deserializer": str,
    "value.deserializer": avro_deserializer,
    "group.id": "usage-service",
    "auto.offset.reset": "earliest"
}

consumer = DeserializingConsumer(consumer_conf)
consumer.subscribe(["billing.usage-charge.created"])

try:
    while True:
        msg = consumer.poll(1.0)
        if msg is None:
            continue
        if msg.error():
            print(f"Consumer error: {msg.error()}")
            continue

        value = msg.value()
        print(f"Received: {value}")

finally:
    consumer.close()
