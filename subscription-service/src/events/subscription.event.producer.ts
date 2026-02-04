import 'dotenv/config';
import { Injectable, OnModuleInit } from '@nestjs/common';
import { Kafka, Producer } from 'kafkajs';
import { SchemaRegistry, SchemaType } from '@kafkajs/confluent-schema-registry';
import fs from 'fs';
import path from 'path';

@Injectable()
export class SubscriptionEventsProducer implements OnModuleInit {
  private kafkaProducer!: Producer;
  private registry!: SchemaRegistry;
  private schemaIds: Record<string, number> = {};

  async onModuleInit() {
    const kafka = new Kafka({
      brokers: [process.env.KAFKA_BROKER || 'localhost:9092'],
      clientId: process.env.KAFKA_CLIENT_ID || 'subscription-service',
    });
    this.kafkaProducer = kafka.producer();
    await this.kafkaProducer.connect();

    this.registry = new SchemaRegistry({
      host: process.env.SCHEMA_REGISTRY_URL || 'http://localhost:9094',
    });

    await this.registerSchema('subscription.created', '../schemas/subscription-created.avsc');
    await this.registerSchema('subscription.updated', '../schemas/subscription-updated.avsc');
  }

  private async registerSchema(topic: string, filePath: string) {
    const schemaContent = fs.readFileSync(path.join(__dirname, filePath), 'utf-8');
    const { id } = await this.registry.register({
      type: SchemaType.AVRO,
      schema: schemaContent,
    });
    this.schemaIds[topic] = id;
  }

  async publishEvent(topic: 'subscription.created' | 'subscription.updated', event: any) {
    const schemaId = this.schemaIds[topic];
    if (!schemaId) throw new Error(`Schema not registered for topic ${topic}`);

    const encoded = await this.registry.encode(schemaId, event);
    await this.kafkaProducer.send({
      topic,
      messages: [{ key: event.subscriptionId, value: encoded }],
    });
  }
}

