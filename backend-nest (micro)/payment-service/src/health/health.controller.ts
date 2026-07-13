// @ts-nocheck
import { Controller, Get } from "@nestjs/common";
import { ApiTags, ApiOperation } from "@nestjs/swagger";
import {
  HealthCheck,
  HealthCheckService,
  MemoryHealthIndicator,
} from "@nestjs/terminus";

@ApiTags("Health")
@Controller("health")
export class HealthController {
  constructor(
    private health: HealthCheckService,
    private memory: MemoryHealthIndicator
  ) {}

  @Get()
  @HealthCheck()
  @ApiOperation({ summary: "Full health check" })
  check() {
    return this.health.check([
      () => this.memory.checkRSS("memory_rss", 512 * 1024 * 1024),
      () => this.memory.checkHeap("memory_heap", 256 * 1024 * 1024),
    ]);
  }

  @Get("ping")
  @ApiOperation({ summary: "Lightweight ping" })
  ping() {
    return { status: "ok", timestamp: new Date().toISOString() };
  }
}

