import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import {
  HealthCheck,
  HealthCheckService,
  HttpHealthIndicator,
  MemoryHealthIndicator,
  DiskHealthIndicator,
} from '@nestjs/terminus';
import { PrismaHealthIndicator } from './prisma.health';

@ApiTags('Health')
@Controller('health')
export class HealthController {
  constructor(
    private health: HealthCheckService,
    private http: HttpHealthIndicator,
    private memory: MemoryHealthIndicator,
    private disk: DiskHealthIndicator,
    private prismaHealth: PrismaHealthIndicator,
  ) {}

  @Get()
  @HealthCheck()
  @ApiOperation({ summary: 'Full health check (DB, memory, disk)' })
  check() {
    return this.health.check([
      // Database connectivity
      () => this.prismaHealth.isHealthy('database'),

      // Memory: alert if RSS exceeds 512MB
      () => this.memory.checkRSS('memory_rss', 512 * 1024 * 1024),

      // Memory: alert if heap exceeds 256MB
      () => this.memory.checkHeap('memory_heap', 256 * 1024 * 1024),

      // Disk: alert if usage exceeds 90%
      () =>
        this.disk.checkStorage('disk', {
          thresholdPercent: 0.9,
          path: process.platform === 'win32' ? 'C:\\' : '/',
        }),
    ]);
  }

  @Get('ping')
  @ApiOperation({ summary: 'Simple ping check (no DB)' })
  ping() {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }
}
