import axios from 'axios';
import { EvidenceSubmission, SupportedChainId, SubgraphResponse, ApiError } from '../types/index.js';
import { API_ENDPOINTS, REQUEST_TIMEOUTS, DEFAULT_HEADERS, EVIDENCE_QUERY } from '../utils/constants.js';

export class SubgraphService {
  async getEvidenceSubmissions(disputeId: string, chainId: SupportedChainId): Promise<EvidenceSubmission[]> {
    const subgraphUrl = API_ENDPOINTS.SUBGRAPHS[chainId];
    
    if (!subgraphUrl) {
      throw new Error(`No subgraph URL configured for chain ID ${chainId}`);
    }

    try {
      const response = await axios.post<SubgraphResponse>(
        subgraphUrl,
        {
          query: EVIDENCE_QUERY,
          variables: { id: disputeId }
        },
        {
          timeout: REQUEST_TIMEOUTS.SUBGRAPH,
          headers: DEFAULT_HEADERS
        }
      );

      if (response.data.errors && response.data.errors.length > 0) {
        const errorMessages = response.data.errors.map(err => err.message).join(', ');
        throw new Error(`Subgraph query errors: ${errorMessages}`);
      }

      if (!response.data.data || !response.data.data.dispute?.evidenceGroup?.evidence) {
        return [];
      }

      return response.data.data.dispute.evidenceGroup.evidence;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const apiError: ApiError = {
          message: `Failed to query subgraph: ${error.message}`,
          code: error.code || 'SUBGRAPH_ERROR',
          details: {
            status: error.response?.status,
            statusText: error.response?.statusText,
            disputeId,
            chainId,
            subgraphUrl
          }
        };
        throw apiError;
      }
      
      throw new Error(`Unexpected error querying subgraph: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}