import { SupportedChainId } from '../types/index.js';

export const API_ENDPOINTS = {
  META_EVIDENCE: 'https://kleros-api.netlify.app/.netlify/functions/get-dispute-metaevidence',
  IPFS_GATEWAY: 'https://cdn.kleros.link',
  SUBGRAPHS: {
    1: 'https://gateway.thegraph.com/api/d1d19cef4bc7647cc6cfad4ad2662628/subgraphs/id/BqbBhB4R5pNAtdYya2kcojMrQMp8nVHioUnP22qN8JoN', // Ethereum
    100: 'https://gateway.thegraph.com/api/d1d19cef4bc7647cc6cfad4ad2662628/subgraphs/id/FxhLntVBELrZ4t1c2HNNvLWEYfBjpB8iKZiEymuFSPSr', // Gnosis
  } as Record<SupportedChainId, string>
} as const;

export const NETWORK_NAMES = {
  1: 'Ethereum Mainnet',
  100: 'Gnosis Chain'
} as const;

export const REQUEST_TIMEOUTS = {
  META_EVIDENCE: 15000, // 15 seconds
  SUBGRAPH: 10000,      // 10 seconds
  IPFS: 10000,          // 10 seconds
} as const;

export const EVIDENCE_QUERY = `
  query getDispute($id: String!) {
    dispute(id: $id) {
      evidenceGroup {
        evidence {
          URI
          sender
          creationTime
        }
      }
    }
  }
`;

export const DEFAULT_HEADERS = {
  'Accept': 'application/json',
  'Content-Type': 'application/json',
  'User-Agent': 'Kleros-MCP-Server/1.0.0'
} as const;