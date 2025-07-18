import { Kafka, Consumer, EachMessagePayload, Admin } from 'kafkajs';

const kafka = new Kafka({
  clientId: 'service-agent-consumer',
  brokers: [process.env.KAFKA_BROKER || 'localhost:9092']
});

const consumer: Consumer = kafka.consumer({
  groupId: 'message-processors'
});

const admin: Admin = kafka.admin();

// Keep track of subscribed topics
let subscribedTopics: string[] = [];
let isConsumerRunning = false;

// Process message function
const processMessage = async ({ topic, partition, message }: EachMessagePayload) => {
  try {
    const headers: Record<string, string> = {};
    if (message.headers) {
      Object.keys(message.headers).forEach(key => {
        const headerValue = message.headers![key];
        headers[key] = headerValue ? headerValue.toString() : '';
      });
    }
    
    const messageValue = message.value?.toString() || '';
    
    // Skip empty messages or non-JSON content
    if (!messageValue || messageValue.length === 0) {
      return;
    }
    
    let body: any;
    try {
      body = JSON.parse(messageValue);
    } catch (jsonError) {
      // Skip non-JSON messages (likely system/internal topics)
      console.log(`Skipping non-JSON message from topic: ${topic}`);
      return;
    }
    
    // Extract tenant from topic name if namespaced
    const [tenantId, topicName] = topic.includes('.') ? topic.split('.', 2) : [null, topic];
    
    console.log('📨 Received Kafka message:', {
      tenantId,
      topicName,
      topic,
      partition,
      headers,
      body,
      timestamp: new Date().toISOString()
    });
    
    console.log('✅ Message processed successfully');
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error.';
    console.error('Error processing message:', errorMessage);
  }
};

// Initial subscription to topics
async function subscribeToInitialTopics(): Promise<void> {
  try {
    // Get all topics from Kafka
    const topics = await admin.listTopics();
    
    // Filter for tenant-namespaced topics (containing a dot)
    const namespacedTopics = topics.filter(topic => topic.includes('.'));
    
    if (namespacedTopics.length > 0) {
      console.log(`Found ${namespacedTopics.length} namespaced topics: ${namespacedTopics.join(', ')}`);
      
      // Subscribe to all namespaced topics
      await consumer.subscribe({ 
        topics: namespacedTopics,
        fromBeginning: process.env.KAFKA_FROM_BEGINNING === 'true'
      });
      
      subscribedTopics = namespacedTopics;
    } else {
      console.log('No namespaced topics found. Will check periodically for new topics.');
    }
  } catch (error) {
    console.error('Error subscribing to initial topics:', error);
  }
}

// Watch for new topics
async function watchForNewTopics(): Promise<void> {
  // Create a separate admin client for topic watching
  const watchAdmin = kafka.admin();
  await watchAdmin.connect();
  
  console.log('Starting topic watcher...');
  
  // Check for new topics every 30 seconds
  setInterval(async () => {
    try {
      // Get all topics from Kafka
      const topics = await watchAdmin.listTopics();
      
      // Filter for tenant-namespaced topics (containing a dot)
      const namespacedTopics = topics.filter(topic => topic.includes('.'));
      
      // Find new topics we haven't subscribed to yet
      const newTopics = namespacedTopics.filter(topic => !subscribedTopics.includes(topic));
      
      if (newTopics.length > 0) {
        console.log(`Discovered ${newTopics.length} new topics: ${newTopics.join(', ')}`);
        
        // Need to restart consumer to subscribe to new topics
        if (isConsumerRunning) {
          console.log('Stopping consumer to add new topic subscriptions...');
          await consumer.stop();
          isConsumerRunning = false;
        }
        
        // Add new topics to our tracking list
        subscribedTopics = [...subscribedTopics, ...newTopics];
        
        // Subscribe to all topics (including new ones)
        await consumer.subscribe({ 
          topics: subscribedTopics,
          fromBeginning: process.env.KAFKA_FROM_BEGINNING === 'true'
        });
        
        // Restart consumer
        if (!isConsumerRunning) {
          console.log('Restarting consumer with updated topic subscriptions...');
          await consumer.run({ eachMessage: processMessage });
          isConsumerRunning = true;
        }
      }
    } catch (error) {
      console.error('Error checking for new topics:', error);
    }
  }, 30000); // Check every 30 seconds
}

async function start(): Promise<void> {
  console.log('Consumer starting...');
  
  let retries = 10;
  while (retries > 0) {
    try {
      // Connect consumer and admin
      await Promise.all([
        consumer.connect(),
        admin.connect()
      ]);
      
      // Subscribe to initial topics
      await subscribeToInitialTopics();
      
      // Start the consumer
      await consumer.run({ eachMessage: processMessage });
      isConsumerRunning = true;
      
      console.log('Consumer connected and listening for messages...');
      
      // Start watching for new topics in the background
      watchForNewTopics().catch(error => {
        console.error('Error in topic watcher:', error);
      });
      
      break;
    } catch (error) {
      console.log(`Kafka connection failed, retrying... (${retries} attempts left)`);
      retries--;
      await new Promise(resolve => setTimeout(resolve, 10000));
    }
  }
  
  if (retries === 0) {
    console.error('Could not connect to Kafka after multiple attempts.');
  }
}

// Handle graceful shutdown
process.on('SIGTERM', async () => {
  console.log('Received SIGTERM. Shutting down gracefully...');
  await consumer.disconnect();
  await admin.disconnect();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('Received SIGINT. Shutting down gracefully...');
  await consumer.disconnect();
  await admin.disconnect();
  process.exit(0);
});

start();