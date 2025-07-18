import nock from 'nock';

/**
 * Sets up HTTP mocks for offline operation
 * This allows the application to function without actual internet connectivity
 */
export function setupHttpMocks(): void {
  console.log('Setting up mock HTTP responses for offline operation');
  
  const commonHeaders = {
    'content-type': 'application/json',
    'access-control-allow-origin': '*',
    'x-powered-by': 'Service-Agent-Mock',
    'x-request-id': () => `mock-${Math.random().toString(36).substring(2, 15)}`,
    'cache-control': 'no-cache',
    'x-response-time': '15ms'
  };
  
  const generateMockData = (uri: string) => {
    // Extract the last part of the path to use as a resource identifier
    const pathParts = uri.split('/');
    const resourceId = pathParts[pathParts.length - 1];
    
    return {
      id: resourceId || `mock-${Math.floor(Math.random() * 1000)}`,
      name: `Mock Resource ${resourceId || 'Default'}`,
      status: 'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      properties: {
        environment: 'mock',
        version: '1.0.0',
        region: 'mock-region'
      },
      tags: ['mock', 'offline', 'test']
    };
  };
  
  nock(/.*/) 
    .persist()
    .get(/.*/) 
    .reply(function(uri) {
      return [
        200, 
        {
          success: true,
          message: `Mocked GET response for ${uri}`,
          timestamp: new Date().toISOString(),
          data: generateMockData(uri)
        },
        commonHeaders
      ];
    });

  nock(/.*/) 
    .persist()
    .post(/.*/) 
    .reply(function(uri, requestBody) {
      return [
        201, 
        {
          success: true,
          message: `Mocked POST response for ${uri}`,
          timestamp: new Date().toISOString(),
          receivedData: requestBody,
          data: {
            ...generateMockData(uri),
            ...((typeof requestBody === 'object') ? requestBody : {})
          }
        },
        { ...commonHeaders, 'location': `${uri}/mock-created-resource` }
      ];
    });

  nock(/.*/) 
    .persist()
    .put(/.*/) 
    .reply(function(uri, requestBody) {
      return [
        200, 
        {
          success: true,
          message: `Mocked PUT response for ${uri}`,
          timestamp: new Date().toISOString(),
          receivedData: requestBody,
          data: {
            ...generateMockData(uri),
            ...((typeof requestBody === 'object') ? requestBody : {}),
            updatedAt: new Date().toISOString()
          }
        },
        commonHeaders
      ];
    });

  nock(/.*/) 
    .persist()
    .delete(/.*/) 
    .reply(function(uri) {
      return [
        200, 
        {
          success: true,
          message: `Mocked DELETE response for ${uri}`,
          timestamp: new Date().toISOString(),
          data: { deleted: true, resourceId: uri.split('/').pop() }
        },
        commonHeaders
      ];
    });
}