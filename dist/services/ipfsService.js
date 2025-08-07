import axios from 'axios';
import { API_ENDPOINTS, REQUEST_TIMEOUTS, DEFAULT_HEADERS } from '../utils/constants.js';
export class IpfsService {
    async getEvidenceContent(ipfsUri) {
        if (!ipfsUri) {
            throw new Error('IPFS URI is required');
        }
        // Convert IPFS URI to HTTP URL
        const httpUrl = this.convertIpfsUriToHttp(ipfsUri);
        try {
            const response = await axios.get(httpUrl, {
                timeout: REQUEST_TIMEOUTS.IPFS,
                headers: DEFAULT_HEADERS
            });
            // Extract relevant fields from the response
            const content = {
                title: response.data.title,
                description: response.data.description,
                fileURI: response.data.fileURI,
                fileTypeExtension: response.data.fileTypeExtension,
                type: response.data.type
            };
            return content;
        }
        catch (error) {
            if (axios.isAxiosError(error)) {
                const apiError = {
                    message: `Failed to retrieve IPFS content: ${error.message}`,
                    code: error.code || 'IPFS_ERROR',
                    details: {
                        status: error.response?.status,
                        statusText: error.response?.statusText,
                        ipfsUri,
                        httpUrl
                    }
                };
                throw apiError;
            }
            throw new Error(`Unexpected error retrieving IPFS content: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    convertIpfsUriToHttp(ipfsUri) {
        // Handle different IPFS URI formats
        if (ipfsUri.startsWith('ipfs://')) {
            return ipfsUri.replace('ipfs://', `${API_ENDPOINTS.IPFS_GATEWAY}/ipfs/`);
        }
        if (ipfsUri.startsWith('/ipfs/')) {
            // Already has /ipfs/ prefix, just prepend the gateway
            return `${API_ENDPOINTS.IPFS_GATEWAY}${ipfsUri}`;
        }
        if (ipfsUri.startsWith('Qm') || ipfsUri.startsWith('bafy')) {
            // Direct IPFS hash
            return `${API_ENDPOINTS.IPFS_GATEWAY}/ipfs/${ipfsUri}`;
        }
        if (ipfsUri.startsWith('http')) {
            // Already an HTTP URL
            return ipfsUri;
        }
        // Assume it's an IPFS hash and prepend the gateway
        return `${API_ENDPOINTS.IPFS_GATEWAY}/ipfs/${ipfsUri}`;
    }
}
//# sourceMappingURL=ipfsService.js.map