import { DisputeData, DisputeInput } from '../types/index.js';
export declare class DisputeService {
    private metaEvidenceService;
    private subgraphService;
    private ipfsService;
    constructor();
    getDisputeData(input: DisputeInput): Promise<DisputeData>;
    private validateInput;
}
//# sourceMappingURL=disputeService.d.ts.map