import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { ElasticsearchService } from '@nestjs/elasticsearch';

@Injectable()
export class SearchService implements OnModuleInit {
  private isConnected = false;
  private readonly indexName = 'services';

  constructor(private readonly elasticsearchService: ElasticsearchService) {}

  async onModuleInit() {
    try {
      // Ping ES server to check if online
      await this.elasticsearchService.ping();
      this.isConnected = true;
      Logger.log('🔍 Elasticsearch is connected and online.', 'SearchService');

      // Check if index exists, create if not
      const exists = await this.elasticsearchService.indices.exists({
        index: this.indexName,
      });

      if (!exists) {
        // Correct v8 signature: settings and mappings are direct properties
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
        Logger.log(
          `🔍 Elasticsearch index "${this.indexName}" created.`,
          'SearchService',
        );
      }
    } catch (error) {
      this.isConnected = false;
      Logger.warn(
        '⚠️ Elasticsearch offline or configuration missing. Falling back to local Prisma fuzzy query.',
        'SearchService',
      );
    }
  }

  isElasticActive(): boolean {
    return this.isConnected;
  }

  async indexService(service: any) {
    if (!this.isConnected) return;
    try {
      // Correct v8 signature: document is direct property
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
    } catch (error) {
      Logger.error(
        '❌ Failed to index service in Elasticsearch:',
        error,
        'SearchService',
      );
    }
  }

  async removeService(serviceId: string) {
    if (!this.isConnected) return;
    try {
      await this.elasticsearchService.delete({
        index: this.indexName,
        id: serviceId,
      });
    } catch (error) {
      Logger.error(
        '❌ Failed to delete service from Elasticsearch:',
        error,
        'SearchService',
      );
    }
  }

  async searchServices(queryText: string) {
    if (!this.isConnected) {
      throw new Error('Elasticsearch is offline');
    }
    try {
      // Correct v8 signature: query is direct property
      const result = await this.elasticsearchService.search<any>({
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

      // In v8 client response object has direct hits field
      const hits = result.hits?.hits || [];
      return hits.map((hit: any) => hit._source);
    } catch (error) {
      Logger.error('❌ Elasticsearch search failed:', error, 'SearchService');
      throw error;
    }
  }
}
