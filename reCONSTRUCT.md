# Kleros Court MCP Server - Reconstruction Guide

## Overview

A Model Context Protocol (MCP) server that retrieves comprehensive Kleros court dispute data including meta-evidence and evidence submissions from multiple blockchain networks.

**🚀 Live Deployment:** `https://kleros-mcp-server-new.fly.dev/mcp`  
**📁 GitHub Repository:** `https://github.com/gmkung/kleros-court-mcp`

## Core Architecture

### Supported Networks
- **Ethereum Mainnet** (chainId: 1)
- **Gnosis Chain** (chainId: 100)

### Data Sources ⚠️ UPDATED URLs
1. **Meta-evidence API**: `https://kleros-api.netlify.app/.netlify/functions/get-dispute-metaevidence`
2. **Ethereum Subgraph**: `https://gateway.thegraph.com/api/d1d19cef4bc7647cc6cfad4ad2662628/subgraphs/id/BqbBhB4R5pNAtdYya2kcojMrQMp8nVHioUnP22qN8JoN`
3. **Gnosis Subgraph**: `https://gateway.thegraph.com/api/d1d19cef4bc7647cc6cfad4ad2662628/subgraphs/id/FxhLntVBELrZ4t1c2HNNvLWEYfBjpB8iKZiEymuFSPSr`
4. **IPFS Gateway**: `https://cdn.kleros.link`

### ⚠️ CRITICAL: Subgraph URL Format Change
The original URLs in this guide were outdated. The correct format uses `/subgraphs/id/` instead of the direct gateway URLs.

## Core Logic

### 1. Dispute Data Retrieval

```typescript
// Main function to get comprehensive dispute data
async function getDisputeData(disputeId: string, chainId: number) {
  // 1. Get meta-evidence
  const metaEvidence = await getMetaEvidence(disputeId, chainId);
  
  // 2. Get evidence submissions from subgraph
  const evidenceSubmissions = await getEvidenceSubmissions(disputeId, chainId);
  
  // 3. Fetch evidence content from IPFS
  const evidenceContents = await Promise.allSettled(
    evidenceSubmissions.map(submission => 
      getEvidenceContent(submission.uri)
    )
  );
  
  return {
    disputeId,
    chainId,
    metaEvidence,
    evidenceContents: evidenceContents
      .filter(result => result.status === 'fulfilled')
      .map(result => result.value),
    evidenceErrors: evidenceContents
      .filter(result => result.status === 'rejected')
      .map(result => ({
        evidenceUri: result.reason.uri,
        error: result.reason.message
      }))
  };
}
```

### 2. Meta-evidence Retrieval

```typescript
async function getMetaEvidence(disputeId: string, chainId: number) {
  const response = await axios.get(
    'https://kleros-api.netlify.app/.netlify/functions/get-dispute-metaevidence',
    {
      params: { disputeId, chainId }
    }
  );
  
  return response.data;
}
```

### 3. Evidence Submissions from Subgraph ⚠️ UPDATED SCHEMA

```typescript
async function getEvidenceSubmissions(disputeId: string, chainId: number) {
  const subgraphUrl = chainId === 1 
    ? 'https://gateway.thegraph.com/api/d1d19cef4bc7647cc6cfad4ad2662628/subgraphs/id/BqbBhB4R5pNAtdYya2kcojMrQMp8nVHioUnP22qN8JoN'
    : 'https://gateway.thegraph.com/api/d1d19cef4bc7647cc6cfad4ad2662628/subgraphs/id/FxhLntVBELrZ4t1c2HNNvLWEYfBjpB8iKZiEymuFSPSr';
    
  // ⚠️ CRITICAL: Updated query structure - the schema changed!
  const query = `
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
  
  const response = await axios.post(subgraphUrl, {
    query,
    variables: { id: disputeId }  // ⚠️ Variable name changed from disputeId to id
  });
  
  return response.data.data.dispute?.evidenceGroup?.evidence || [];
}
```

### 4. IPFS Content Retrieval ⚠️ UPDATED URI HANDLING

```typescript
async function getEvidenceContent(ipfsUri: string) {
  // ⚠️ CRITICAL: Handle multiple URI formats
  const httpUrl = convertIpfsUriToHttp(ipfsUri);
  
  const response = await axios.get(httpUrl, {
    timeout: 10000,
    headers: {
      'Accept': 'application/json'
    }
  });
  
  return {
    title: response.data.title,
    description: response.data.description,
    fileURI: response.data.fileURI,
    fileTypeExtension: response.data.fileTypeExtension,
    type: response.data.type
  };
}

