/**
 * API service for communicating with the backend.
 */

const API_BASE_URL = (import.meta.env.VITE_API_URL || '/backend') + '/api';

class ApiService {
    constructor() {
        this.baseUrl = API_BASE_URL;
    }

    async request(endpoint, options = {}) {
        const url = `${this.baseUrl}${endpoint}`;

        const config = {
            ...options,
            headers: {
                'Content-Type': 'application/json',
                ...options.headers,
            },
        };

        try {
            const response = await fetch(url, config);

            if (!response.ok) {
                const error = await response.json().catch(() => ({}));
                throw new Error(error.detail || `HTTP error ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error(`API Error [${endpoint}]:`, error);
            throw error;
        }
    }

    // Onboarding endpoints
    async startOnboarding(domain, companyName = null) {
        return this.request('/onboarding/start', {
            method: 'POST',
            body: JSON.stringify({
                domain,
                company_name: companyName,
            }),
        });
    }

    async getOnboardingStatus(organizationId) {
        return this.request(`/onboarding/status/${organizationId}`);
    }

    async getOnboardingResult(organizationId) {
        return this.request(`/onboarding/result/${organizationId}`);
    }

    async updateOnboardingResult(organizationId, section, data) {
        return this.request(`/onboarding/result/${organizationId}`, {
            method: 'PUT',
            body: JSON.stringify({ section, data }),
        });
    }

    async retryOnboarding(organizationId) {
        return this.request(`/onboarding/retry/${organizationId}`, {
            method: 'POST',
        });
    }

    // Organization endpoints
    async getOrganization(organizationId) {
        return this.request(`/organizations/${organizationId}`);
    }

    async getKnowledgeBase(organizationId) {
        return this.request(`/organizations/${organizationId}/knowledge-base`);
    }

    // Campaign endpoints
    async listCampaigns(organizationId) {
        return this.request(`/campaigns?organization_id=${organizationId}`);
    }

    async getCampaign(campaignId) {
        return this.request(`/campaigns/${campaignId}`);
    }

    async createCampaign(data) {
        return this.request('/campaigns', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    }

    async executeCampaign(campaignId) {
        return this.request(`/campaigns/${campaignId}/execute`, {
            method: 'POST',
        });
    }

    async selectConcept(campaignId, conceptIndex) {
        return this.request(`/campaigns/${campaignId}/select-concept`, {
            method: 'POST',
            body: JSON.stringify({ concept_index: conceptIndex }),
        });
    }

    async regenerateAsset(campaignId, assetIndex, modifications) {
        return this.request(`/campaigns/${campaignId}/regenerate-asset`, {
            method: 'POST',
            body: JSON.stringify({ asset_index: assetIndex, modifications }),
        });
    }

    async deleteCampaign(campaignId) {
        return this.request(`/campaigns/${campaignId}`, {
            method: 'DELETE',
        });
    }

    // Asset endpoints
    async listAssets(campaignId) {
        return this.request(`/assets?campaign_id=${campaignId}`);
    }

    async getAsset(assetId) {
        return this.request(`/assets/${assetId}`);
    }

    async getAssetVersions(assetId) {
        return this.request(`/assets/${assetId}/versions`);
    }

    async updateAsset(assetId, data) {
        return this.request(`/assets/${assetId}`, {
            method: 'PUT',
            body: JSON.stringify(data),
        });
    }

    async deleteAsset(assetId) {
        return this.request(`/assets/${assetId}`, {
            method: 'DELETE',
        });
    }

    async getAssetComments(assetId) {
        return this.request(`/assets/${assetId}/comments`);
    }

    async addAssetComment(assetId, data) {
        return this.request(`/assets/${assetId}/comments`, {
            method: 'POST',
            body: JSON.stringify(data),
        });
    }

    // Chat endpoints
    async listConversations(organizationId) {
        return this.request(`/chat/conversations?organization_id=${organizationId}`);
    }

    async getConversation(conversationId) {
        return this.request(`/chat/conversations/${conversationId}`);
    }

    async createConversation(organizationId, title, contextType) {
        return this.request('/chat/conversations', {
            method: 'POST',
            body: JSON.stringify({
                organization_id: organizationId,
                title,
                context_type: contextType,
            }),
        });
    }

    async deleteConversation(conversationId) {
        return this.request(`/chat/conversations/${conversationId}`, {
            method: 'DELETE',
        });
    }

    async sendMessage(conversationId, content) {
        return this.request(`/chat/conversations/${conversationId}/messages`, {
            method: 'POST',
            body: JSON.stringify({ content }),
        });
    }

    async streamMessage(conversationId, content, onChunk, onDone) {
        const url = `${this.baseUrl}/chat/conversations/${conversationId}/messages?stream=true`;
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ content }),
        });

        if (!response.ok) {
            const error = await response.json().catch(() => ({}));
            throw new Error(error.detail || `HTTP error ${response.status}`);
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let fullText = '';
        let buffer = '';

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop();

            for (const line of lines) {
                if (line.startsWith('data: ')) {
                    const data = line.slice(6);
                    if (data === '[DONE]') continue;
                    try {
                        const parsed = JSON.parse(data);
                        const text = parsed.content || parsed.text || data;
                        fullText += text;
                        if (onChunk) onChunk(text);
                    } catch {
                        fullText += data;
                        if (onChunk) onChunk(data);
                    }
                }
            }
        }

        if (onDone) onDone(fullText);
        return fullText;
    }

    // WebSocket for real-time updates
    _connectWebSocket(path, onMessage, onError) {
        let wsUrl;
        if (this.baseUrl.startsWith('http://') || this.baseUrl.startsWith('https://')) {
            // Absolute URL - convert protocol
            wsUrl = this.baseUrl
                .replace('http://', 'ws://')
                .replace('https://', 'wss://');
        } else {
            // Relative URL (e.g., '/api') - construct from window.location
            const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
            wsUrl = `${protocol}//${window.location.host}${this.baseUrl}`;
        }

        const ws = new WebSocket(`${wsUrl}${path}`);

        ws.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                onMessage(data);
            } catch (error) {
                console.error('WebSocket message parse error:', error);
            }
        };

        ws.onerror = (error) => {
            console.error('WebSocket error:', error);
            if (onError) onError(error);
        };

        ws.onclose = () => {
            console.log('WebSocket closed');
        };

        const pingInterval = setInterval(() => {
            if (ws.readyState === WebSocket.OPEN) {
                ws.send('ping');
            }
        }, 30000);

        return {
            ws,
            close: () => {
                clearInterval(pingInterval);
                ws.close();
            },
        };
    }

    connectOnboardingProgress(organizationId, onMessage, onError) {
        return this._connectWebSocket(
            `/onboarding/progress/${organizationId}`,
            onMessage,
            onError
        );
    }

    connectCampaignExecution(campaignId, sessionId, onMessage, onError) {
        return this._connectWebSocket(
            `/campaigns/${campaignId}/ws/${sessionId}`,
            onMessage,
            onError
        );
    }

    connectChat(conversationId, onMessage, onError) {
        return this._connectWebSocket(
            `/chat/conversations/${conversationId}/ws`,
            onMessage,
            onError
        );
    }
}

export const api = new ApiService();
export default api;
