export interface DisputeInput {
  disputeId: string;
  chainId: number;
}

export interface MetaEvidence {
  title?: string;
  description?: string;
  question?: string;
  rulingOptions?: {
    type: string;
    titles: string[];
    descriptions: string[];
  };
  category?: string;
  lang?: string;
  version?: string;
}

export interface EvidenceSubmission {
  URI: string;
  sender: string;
  creationTime: string;
}

export interface EvidenceContent {
  title?: string;
  description?: string;
  fileURI?: string;
  fileTypeExtension?: string;
  type?: string;
}

export interface EvidenceError {
  evidenceUri: string;
  error: string;
}

export interface DisputeData {
  disputeId: string;
  chainId: number;
  metaEvidence: MetaEvidence | null;
  evidenceContents: EvidenceContent[];
  evidenceErrors: EvidenceError[];
}

export interface SubgraphResponse {
  data: {
    dispute?: {
      evidenceGroup?: {
        evidence: EvidenceSubmission[];
      };
    };
  };
  errors?: Array<{
    message: string;
    locations?: Array<{ line: number; column: number }>;
    path?: string[];
  }>;
}

export interface ApiError {
  message: string;
  code?: string;
  details?: any;
}

export const SUPPORTED_CHAIN_IDS = [1, 100] as const;
export type SupportedChainId = typeof SUPPORTED_CHAIN_IDS[number];

export function isSupportedChainId(chainId: number): chainId is SupportedChainId {
  return SUPPORTED_CHAIN_IDS.includes(chainId as SupportedChainId);
}