import { HealthService } from '../../src/services/health.service';
import axios from 'axios';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('HealthService', () => {
  let healthService: HealthService;

  beforeEach(() => {
    healthService = new HealthService();
    jest.clearAllMocks();
  });

  describe('checkService', () => {
    it('should return healthy status when service responds with 200', async () => {
      mockedAxios.get.mockResolvedValue({
        status: 200,
        data: { status: 'healthy' }
      });

      const config = {
        name: 'test-service',
        url: 'http://localhost:3001',
        healthEndpoint: '/health',
        timeout: 5000
      };

      const result = await healthService.checkService(config);

      expect(result.status).toBe('healthy');
      expect(result.responseTime).toBeGreaterThanOrEqual(0);
      expect(result.lastChecked).toBeDefined();
    });

    it('should return unhealthy status when service responds with non-200', async () => {
      mockedAxios.get.mockResolvedValue({
        status: 503,
        data: { error: 'Service unavailable' }
      });

      const config = {
        name: 'test-service',
        url: 'http://localhost:3001',
        healthEndpoint: '/health',
        timeout: 5000
      };

      const result = await healthService.checkService(config);

      expect(result.status).toBe('unhealthy');
    });

    it('should return unhealthy status when service throws error', async () => {
      mockedAxios.get.mockRejectedValue(new Error('Connection refused'));

      const config = {
        name: 'test-service',
        url: 'http://localhost:3001',
        healthEndpoint: '/health',
        timeout: 5000
      };

      const result = await healthService.checkService(config);

      expect(result.status).toBe('unhealthy');
      expect(result.details).toHaveProperty('error');
    });
  });

  describe('checkAll', () => {
    it('should return healthy status when all services are healthy', async () => {
      mockedAxios.get.mockResolvedValue({
        status: 200,
        data: { status: 'healthy' }
      });

      const result = await healthService.checkAll();

      expect(result.status).toBe('healthy');
      expect(result.services).toBeDefined();
      expect(Object.keys(result.services).length).toBeGreaterThan(0);
    });

    it('should return degraded status when some services are unhealthy', async () => {
      mockedAxios.get
        .mockResolvedValueOnce({ status: 200, data: { status: 'healthy' } })
        .mockRejectedValueOnce(new Error('Connection refused'));

      const result = await healthService.checkAll();

      expect(result.status).toBe('degraded');
    });

    it('should return unhealthy status when all services are unhealthy', async () => {
      mockedAxios.get.mockRejectedValue(new Error('Connection refused'));

      const result = await healthService.checkAll();

      expect(result.status).toBe('unhealthy');
    });

    it('should include service version and uptime', async () => {
      mockedAxios.get.mockResolvedValue({
        status: 200,
        data: { status: 'healthy' }
      });

      const result = await healthService.checkAll();

      expect(result.version).toBeDefined();
      expect(result.uptime).toBeGreaterThanOrEqual(0);
      expect(result.timestamp).toBeDefined();
    });
  });

  describe('getServiceConfigs', () => {
    it('should return configured services', () => {
      const configs = healthService.getServiceConfigs();

      expect(Array.isArray(configs)).toBe(true);
      expect(configs.length).toBe(2);
      
      configs.forEach(config => {
        expect(config).toHaveProperty('name');
        expect(config).toHaveProperty('url');
        expect(config).toHaveProperty('healthEndpoint');
        expect(config).toHaveProperty('timeout');
      });
    });
  });
});
