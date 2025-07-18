import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { Kafka } from 'kafkajs';
import { setupHttpMocks } from './mocks/httpMock';
import { initDB, seedDB } from './db/init';
import { extractTenant } from './middleware/tenantMiddleware';
import { errorHandler } from './middleware/errorMiddleware';
import { apiLimiter } from './middleware/rateLimitMiddleware';
import apiRoutes from './routes';
import { startScheduler } from './services/scheduler';

const app = express();

// Security middleware
app.use(helmet());

// Configure CORS 
app.use(cors());

// Body parsing middleware
app.use(express.json({ limit: '1mb' }));

// Apply rate limiting to all requests
app.use(apiLimiter);

// Application middleware
app.use(extractTenant);
app.use('/api', apiRoutes);

// Error handling middleware (must be after routes)
app.use(errorHandler);

const PORT: number = parseInt(process.env.PORT || '3000');
const USE_MOCK: boolean = process.env.USE_MOCK === 'true';

// Setup HTTP mocks for offline operation if enabled
if (USE_MOCK) {
  setupHttpMocks();
}

// Kafka setup
const kafka = new Kafka({
  clientId: 'service-agent',
  brokers: [process.env.KAFKA_BROKER || 'localhost:9092']
});
const producer = kafka.producer();

// Initialize Kafka topics
async function initKafka(): Promise<void> {
  const admin = kafka.admin();
  await admin.connect();

  const topics = await admin.listTopics();
  if (!topics.includes('scheduled-jobs')) {
    await admin.createTopics({
      topics: [{
        topic: 'scheduled-jobs',
        numPartitions: 1,
        replicationFactor: 1
      }]
    });
    console.log('Created scheduled-jobs topic');
  }

  await admin.disconnect();
}

async function start(): Promise<void> {
  app.listen(PORT, () => {
    console.log(`Agent API server running on port ${PORT}`);
    console.log(`Mock mode: ${USE_MOCK}`);
  });
  
  await initDB().then(() => console.log('Database initialized.'));
  await seedDB();
  
  let retries = 10;
  while (retries > 0) {
    try {
      await initKafka();
      await producer.connect();
      console.log('Kafka producer connected.');
      startScheduler();
      break;
    } catch (error) {
      console.log(`Kafka connection failed, retrying... (${retries} attempts left)`);
      retries--;
      await new Promise(resolve => setTimeout(resolve, 10000));
    }
  }
  
  if (retries === 0) {
    console.warn('Could not connect to Kafka, continuing without scheduler');
  }
}

start();