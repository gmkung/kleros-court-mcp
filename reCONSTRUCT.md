# Kleros Court MCP Server - Reconstruction Guide

## Overview

A Model Context Protocol (MCP) server that retrieves comprehensive Kleros court dispute data including meta-evidence and evidence submissions from multiple blockchain networks.

## Core Architecture

### Supported Networks
- **Ethereum Mainnet** (chainId: 1)
- **Gnosis Chain** (chainId: 100)

### Data Sources
1. **Meta-evidence API**: `https://kleros-api.netlify.app/.netlify/functions/get-dispute-metaevidence`
2. **Ethereum Subgraph**: `https://gateway.thegraph.com/api/d1d19cef4bc7647cc6cfad4ad2662628/BqbBhB4R5pNAtdYya2kcojMrQMp8nVHioUnP22qN8JoN`
3. **Gnosis Subgraph**: `https://gateway.thegraph.com/api/d1d19cef4bc7647cc6cfad4ad2662628/FxhLntVBELrZ4t1c2HNNvLWEYfBjpB8iKZiEymuFSPSr`
4. **IPFS Gateway**: `https://cdn.kleros.link`

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

### 3. Evidence Submissions from Subgraph

```typescript
async function getEvidenceSubmissions(disputeId: string, chainId: number) {
  const subgraphUrl = chainId === 1 
    ? 'https://gateway.thegraph.com/api/d1d19cef4bc7647cc6cfad4ad2662628/BqbBhB4R5pNAtdYya2kcojMrQMp8nVHioUnP22qN8JoN'
    : 'https://gateway.thegraph.com/api/d1d19cef4bc7647cc6cfad4ad2662628/FxhLntVBELrZ4t1c2HNNvLWEYfBjpB8iKZiEymuFSPSr';
    
  const query = `
    query GetEvidence($disputeId: String!) {
      evidenceSubmissions(where: { dispute: $disputeId }) {
        id
        uri
        submitter
        timestamp
      }
    }
  `;
  
  const response = await axios.post(subgraphUrl, {
    query,
    variables: { disputeId }
  });
  
  return response.data.data.evidenceSubmissions;
}
```

### 4. IPFS Content Retrieval

```typescript
async function getEvidenceContent(ipfsUri: string) {
  // Convert IPFS URI to HTTP URL
  const httpUrl = ipfsUri.replace('ipfs://', 'https://cdn.kleros.link/ipfs/');
  
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

### Server Transport Options

1. **Stdio Transport** (Local)
   ```typescript
   import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
   ```

2. **SSE Transport** (Remote)
   ```typescript
   import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
   ```

3. **Streamable HTTP Transport** (Modern Remote)
   ```typescript
   import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
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
- ✅ **Multiple transport options**

This reconstruction guide contains all the essential logic needed to rebuild the Kleros Court MCP server from scratch. 