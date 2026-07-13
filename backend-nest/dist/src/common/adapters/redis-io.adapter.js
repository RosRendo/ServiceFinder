"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RedisIoAdapter = void 0;
const platform_socket_io_1 = require("@nestjs/platform-socket.io");
const redis_adapter_1 = require("@socket.io/redis-adapter");
const redis_1 = require("redis");
class RedisIoAdapter extends platform_socket_io_1.IoAdapter {
    adapterConstructor;
    async connectToRedis() {
        const redisHost = process.env.REDIS_HOST || 'localhost';
        const redisPort = Number(process.env.REDIS_PORT) || 6379;
        const redisPassword = process.env.REDIS_PASSWORD;
        const connectionString = redisPassword
            ? `redis://:${redisPassword}@${redisHost}:${redisPort}`
            : `redis://${redisHost}:${redisPort}`;
        const pubClient = (0, redis_1.createClient)({ url: connectionString });
        const subClient = pubClient.duplicate();
        await Promise.all([pubClient.connect(), subClient.connect()]);
        this.adapterConstructor = (0, redis_adapter_1.createAdapter)(pubClient, subClient);
    }
    createIOServer(port, options) {
        const server = super.createIOServer(port, options);
        server.adapter(this.adapterConstructor);
        return server;
    }
}
exports.RedisIoAdapter = RedisIoAdapter;
//# sourceMappingURL=redis-io.adapter.js.map