import 'dotenv/config';
import { Injectable, OnModuleInit } from '@nestjs/common';
import { Kafka, Producer } from 'kafkajs';
import { SchemaRegistry, SchemaType } from '@kafkajs/confluent-schema-registry';
import * as fs from 'fs';
import * as path from 'path';


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
    const schemaPath = path.resolve(
      __dirname,
      '../schemas',
      path.basename(filePath)
    );

    const schemaContent = fs.readFileSync(schemaPath, 'utf-8');

    const subject = `${topic}-value`;

    try {
      const { id } = await this.registry.register(
        {
          type: SchemaType.AVRO,
          schema: schemaContent,
        },
        { subject }
      );

      this.schemaIds[topic] = id;
      return;
    } catch (e: any) {
      if (e?.status === 400) {
        const { id } = await this.registry.register(
          {
            type: SchemaType.AVRO,
            schema: schemaContent,
          },
          { subject }
        );

        this.schemaIds[topic] = id;
        return;
      }
      throw e;
    } 
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