function convertIpfsUriToHttp(ipfsUri: string): string {
  // Handle different IPFS URI formats
  if (ipfsUri.startsWith('ipfs://')) {
    return ipfsUri.replace('ipfs://', 'https://cdn.kleros.link/ipfs/');
  }
  
  // ⚠️ NEW: Handle URIs that already start with /ipfs/ (from subgraph)
  if (ipfsUri.startsWith('/ipfs/')) {
    return `https://cdn.kleros.link${ipfsUri}`;
  }
  
  if (ipfsUri.startsWith('Qm') || ipfsUri.startsWith('bafy')) {
    return `https://cdn.kleros.link/ipfs/${ipfsUri}`;
  }
  
  if (ipfsUri.startsWith('http')) {
    return ipfsUri;
  }
  
  return `https://cdn.kleros.link/ipfs/${ipfsUri}`;
}
```

## MCP Server Implementation

### Tool Definition

```typescript
{
  name: "get_dispute_data",
  description: "Retrieve comprehensive dispute data from Kleros including meta-evidence and evidence submissions",
  inputSchema: {
    type: "object",
    properties: {
      disputeId: {
        type: "string",
        description: "The dispute ID to retrieve data for"
      },
      chainId: {
        type: "number",
        description: "The chain ID (1 for Ethereum, 100 for Gnosis)",
        enum: [1, 100]
      }
    },
    required: ["disputeId", "chainId"]
  }
}
```

### Server Transport Options ⚠️ RECOMMENDED: Modern Only

1. **Stdio Transport** (Local Development)
   ```typescript
   import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
   ```

2. **~~SSE Transport~~ (DEPRECATED)** ❌ Do not use
   ```typescript
   // import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
   // ⚠️ SSE Transport is deprecated - use Streamable HTTP instead
   ```

3. **Streamable HTTP Transport** (✅ RECOMMENDED for Remote)
   ```typescript
   import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
   // This is the modern, recommended transport for remote deployments
   ```

## Error Handling

### Network Timeouts
```typescript
const response = await axios.get(url, {
  timeout: 10000,
  headers: { 'Accept': 'application/json' }
});
```

### IPFS Content Validation
```typescript
try {
  const content = await getEvidenceContent(uri);
  return content;
} catch (error) {
  return {
    error: `Failed to retrieve content from ${uri}: ${error.message}`,
    uri
  };
}
```

### Subgraph Query Errors
```typescript
try {
  const response = await axios.post(subgraphUrl, { query, variables });
  return response.data.data.evidenceSubmissions;
} catch (error) {
  throw new Error(`Subgraph query failed: ${error.message}`);
}
```

## Testing

### Local Testing
```bash
# Build and run
yarn build
yarn start

# Test with curl
curl -X POST http://localhost:3000/api/test \
  -H "Content-Type: application/json" \
  -d '{"disputeId": "123", "chainId": 1}'
```

## Dependencies

```json
{
  "dependencies": {
    "@modelcontextprotocol/sdk": "^1.17.1",
    "axios": "^1.6.0",
    "express": "^4.18.2",
    "cors": "^2.8.5",
    "zod": "^3.22.0"
  },
  "devDependencies": {
    "@types/node": "^20.0.0",
    "@types/express": "^4.17.21",
    "@types/cors": "^2.8.17",
    "tsx": "^4.0.0",
    "typescript": "^5.0.0"
  }
}
```

## Key Features

- ✅ **Multi-chain support** (Ethereum + Gnosis)
- ✅ **Comprehensive error handling**
- ✅ **IPFS content retrieval**
- ✅ **Subgraph integration**
- ✅ **Modern MCP transport** (Streamable HTTP)
- ✅ **Claude Desktop integration** (Direct URL)
- ✅ **Fly.io deployment ready**

## Critical Issues Resolved ⚠️

### 1. Subgraph URL Format Change
**Problem:** Original URLs returned 404 errors  
**Solution:** Updated to use `/subgraphs/id/` format in gateway URLs

### 2. GraphQL Schema Changes
**Problem:** Query used outdated field names (`evidenceSubmissions`, `uri`, `submitter`, `timestamp`)  
**Solution:** Updated to new schema structure:
- `dispute(id: $id) -> evidenceGroup -> evidence`
- Field names: `URI`, `sender`, `creationTime`
- Variable name: `disputeId` → `id`

### 3. IPFS URI Format Handling
**Problem:** Subgraph returns URIs with `/ipfs/` prefix, not `ipfs://` protocol  
**Solution:** Added handling for multiple URI formats in conversion function

### 4. ES Module Configuration
**Problem:** ES import/export syntax errors  
**Solution:** Added `"type": "module"` to package.json

### 5. Error Message Serialization
**Problem:** Error objects showing as `[object Object]`  
**Solution:** Improved error message extraction from ApiError objects

## Modern Implementation Notes

1. **Use Streamable HTTP Transport** - SSE is deprecated
2. **Handle URI Formats Properly** - The subgraph returns `/ipfs/` prefixed URIs
3. **Update GraphQL Queries** - Schema has changed significantly
4. **Use Latest MCP SDK** - v1.17.1+ for modern features
5. **Enable ES Modules** - Required for latest MCP SDK

## Claude Desktop Integration

**Direct URL Setup:**
1. Settings → Connectors → Add custom connector
2. Name: `Kleros Court`
3. URL: `https://kleros-mcp-server-new.fly.dev/mcp`
4. No configuration file needed!

This reconstruction guide contains all the essential logic and **critical fixes** needed to rebuild the Kleros Court MCP server from scratch. 