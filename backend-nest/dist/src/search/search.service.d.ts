import { OnModuleInit } from '@nestjs/common';
import { ElasticsearchService } from '@nestjs/elasticsearch';
export declare class SearchService implements OnModuleInit {
    private readonly elasticsearchService;
    private isConnected;
    private readonly indexName;
    constructor(elasticsearchService: ElasticsearchService);
    onModuleInit(): Promise<void>;
    isElasticActive(): boolean;
    indexService(service: any): Promise<void>;
    removeService(serviceId: string): Promise<void>;
    searchServices(queryText: string): Promise<any[]>;
}
