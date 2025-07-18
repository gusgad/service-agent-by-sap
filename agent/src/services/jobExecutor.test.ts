import { executeHttpJob, executeKafkaJob } from './jobExecutor';
import { JobStatus } from '../helpers/types';

jest.mock('axios', () => ({
  __esModule: true,
  default: jest.fn()
}));

const mockProducer = {
  connect: jest.fn(),
  send: jest.fn(),
  disconnect: jest.fn()
};

const mockKafka = {
  producer: jest.fn(() => mockProducer)
};

jest.mock('kafkajs', () => ({
  Kafka: jest.fn(() => mockKafka)
}));

import axios from 'axios';
const mockAxios = axios as jest.MockedFunction<typeof axios>;

describe('jobExecutor', () => {
  let mockJob: any;

  beforeEach(() => {
    mockJob = {
      tenantId: 'test-tenant',
      method: 'GET',
      url: 'https://api.test.com',
      headers: { 'Content-Type': 'application/json' },
      body: { test: 'data' },
      topic: 'test-topic',
      update: jest.fn()
    };
    jest.clearAllMocks();
  });

  describe('executeHttpJob', () => {
    it('should execute HTTP job successfully', async () => {
      const mockResponse = {
        data: { success: true, message: 'OK' }
      };
      mockAxios.mockResolvedValue(mockResponse);

      await executeHttpJob(mockJob);

      expect(mockAxios).toHaveBeenCalledWith({
        method: 'GET',
        url: 'https://api.test.com',
        headers: { 'Content-Type': 'application/json' },
        data: { test: 'data' }
      });

      expect(mockJob.update).toHaveBeenCalledWith({
        status: JobStatus.COMPLETED,
        response: { success: true, message: 'OK' },
        completedAt: expect.any(Date)
      });
    });
  });

  describe('executeKafkaJob', () => {
    it('should execute Kafka job with namespaced topic', async () => {
      await executeKafkaJob(mockJob);

      expect(mockProducer.connect).toHaveBeenCalled();
      expect(mockProducer.send).toHaveBeenCalledWith({
        topic: 'test-tenant.test-topic',
        messages: [{
          value: JSON.stringify({ test: 'data' }),
          headers: { 'Content-Type': 'application/json' }
        }]
      });
      expect(mockProducer.disconnect).toHaveBeenCalled();

      expect(mockJob.update).toHaveBeenCalledWith({
        status: JobStatus.COMPLETED,
        response: { 
          message: 'Message sent to Kafka topic', 
          topic: 'test-tenant.test-topic' 
        },
        completedAt: expect.any(Date)
      });
    });

    it('should handle different tenant namespacing', async () => {
      mockJob.tenantId = 'acme-corp';
      mockJob.topic = 'notifications';

      await executeKafkaJob(mockJob);

      expect(mockProducer.send).toHaveBeenCalledWith({
        topic: 'acme-corp.notifications',
        messages: [{
          value: JSON.stringify({ test: 'data' }),
          headers: { 'Content-Type': 'application/json' }
        }]
      });

      expect(mockJob.update).toHaveBeenCalledWith({
        status: JobStatus.COMPLETED,
        response: { 
          message: 'Message sent to Kafka topic', 
          topic: 'acme-corp.notifications' 
        },
        completedAt: expect.any(Date)
      });
    });
  });
});