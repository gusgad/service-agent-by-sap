import { Sequelize, DataTypes, Model, Optional } from 'sequelize';
import { JobStatus, JobType, ServiceType, JobData } from '../helpers/types';

const sequelize = new Sequelize({
  dialect: 'postgres',
  host: process.env.DB_HOST || 'postgres',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'jobs',
  username: process.env.DB_USER || 'admin',
  password: process.env.DB_PASS || 'admin',
  logging: false
});

interface JobCreationAttributes extends Optional<JobData, 'id' | 'createdAt' | 'completedAt' | 'response' | 'responseHeaders' | 'status' | 'errorMessage'> {}

interface JobInstance extends Model<JobData, JobCreationAttributes>, JobData {
  id: string;
  created_at: Date;
}

const Job = sequelize.define<JobInstance>('Job', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  tenantId: {
    type: DataTypes.STRING(255),
    allowNull: false,
    field: 'tenant_id'
  },
  name: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  serviceType: {
    type: DataTypes.ENUM(...Object.values(ServiceType)),
    allowNull: false,
    field: 'service_type'
  },
  url: {
    type: DataTypes.STRING(500),
    allowNull: true
  },
  method: {
    type: DataTypes.STRING(10),
    allowNull: true
  },
  topic: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  headers: {
    type: DataTypes.JSONB,
    defaultValue: {}
  },
  body: {
    type: DataTypes.JSONB,
    defaultValue: {}
  },
  jobType: {
    type: DataTypes.ENUM(...Object.values(JobType)),
    allowNull: false,
    field: 'job_type'
  },
  status: {
    type: DataTypes.ENUM(...Object.values(JobStatus)),
    defaultValue: JobStatus.PENDING,
    allowNull: true
  },
  scheduledAt: {
    type: DataTypes.DATE,
    field: 'scheduled_at'
  },
  completedAt: {
    type: DataTypes.DATE,
    field: 'completed_at'
  },
  response: {
    type: DataTypes.JSONB
  },
  errorMessage: {
    type: DataTypes.TEXT,
    field: 'error_message'
  }
}, {
  tableName: 'jobs',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false
});

async function initDB(): Promise<void> {
  await sequelize.sync();
}

