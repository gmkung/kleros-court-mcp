import axios from 'axios';
import { MetaEvidence, SupportedChainId, ApiError } from '../types/index.js';
import { API_ENDPOINTS, REQUEST_TIMEOUTS, DEFAULT_HEADERS } from '../utils/constants.js';

export class MetaEvidenceService {
  async getMetaEvidence(disputeId: string, chainId: SupportedChainId): Promise<MetaEvidence | null> {
    try {
      const response = await axios.get(API_ENDPOINTS.META_EVIDENCE, {
        params: { disputeId, chainId },
        timeout: REQUEST_TIMEOUTS.META_EVIDENCE,
        headers: DEFAULT_HEADERS
      });

      if (!response.data) {
        return null;
      }

      return response.data as MetaEvidence;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 404) {
          // Meta-evidence not found is not an error, just return null
          return null;
        }
        
        const apiError: ApiError = {
          message: `Failed to retrieve meta-evidence: ${error.message}`,
          code: error.code || 'META_EVIDENCE_ERROR',
          details: {
            status: error.response?.status,
            statusText: error.response?.statusText,
            disputeId,
            chainId
          }
        };
        throw apiError;
      }
      
      throw new Error(`Unexpected error retrieving meta-evidence: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}