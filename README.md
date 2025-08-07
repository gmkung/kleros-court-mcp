# Kleros MCP Server

A Model Context Protocol (MCP) server that retrieves comprehensive Kleros court dispute data including meta-evidence and evidence submissions from multiple blockchain networks.

## Features

- 🔗 **Multi-chain Support**: Ethereum Mainnet and Gnosis Chain
- 📊 **Comprehensive Data**: Meta-evidence, evidence submissions, and IPFS content
- 🌐 **Remote Hosting Ready**: Streamable HTTP transport with session management
- 🔒 **Secure**: DNS rebinding protection and proper CORS configuration
- ⚡ **Fast**: Parallel IPFS content retrieval with error handling
- 📱 **Claude Desktop Compatible**: Direct URL integration

## Supported Networks

- **Ethereum Mainnet** (chainId: 1)
- **Gnosis Chain** (chainId: 100)

## Data Sources

- **Meta-evidence API**: Kleros dispute metadata
- **Ethereum Subgraph**: Evidence submissions on Ethereum
- **Gnosis Subgraph**: Evidence submissions on Gnosis Chain
- **IPFS Gateway**: Evidence content via Kleros CDN

## Claude Desktop Integration

### Simple Setup (Recommended)

1. **Open Claude Desktop**
2. **Go to Settings → Connectors**
3. **Click "Add custom connector"**
4. **Enter the details:**
   - **Name**: `Kleros Court`
   - **URL**: `https://kleros-mcp-server-new.fly.dev/mcp`
5. **Click "Add"**
6. **Confirm that you trust this connector**

![Claude Desktop Connector Setup](/Screenshot%202025-08-07%20at%201.48.34 PM.png)

The connector will now be available and you can use the `get_dispute_data` tool in your conversations!

### Alternative Configuration File Method

Add to your `claude_desktop_config.json`:
```json
{
  "mcpServers": {
    "kleros": {
      "url": "https://kleros-mcp-server-new.fly.dev/mcp"
    }
  }
}
```

## MCP Tool

### `get_dispute_data`

Retrieves comprehensive dispute data from Kleros including meta-evidence and evidence submissions.

**Parameters:**
- `disputeId` (string): The dispute ID to retrieve data for
- `chainId` (number): The chain ID (1 for Ethereum, 100 for Gnosis)

**Example Usage in Claude Desktop:**
- "Get dispute data for dispute ID 481 on Gnosis Chain"
- "Show me the evidence for dispute 123 on Ethereum"
- "What's the meta-evidence for dispute 50 on chain 100?"

## Quick Start

### Prerequisites

- Node.js 18.x or higher
- npm or yarn

### Local Development

1. **Clone and install dependencies**:
   ```bash
   git clone <your-repo>
   cd kleros-mcp-server
   npm install
   ```

2. **Build the project**:
   ```bash
   npm run build
   ```

3. **Start the server**:
   ```bash
   npm start
   ```

4. **Health check**:
   ```bash
   curl http://localhost:8080/health
   ```

### Development Mode

For development with auto-restart:
```bash
npm run dev
```

## Deployment

### Fly.io Deployment

1. **Install Fly CLI**:
   ```bash
   curl -L https://fly.io/install.sh | sh
   ```

2. **Login to Fly**:
   ```bash
   fly auth login
   ```

3. **Create app** (update app name in fly.toml if needed):
   ```bash
   fly apps create kleros-mcp-server-new
   ```

4. **Build and deploy**:
   ```bash
   npm run build
   fly deploy
   ```

5. **Check deployment**:
   ```bash
   fly status
   fly logs
   ```

Your MCP server will be available at: `https://kleros-mcp-server-new.fly.dev/mcp`

### Environment Variables

Set any required environment variables:
```bash
fly secrets set ALLOWED_HOSTS=kleros-mcp-server-new.fly.dev
```

## API Endpoints

### Health Check
```
GET /health
```

Returns server status and timestamp.

### MCP Protocol
```
POST /mcp
GET /mcp (for SSE notifications)
DELETE /mcp (for session termination)
```

Main MCP protocol endpoints with session management.

## Architecture

```
kleros-mcp-server/
├── src/
│   ├── index.ts              # Express server with Streamable HTTP transport
│   ├── server.ts             # MCP server setup and tool registration
│   ├── services/
│   │   ├── disputeService.ts # Main dispute data coordination
│   │   ├── metaEvidenceService.ts # Meta-evidence API integration
│   │   ├── subgraphService.ts     # Subgraph queries
│   │   └── ipfsService.ts         # IPFS content retrieval
│   ├── types/
│   │   └── index.ts          # TypeScript type definitions
│   └── utils/
│       └── constants.ts      # API endpoints and configuration
├── Dockerfile                # Container configuration
├── fly.toml                  # Fly.io deployment configuration
└── package.json
```

## Error Handling

The server includes comprehensive error handling:

- **Network timeouts**: 10-15 second timeouts for external APIs
- **IPFS failures**: Graceful handling of unreachable content
- **Subgraph errors**: Detailed error reporting for query failures
- **Input validation**: Proper validation of dispute IDs and chain IDs

## Development

### Adding New Chains

1. Add chain ID to `SUPPORTED_CHAIN_IDS` in `src/types/index.ts`
2. Add subgraph URL to `API_ENDPOINTS.SUBGRAPHS` in `src/utils/constants.ts`
3. Add network name to `NETWORK_NAMES` in `src/utils/constants.ts`

### Testing

Test the dispute data retrieval:
```bash
curl -X POST http://localhost:8080/mcp \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "method": "tools/call",
    "params": {
      "name": "get_dispute_data",
      "arguments": {
        "disputeId": "481",
        "chainId": 100
      }
    },
    "id": 1
  }'
```

## MCP Inspector Compliance

This server passes all MCP Inspector checks:

- ✅ Proper protocol implementation
- ✅ Correct message formatting
- ✅ Standard error codes
- ✅ Session management
- ✅ Resource cleanup

## Security

- DNS rebinding protection enabled
- CORS properly configured
- Non-root container user
- Input validation and sanitization
- Graceful error handling without information leakage

## Example Usage

Once connected to Claude Desktop, you can ask:

- **"Get dispute data for dispute 481 on Gnosis Chain"**
- **"Show me evidence submissions for dispute 123 on Ethereum"**
- **"What's the meta-evidence for dispute 50?"**

The tool will return formatted dispute information including:
- Meta-evidence (title, description, ruling options)
- Evidence submissions (with IPFS content)
- Error details for any failed retrievals

## License

MIT

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## Support

For issues and questions:
- Create an issue in the repository
- Check the logs: `fly logs` (for deployed version)
- Verify health: `curl https://kleros-mcp-server-new.fly.dev/health`