import { SupportedChainId } from '../types/index.js';
export declare const API_ENDPOINTS: {
    readonly META_EVIDENCE: "https://kleros-api.netlify.app/.netlify/functions/get-dispute-metaevidence";
    readonly IPFS_GATEWAY: "https://cdn.kleros.link";
    readonly SUBGRAPHS: Record<SupportedChainId, string>;
};
export declare const NETWORK_NAMES: {
    readonly 1: "Ethereum Mainnet";
    readonly 100: "Gnosis Chain";
};
export declare const REQUEST_TIMEOUTS: {
    readonly META_EVIDENCE: 15000;
    readonly SUBGRAPH: 10000;
    readonly IPFS: 10000;
};
export declare const EVIDENCE_QUERY = "\n  query getDispute($id: String!) {\n    dispute(id: $id) {\n      evidenceGroup {\n        evidence {\n          URI\n          sender\n          creationTime\n        }\n      }\n    }\n  }\n";
export declare const DEFAULT_HEADERS: {
    readonly Accept: "application/json";
    readonly 'Content-Type': "application/json";
    readonly 'User-Agent': "Kleros-MCP-Server/1.0.0";
};
//# sourceMappingURL=constants.d.ts.map