async function seedDB(): Promise<void> {
  const count = await Job.count();
  
  if (count === 0) {
    const now = Date.now();
    const completedJobCreated = new Date(now - 3600000);
    const failedJobCreated = new Date(now - 1800000);
    const postJobCreated = new Date(now - 7200000);
    const weatherJobCreated = new Date(now - 10800000);
    
    await Job.bulkCreate([
      {
        tenantId: 'default',
        name: 'Weather API Request',
        serviceType: ServiceType.HTTP,
        url: 'https://api.weather.example/v1/current',
        method: 'GET',
        headers: {
          'Authorization': 'Bearer weather-api-token-123',
          'Accept': 'application/json',
          'User-Agent': 'ServiceAgent/1.0'
        },
        body: {},
        jobType: JobType.IMMEDIATE,
        status: JobStatus.COMPLETED,
        createdAt: weatherJobCreated,
        completedAt: new Date(weatherJobCreated.getTime() + 1200),
        responseHeaders: {
          'content-type': 'application/json; charset=utf-8',
          'cache-control': 'public, max-age=300',
          'x-ratelimit-limit': '100',
          'x-ratelimit-remaining': '99',
          'x-request-id': '8a7bcd45-e23f-4c2d-9853-abc123def456'
        },
        response: {
          location: {
            city: 'Berlin',
            country: 'Germany',
            lat: 52.52,
            lon: 13.41
          },
          current: {
            temp_c: 22.5,
            temp_f: 72.5,
            condition: {
              text: 'Partly cloudy',
              icon: 'partly-cloudy.png'
            },
            wind_kph: 15.1,
            humidity: 65,
            feelslike_c: 21.8
          },
          forecast: {
            daily: [
              { day: 'Today', max_temp: 23, min_temp: 18, condition: 'Partly cloudy' },
              { day: 'Tomorrow', max_temp: 25, min_temp: 17, condition: 'Sunny' }
            ]
          },
          updated_at: new Date(weatherJobCreated.getTime() + 1000).toISOString()
        }
      },
      {
        tenantId: 'default',
        name: 'Create User Profile',
        serviceType: ServiceType.HTTP,
        url: 'https://api.users.example/v2/profiles',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer user-api-token-456',
          'X-Correlation-ID': '123e4567-e89b-12d3-a456-426614174000'
        },
        body: {
          username: 'johndoe',
          email: 'john.doe@example.com',
          firstName: 'John',
          lastName: 'Doe',
          preferences: {
            language: 'en',
            theme: 'light',
            notifications: true
          }
        },
        jobType: JobType.IMMEDIATE,
        status: JobStatus.COMPLETED,
        createdAt: postJobCreated,
        completedAt: new Date(postJobCreated.getTime() + 1500),
        responseHeaders: {
          'content-type': 'application/json; charset=utf-8',
          'location': 'https://api.users.example/v2/profiles/12345',
          'etag': '"33a64df551425fcc55e4d42a148795d9f25f89d4"',
          'x-request-id': '5a1b2c3d-4e5f-6a7b-8c9d-0e1f2a3b4c5d'
        },
        response: {
          id: '12345',
          username: 'johndoe',
          email: 'john.doe@example.com',
          firstName: 'John',
          lastName: 'Doe',
          profileUrl: 'https://api.users.example/v2/profiles/12345',
          created: new Date(postJobCreated.getTime() + 1000).toISOString(),
          status: 'active',
          preferences: {
            language: 'en',
            theme: 'light',
            notifications: true
          }
        }
      },
      {
        tenantId: 'default',
        name: 'Product Inventory Update',
        serviceType: ServiceType.HTTP,
        url: 'https://api.inventory.example/products/54321',
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer inventory-api-token-789',
          'If-Match': '"abc123def456"'
        },
        body: {
          stock: 150,
          price: 49.99,
          lastUpdated: new Date(completedJobCreated.getTime() - 86400000).toISOString()
        },
        jobType: JobType.IMMEDIATE,
        status: JobStatus.COMPLETED,
        createdAt: completedJobCreated,
        completedAt: new Date(completedJobCreated.getTime() + 2000),
        responseHeaders: {
          'content-type': 'application/json; charset=utf-8',
          'etag': '"789ghi101112"',
          'cache-control': 'no-cache',
          'x-request-id': 'f1e2d3c4-b5a6-9876-5432-1fedcba09876'
        },
        response: {
          id: '54321',
          name: 'Premium Wireless Headphones',
          sku: 'HDPH-PREMIUM-BLK',
          stock: 150,
          price: 49.99,
          currency: 'USD',
          category: 'Electronics',
          lastUpdated: new Date(completedJobCreated.getTime()).toISOString(),
          warehouse: 'CENTRAL-1',
          status: 'in_stock'
        }
      },
      {
        tenantId: 'default',
        name: 'Payment Processing',
        serviceType: ServiceType.HTTP,
        url: 'https://api.payments.example/v3/transactions',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer payments-api-token-101112',
          'Idempotency-Key': '2023-11-15-transaction-98765'
        },
        body: {
          amount: 129.99,
          currency: 'EUR',
          paymentMethod: 'credit_card',
          cardToken: 'tok_visa_4242',
          description: 'Order #98765',
          customer: {
            id: 'cust_12345',
            email: 'customer@example.com'
          }
        },
        jobType: JobType.IMMEDIATE,
        status: JobStatus.FAILED,
        createdAt: failedJobCreated,
        completedAt: new Date(failedJobCreated.getTime() + 3000),
        responseHeaders: {
          'content-type': 'application/json; charset=utf-8',
          'x-request-id': '1a2b3c4d-5e6f-7a8b-9c0d-1e2f3a4b5c6d'
        },
        response: {
          error: {
            code: 'card_declined',
            message: 'The card was declined',
            decline_code: 'insufficient_funds',
            param: 'cardToken'
          },
          transaction_id: 'txn_declined_98765',
          status: 'failed'
        },
        errorMessage: 'Payment processing failed: The card was declined (insufficient_funds)'
      },
      {
        tenantId: 'default',
        name: 'Messaging Notification',
        serviceType: ServiceType.MESSAGING,
        topic: 'user-notifications',
        headers: { 
          'source': 'notification-service',
          'message-type': 'user-alert',
          'priority': 'high'
        },
        body: { 
          userId: 'user-12345',
          type: 'account_update',
          message: 'Your account settings have been updated',
          timestamp: new Date(failedJobCreated.getTime() - 1000).toISOString(),
          metadata: {
            category: 'security',
            requiresAction: false,
            expiresAt: new Date(now + 86400000).toISOString()
          }
        },
        jobType: JobType.IMMEDIATE,
        status: JobStatus.COMPLETED,
        createdAt: failedJobCreated,
        completedAt: new Date(failedJobCreated.getTime() + 500),
        response: { 
          messageId: 'msg-67890',
          topic: 'user-notifications',
          partition: 0,
          offset: 42,
          timestamp: new Date(failedJobCreated.getTime() + 300).toISOString()
        }
      },
      {
        tenantId: 'default',
        name: 'Daily System Health Check',
        serviceType: ServiceType.HTTP,
        url: 'https://api.monitoring.example/v1/health',
        method: 'GET',
        headers: {
          'Authorization': 'Bearer monitoring-token-xyz',
          'Accept': 'application/json'
        },
        body: {},
        jobType: JobType.SCHEDULED,
        status: JobStatus.PENDING,
        scheduledAt: new Date(now + 3600000)
      }
    ]);
    
    console.log('Database seeded with realistic test data');
  }
}

export { initDB, seedDB, sequelize, Job };
export type { JobInstance };