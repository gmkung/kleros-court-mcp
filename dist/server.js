import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { DisputeService } from "./services/disputeService.js";
import { SUPPORTED_CHAIN_IDS } from "./types/index.js";
export function createMcpServer() {
    const server = new McpServer({
        name: "kleros-court-server",
        version: "1.0.0"
    });
    const disputeService = new DisputeService();
    // Register the get_dispute_data tool
    server.registerTool("get_dispute_data", {
        title: "Get Kleros Dispute Data",
        description: "Retrieve comprehensive dispute data from Kleros including meta-evidence and evidence submissions from multiple blockchain networks",
        inputSchema: {
            disputeId: z.string().min(1).describe("The dispute ID to retrieve data for"),
            chainId: z.number().refine((val) => SUPPORTED_CHAIN_IDS.includes(val), {
                message: `Chain ID must be one of: ${SUPPORTED_CHAIN_IDS.join(', ')} (1 for Ethereum, 100 for Gnosis)`
            }).describe("The chain ID (1 for Ethereum Mainnet, 100 for Gnosis Chain)")
        }
    }, async ({ disputeId, chainId }) => {
        try {
            const input = { disputeId, chainId };
            const disputeData = await disputeService.getDisputeData(input);
            // Format the response as structured text
            let responseText = `# Kleros Dispute Data\n\n`;
            responseText += `**Dispute ID:** ${disputeData.disputeId}\n`;
            responseText += `**Chain:** ${chainId === 1 ? 'Ethereum Mainnet' : 'Gnosis Chain'} (${disputeData.chainId})\n\n`;
            // Meta-evidence section
            if (disputeData.metaEvidence) {
                responseText += `## Meta-Evidence\n`;
                if (disputeData.metaEvidence.title) {
                    responseText += `**Title:** ${disputeData.metaEvidence.title}\n`;
                }
                if (disputeData.metaEvidence.description) {
                    responseText += `**Description:** ${disputeData.metaEvidence.description}\n`;
                }
                if (disputeData.metaEvidence.question) {
                    responseText += `**Question:** ${disputeData.metaEvidence.question}\n`;
                }
                if (disputeData.metaEvidence.category) {
                    responseText += `**Category:** ${disputeData.metaEvidence.category}\n`;
                }
                if (disputeData.metaEvidence.rulingOptions) {
                    responseText += `**Ruling Options:**\n`;
                    disputeData.metaEvidence.rulingOptions.titles.forEach((title, index) => {
                        responseText += `  ${index}: ${title}\n`;
                        if (disputeData.metaEvidence?.rulingOptions?.descriptions[index]) {
                            responseText += `     ${disputeData.metaEvidence.rulingOptions.descriptions[index]}\n`;
                        }
                    });
                }
                responseText += `\n`;
            }
            else {
                responseText += `## Meta-Evidence\nNo meta-evidence found for this dispute.\n\n`;
            }
            // Evidence submissions section
            if (disputeData.evidenceContents.length > 0) {
                responseText += `## Evidence Submissions (${disputeData.evidenceContents.length})\n\n`;
                disputeData.evidenceContents.forEach((evidence, index) => {
                    responseText += `### Evidence ${index + 1}\n`;
                    if (evidence.title) {
                        responseText += `**Title:** ${evidence.title}\n`;
                    }
                    if (evidence.description) {
                        responseText += `**Description:** ${evidence.description}\n`;
                    }
                    if (evidence.type) {
                        responseText += `**Type:** ${evidence.type}\n`;
                    }
                    if (evidence.fileURI) {
                        responseText += `**File URI:** ${evidence.fileURI}\n`;
                    }
                    if (evidence.fileTypeExtension) {
                        responseText += `**File Type:** ${evidence.fileTypeExtension}\n`;
                    }
                    responseText += `\n`;
                });
            }
            else {
                responseText += `## Evidence Submissions\nNo evidence submissions found for this dispute.\n\n`;
            }
            // Evidence errors section
            if (disputeData.evidenceErrors.length > 0) {
                responseText += `## Evidence Retrieval Errors (${disputeData.evidenceErrors.length})\n\n`;
                disputeData.evidenceErrors.forEach((error, index) => {
                    responseText += `### Error ${index + 1}\n`;
                    responseText += `**URI:** ${error.evidenceUri}\n`;
                    responseText += `**Error:** ${error.error}\n\n`;
                });
            }
            return {
                content: [{
                        type: "text",
                        text: responseText
                    }]
            };
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
            return {
                content: [{
                        type: "text",
                        text: `Error retrieving dispute data: ${errorMessage}`
                    }],
                isError: true
            };
        }
    });
    return server;
}
//# sourceMappingURL=server.js.map