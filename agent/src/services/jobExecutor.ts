import axios, { AxiosResponse } from 'axios';
import { JobStatus } from '../helpers/types';
import { JobInstance } from '../db/init';

export async function executeHttpJob(job: JobInstance): Promise<AxiosResponse | undefined> {
  const response: AxiosResponse = await axios({
    method: job.method,
    url: job.url,
    headers: job.headers,
    data: job.body
  });

  await job.update({
    status: JobStatus.COMPLETED,
    response: response.data,
    responseHeaders: response.headers,
    completedAt: new Date()
  });
  
  return response;
}

export async function executeKafkaJob(job: JobInstance): Promise<any> {
  const { Kafka } = await import('kafkajs');
  
  const kafka = new Kafka({
    clientId: 'service-agent',
    brokers: [process.env.KAFKA_BROKER || 'localhost:9092']
  });
  
  const producer = kafka.producer();
  await producer.connect();
  
  const namespacedTopic = `${job.tenantId}.${job.topic!}`;
  
  await producer.send({
    topic: namespacedTopic,
    messages: [{
      value: JSON.stringify(job.body),
      headers: job.headers
    }]
  });
  
  await producer.disconnect();
  
  await job.update({
    status: JobStatus.COMPLETED,
    response: { message: 'Message sent to Kafka topic', topic: namespacedTopic },
    completedAt: new Date()
  });
}