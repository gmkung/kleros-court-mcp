import { DisputeData, DisputeInput, EvidenceError, SupportedChainId, isSupportedChainId } from '../types/index.js';
import { MetaEvidenceService } from './metaEvidenceService.js';
import { SubgraphService } from './subgraphService.js';
import { IpfsService } from './ipfsService.js';
import { NETWORK_NAMES } from '../utils/constants.js';

export class DisputeService {
  private metaEvidenceService: MetaEvidenceService;
  private subgraphService: SubgraphService;
  private ipfsService: IpfsService;

  constructor() {
    this.metaEvidenceService = new MetaEvidenceService();
    this.subgraphService = new SubgraphService();
    this.ipfsService = new IpfsService();
  }

  async getDisputeData(input: DisputeInput): Promise<DisputeData> {
    const { disputeId, chainId } = input;

    // Validate input
    this.validateInput(disputeId, chainId);

    const supportedChainId = chainId as SupportedChainId;

    try {
      // 1. Get meta-evidence (can be null if not found)
      const metaEvidence = await this.metaEvidenceService.getMetaEvidence(disputeId, supportedChainId);

      // 2. Get evidence submissions from subgraph
      const evidenceSubmissions = await this.subgraphService.getEvidenceSubmissions(disputeId, supportedChainId);

      // 3. Fetch evidence content from IPFS (parallel requests with error handling)
      const evidenceResults = await Promise.allSettled(
        evidenceSubmissions.map(submission => 
          this.ipfsService.getEvidenceContent(submission.URI)
        )
      );

      // 4. Separate successful results from errors
      const evidenceContents = evidenceResults
        .filter((result): result is PromiseFulfilledResult<any> => result.status === 'fulfilled')
        .map(result => result.value);

      const evidenceErrors: EvidenceError[] = evidenceResults
        .map((result, index) => {
          if (result.status === 'rejected') {
            const errorMessage = result.reason instanceof Error 
              ? result.reason.message 
              : typeof result.reason === 'object' && result.reason?.message
                ? result.reason.message
                : String(result.reason);
            
            return {
              evidenceUri: evidenceSubmissions[index]?.URI || 'unknown',
              error: errorMessage
            };
          }
          return null;
        })
        .filter((error): error is EvidenceError => error !== null);

      return {
        disputeId,
        chainId: supportedChainId,
        metaEvidence,
        evidenceContents,
        evidenceErrors
      };
    } catch (error) {
      throw new Error(
        `Failed to retrieve dispute data for dispute ${disputeId} on ${NETWORK_NAMES[supportedChainId]}: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`
      );
    }
  }

  private validateInput(disputeId: string, chainId: number): void {
    if (!disputeId || typeof disputeId !== 'string' || disputeId.trim() === '') {
      throw new Error('Dispute ID must be a non-empty string');
    }

    if (!isSupportedChainId(chainId)) {
      throw new Error(`Unsupported chain ID: ${chainId}. Supported chains: ${Object.keys(NETWORK_NAMES).join(', ')}`);
    }
  }
}