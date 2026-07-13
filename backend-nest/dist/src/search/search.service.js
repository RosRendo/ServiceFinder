"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SearchService = void 0;
const common_1 = require("@nestjs/common");
const elasticsearch_1 = require("@nestjs/elasticsearch");
let SearchService = class SearchService {
    elasticsearchService;
    isConnected = false;
    indexName = 'services';
    constructor(elasticsearchService) {
        this.elasticsearchService = elasticsearchService;
    }
    async onModuleInit() {
        try {
            await this.elasticsearchService.ping();
            this.isConnected = true;
            common_1.Logger.log('🔍 Elasticsearch is connected and online.', 'SearchService');
            const exists = await this.elasticsearchService.indices.exists({
                index: this.indexName,
            });
            if (!exists) {
                await this.elasticsearchService.indices.create({
                    index: this.indexName,
                    settings: {
                        analysis: {
                            analyzer: {
                                autocomplete: {
                                    type: 'custom',
                                    tokenizer: 'autocomplete',
                                    filter: ['lowercase'],
                                },
                            },
                            tokenizer: {
                                autocomplete: {
                                    type: 'edge_ngram',
                                    min_gram: 2,
                                    max_gram: 20,
                                    token_chars: ['letter', 'digit'],
                                },
                            },
                        },
                    },
                    mappings: {
                        properties: {
                            id: { type: 'keyword' },
                            name: {
                                type: 'text',
                                analyzer: 'autocomplete',
                                search_analyzer: 'standard',
                            },
                            description: { type: 'text' },
                            companyId: { type: 'keyword' },
                            companyName: { type: 'text' },
                            basePrice: { type: 'float' },
                            isActive: { type: 'boolean' },
                        },
                    },
                });
                common_1.Logger.log(`🔍 Elasticsearch index "${this.indexName}" created.`, 'SearchService');
            }
        }
        catch (error) {
            this.isConnected = false;
            common_1.Logger.warn('⚠️ Elasticsearch offline or configuration missing. Falling back to local Prisma fuzzy query.', 'SearchService');
        }
    }
    isElasticActive() {
        return this.isConnected;
    }
    async indexService(service) {
        if (!this.isConnected)
            return;
        try {
            await this.elasticsearchService.index({
                index: this.indexName,
                id: service.id.toString(),
                document: {
                    id: service.id.toString(),
                    name: service.name,
                    description: service.description || '',
                    companyId: service.companyId?.toString() || '',
                    companyName: service.company?.name || '',
                    basePrice: Number(service.basePrice),
                    isActive: service.isActive,
                },
            });
        }
        catch (error) {
            common_1.Logger.error('❌ Failed to index service in Elasticsearch:', error, 'SearchService');
        }
    }
    async removeService(serviceId) {
        if (!this.isConnected)
            return;
        try {
            await this.elasticsearchService.delete({
                index: this.indexName,
                id: serviceId,
            });
        }
        catch (error) {
            common_1.Logger.error('❌ Failed to delete service from Elasticsearch:', error, 'SearchService');
        }
    }
    async searchServices(queryText) {
        if (!this.isConnected) {
            throw new Error('Elasticsearch is offline');
        }
        try {
            const result = await this.elasticsearchService.search({
                index: this.indexName,
                query: {
                    bool: {
                        must: [
                            {
                                multi_match: {
                                    query: queryText,
                                    fields: ['name^3', 'description', 'companyName'],
                                    fuzziness: 'AUTO',
                                },
                            },
                        ],
                        filter: [{ term: { isActive: true } }],
                    },
                },
            });
            const hits = result.hits?.hits || [];
            return hits.map((hit) => hit._source);
        }
        catch (error) {
            common_1.Logger.error('❌ Elasticsearch search failed:', error, 'SearchService');
            throw error;
        }
    }
};
exports.SearchService = SearchService;
exports.SearchService = SearchService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [elasticsearch_1.ElasticsearchService])
], SearchService);
//# sourceMappingURL=search.service.js.map