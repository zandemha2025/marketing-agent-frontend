import React, { useState, useEffect, useCallback, useRef } from 'react';
import api from '../services/api';
import AssetGallery from '../components/shared/AssetGallery';
import ProgressIndicator from '../components/shared/ProgressIndicator';
import { SlidingDeliverablesPanel } from '../components/deliverables';
import { TrendMaster } from '../components/trends';
import { KanbanBoard } from '../components/kanban';
import { SocialCalendar } from '../components/calendar';
import { ConversationalImageEditor } from '../components/image-editor';
import './DashboardPage.css';

// Map backend phases to display phases
const PHASE_MAP = {
    research: { name: 'Research', index: 0 },
    strategy: { name: 'Strategy', index: 1 },
    creative: { name: 'Creative', index: 2 },
    production: { name: 'Production', index: 3 },
    complete: { name: 'Complete', index: 4 },
};

const NAV_ITEMS = [
    { key: 'chat', icon: '💬', label: 'Chat' },
    { key: 'campaigns', icon: '📋', label: 'Campaigns' },
    { key: 'workflow', icon: '📊', label: 'Workflow' },
    { key: 'calendar', icon: '📅', label: 'Calendar' },
    { key: 'trends', icon: '🔥', label: 'TrendMaster' },
    { key: 'assets', icon: '📦', label: 'Assets' },
    { key: 'image-editor', icon: '🎨', label: 'Image Editor' },
    { key: 'brand', icon: '🏢', label: 'Brand' },
];

function DashboardPage({ organizationId, onLogout, onNavigate }) {
    const [activeView, setActiveView] = useState('chat');
    const [selectedCampaign, setSelectedCampaign] = useState(null);
    const [conversationId, setConversationId] = useState(null);
    const [showCreateCampaign, setShowCreateCampaign] = useState(false);
    const [showExecution, setShowExecution] = useState(null);
    const [showDeliverables, setShowDeliverables] = useState(false);
    const [deliverables, setDeliverables] = useState([]);
    const [kanbanTasks, setKanbanTasks] = useState([]);
    const [scheduledPosts, setScheduledPosts] = useState([]);

    // Data state
    const [campaigns, setCampaigns] = useState([]);
    const [brandData, setBrandData] = useState(null);
    const [conversations, setConversations] = useState([]);
    const [loading, setLoading] = useState(false);

    // Chat state
    const [chatMessages, setChatMessages] = useState([]);
    const [chatInput, setChatInput] = useState('');
    const [chatLoading, setChatLoading] = useState(false);

    // Execution state
    const [executionPhases, setExecutionPhases] = useState([
        { name: 'Research', status: 'pending', progress: 0 },
        { name: 'Strategy', status: 'pending', progress: 0 },
        { name: 'Creative', status: 'pending', progress: 0 },
        { name: 'Production', status: 'pending', progress: 0 },
        { name: 'Complete', status: 'pending', progress: 0 },
    ]);
    const [executionMessage, setExecutionMessage] = useState('');
    const [executionCurrentPhase, setExecutionCurrentPhase] = useState(0);
    const executionWsRef = useRef(null);

    // Create campaign form
    const [newCampaign, setNewCampaign] = useState({
        name: '',
        goal: '',
        target_audience: '',
        platforms: [],
    });

    const loadCampaigns = useCallback(async () => {
        try {
            const data = await api.listCampaigns(organizationId);
            setCampaigns(Array.isArray(data) ? data : data.campaigns || []);
        } catch (err) {
            console.error('Failed to load campaigns:', err);
        }
    }, [organizationId]);

    const loadBrandData = useCallback(async () => {
        try {
            const data = await api.getKnowledgeBase(organizationId);
            setBrandData(data);
        } catch (err) {
            console.error('Failed to load brand data:', err);
        }
    }, [organizationId]);

    const loadConversations = useCallback(async () => {
        try {
            const data = await api.listConversations(organizationId);
            setConversations(Array.isArray(data) ? data : data.conversations || []);
        } catch (err) {
            console.error('Failed to load conversations:', err);
        }
    }, [organizationId]);

    useEffect(() => {
        if (!organizationId) return;
        loadCampaigns();
        loadBrandData();
        loadConversations();
    }, [organizationId, loadCampaigns, loadBrandData, loadConversations]);

    // Load conversation messages when conversationId changes
    useEffect(() => {
        if (!conversationId) {
            setChatMessages([]);
            return;
        }
        let cancelled = false;
        (async () => {
            try {
                const data = await api.getConversation(conversationId);
                if (!cancelled) {
                    setChatMessages(data.messages || []);
                }
            } catch (err) {
                console.error('Failed to load conversation:', err);
            }
        })();
        return () => { cancelled = true; };
    }, [conversationId]);

    const handleSendMessage = async () => {
        const text = chatInput.trim();
        if (!text || chatLoading) return;

        setChatInput('');
        setChatLoading(true);

        // Optimistic local append
        const userMsg = { role: 'user', content: text, id: Date.now() };
        setChatMessages(prev => [...prev, userMsg]);

        try {
            let cid = conversationId;
            if (!cid) {
                // Try to find existing conversation or create a new one
                const convos = await api.listConversations(organizationId);
                const list = Array.isArray(convos) ? convos : convos.conversations || [];
                if (list.length > 0) {
                    cid = list[0].id;
                } else {
                    // No conversations exist - create a new one
                    const newConvo = await api.createConversation(
                        organizationId,
                        'Marketing Chat',
                        'general'
                    );
                    cid = newConvo.id;
                }
            }

            // Now we definitely have a conversation ID - send the message
            const response = await api.sendMessage(cid, text);
            if (response && response.assistant_message) {
                setChatMessages(prev => [...prev, response.assistant_message]);
            } else if (response && response.message) {
                setChatMessages(prev => [...prev, response.message]);
            }
            setConversationId(cid);
        } catch (err) {
            console.error('Failed to send message:', err);
            setChatMessages(prev => [...prev, {
                role: 'assistant',
                content: 'Sorry, something went wrong. Please try again.',
                id: Date.now() + 1,
            }]);
        } finally {
            setChatLoading(false);
        }
    };

    const handleCreateCampaign = async () => {
        if (!newCampaign.name.trim()) return;
        setLoading(true);
        try {
            const created = await api.createCampaign({
                ...newCampaign,
                organization_id: organizationId,
            });
            setCampaigns(prev => [...prev, created]);
            setShowCreateCampaign(false);
            setNewCampaign({ name: '', goal: '', target_audience: '', platforms: [] });
            setSelectedCampaign(created);
            setActiveView('campaigns');
        } catch (err) {
            console.error('Failed to create campaign:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleSelectCampaign = (campaign) => {
        setSelectedCampaign(campaign);
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    const togglePlatform = (platform) => {
        setNewCampaign(prev => ({
            ...prev,
            platforms: prev.platforms.includes(platform)
                ? prev.platforms.filter(p => p !== platform)
                : [...prev.platforms, platform],
        }));
    };

    const handleExecuteCampaign = async (campaign) => {
        if (!campaign) return;

        // Reset execution state
        setExecutionPhases([
            { name: 'Research', status: 'pending', progress: 0 },
            { name: 'Strategy', status: 'pending', progress: 0 },
            { name: 'Creative', status: 'pending', progress: 0 },
            { name: 'Production', status: 'pending', progress: 0 },
            { name: 'Complete', status: 'pending', progress: 0 },
        ]);
        setExecutionMessage('Starting campaign execution...');
        setExecutionCurrentPhase(0);
        setShowExecution({ campaignId: campaign.id });

        try {
            // Start execution and get session ID
            const { session_id } = await api.executeCampaign(campaign.id);

            // Connect WebSocket for progress updates
            const { ws, close } = api.connectCampaignExecution(
                campaign.id,
                session_id,
                (data) => {
                    if (data.type === 'connected') {
                        // Send start command
                        ws.send(JSON.stringify({ action: 'start' }));
                    } else if (data.type === 'progress') {
                        const phaseInfo = PHASE_MAP[data.phase] || { name: data.phase, index: 0 };
                        setExecutionCurrentPhase(phaseInfo.index);
                        setExecutionMessage(data.message);

                        setExecutionPhases(prev => prev.map((p, i) => {
                            if (i < phaseInfo.index) {
                                return { ...p, status: 'complete', progress: 100 };
                            } else if (i === phaseInfo.index) {
                                return { ...p, status: 'active', progress: data.progress };
                            }
                            return p;
                        }));
                    } else if (data.type === 'complete') {
                        setExecutionPhases(prev => prev.map(p => ({
                            ...p, status: 'complete', progress: 100
                        })));
                        setExecutionMessage('Campaign complete! ' + (data.assets?.length || 0) + ' assets generated.');
                        // Reload campaigns to get updated data
                        loadCampaigns();
                    } else if (data.type === 'error') {
                        setExecutionMessage('Error: ' + data.message);
                    }
                },
                (error) => {
                    console.error('Execution WebSocket error:', error);
                    setExecutionMessage('Connection error. Please try again.');
                }
            );

            executionWsRef.current = { ws, close };
        } catch (err) {
            console.error('Failed to start execution:', err);
            setExecutionMessage('Failed to start execution: ' + err.message);
        }
    };

    const handleCloseExecution = () => {
        if (executionWsRef.current) {
            executionWsRef.current.close();
            executionWsRef.current = null;
        }
        setShowExecution(null);
    };

    // ---------- Render helpers ----------

    const renderChatView = () => (
        <div className="chat-container">
            <div className="chat-messages">
                {chatMessages.length === 0 ? (
                    <div className="welcome-message">
                        <h1>Welcome back!</h1>
                        <p>
                            Your brand profile is ready. I know all about your brand,
                            market position, and audience. What would you like to work on?
                        </p>
                        <div className="quick-actions">
                            <button className="quick-action" onClick={() => { setChatInput('Launch a new campaign'); }}>
                                <span className="action-icon">🚀</span>
                                <span>Launch a Campaign</span>
                            </button>
                            <button className="quick-action" onClick={() => { setChatInput('Create content for my brand'); }}>
                                <span className="action-icon">✍️</span>
                                <span>Create Content</span>
                            </button>
                            <button className="quick-action quick-action--featured" onClick={() => onNavigate('kata-lab')}>
                                <span className="action-icon">🎭</span>
                                <span>Kata Lab</span>
                                <span className="action-badge">New</span>
                            </button>
                            <button className="quick-action" onClick={() => { setChatInput('Create social media posts'); }}>
                                <span className="action-icon">📱</span>
                                <span>Social Media Posts</span>
                            </button>
                        </div>
                    </div>
                ) : (
                    chatMessages.map((msg, i) => (
                        <div key={msg.id || i} className={`chat-message chat-message--${msg.role}`}>
                            <div className="chat-message-avatar">
                                {msg.role === 'user' ? '👤' : '✨'}
                            </div>
                            <div className="chat-message-content">{msg.content}</div>
                        </div>
                    ))
                )}
                {chatLoading && (
                    <div className="chat-message chat-message--assistant">
                        <div className="chat-message-avatar">✨</div>
                        <div className="chat-message-content chat-typing">
                            <span /><span /><span />
                        </div>
                    </div>
                )}
            </div>
            <div className="chat-input-container">
                <input
                    type="text"
                    className="chat-input"
                    placeholder="What would you like to create?"
                    value={chatInput}
                    onChange={e => setChatInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                />
                <button
                    className="btn btn-primary chat-send"
                    onClick={handleSendMessage}
                    disabled={chatLoading || !chatInput.trim()}
                >
                    Send
                </button>
            </div>
        </div>
    );

    const renderCampaignsView = () => {
        if (selectedCampaign) {
            return (
                <div className="campaign-detail-view">
                    <div className="campaign-detail-header">
                        <button className="btn btn-ghost" onClick={() => setSelectedCampaign(null)}>
                            ← Back to Campaigns
                        </button>
                        <h2>{selectedCampaign.name}</h2>
                        <span className={`status-badge status-badge--${(selectedCampaign.status || 'draft').toLowerCase()}`}>
                            {selectedCampaign.status || 'Draft'}
                        </span>
                    </div>
                    <div className="campaign-detail-body">
                        <div className="campaign-meta-grid">
                            <div className="meta-card">
                                <span className="meta-label">Goal</span>
                                <span className="meta-value">{selectedCampaign.goal || 'Not set'}</span>
                            </div>
                            <div className="meta-card">
                                <span className="meta-label">Audience</span>
                                <span className="meta-value">{selectedCampaign.target_audience || 'Not set'}</span>
                            </div>
                            <div className="meta-card">
                                <span className="meta-label">Platforms</span>
                                <span className="meta-value">
                                    {(selectedCampaign.platforms || []).join(', ') || 'None'}
                                </span>
                            </div>
                            <div className="meta-card">
                                <span className="meta-label">Assets</span>
                                <span className="meta-value">{selectedCampaign.asset_count ?? '—'}</span>
                            </div>
                        </div>

                        {selectedCampaign.phases && (
                            <div className="campaign-progress-section">
                                <h3>Progress</h3>
                                <ProgressIndicator
                                    phases={selectedCampaign.phases}
                                    currentPhase={selectedCampaign.current_phase}
                                />
                            </div>
                        )}

                        <div className="campaign-actions">
                            <button
                                className="btn btn-primary"
                                onClick={() => handleExecuteCampaign(selectedCampaign)}
                            >
                                Execute Campaign
                            </button>
                            <button
                                className="btn btn-secondary"
                                onClick={() => setShowDeliverables(true)}
                            >
                                📦 Deliverables
                            </button>
                            <button
                                className="btn btn-secondary"
                                onClick={() => { setActiveView('assets'); }}
                            >
                                View Assets
                            </button>
                        </div>
                    </div>
                </div>
            );
        }

        return (
            <div className="campaigns-list-view">
                <div className="view-header">
                    <h2>Campaigns</h2>
                    <button className="btn btn-primary" onClick={() => setShowCreateCampaign(true)}>
                        + New Campaign
                    </button>
                </div>
                {campaigns.length === 0 ? (
                    <div className="empty-state">
                        <span className="empty-icon">📋</span>
                        <h3>No campaigns yet</h3>
                        <p>Create your first campaign to start generating marketing assets.</p>
                        <button className="btn btn-primary" onClick={() => setShowCreateCampaign(true)}>
                            Create Campaign
                        </button>
                    </div>
                ) : (
                    <div className="campaigns-grid">
                        {campaigns.map(c => (
                            <div
                                key={c.id}
                                className="campaign-card"
                                onClick={() => handleSelectCampaign(c)}
                            >
                                <div className="campaign-card-header">
                                    <h3>{c.name}</h3>
                                    <span className={`status-badge status-badge--${(c.status || 'draft').toLowerCase()}`}>
                                        {c.status || 'Draft'}
                                    </span>
                                </div>
                                <p className="campaign-card-goal">{c.goal || 'No goal set'}</p>
                                <div className="campaign-card-footer">
                                    <span className="campaign-card-platforms">
                                        {(c.platforms || []).slice(0, 3).join(', ')}
                                    </span>
                                    <span className="campaign-card-date">
                                        {c.created_at ? new Date(c.created_at).toLocaleDateString() : ''}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        );
    };

    const renderAssetsView = () => (
        <div className="assets-view">
            <div className="view-header">
                <h2>Assets</h2>
            </div>
            <AssetGallery campaignId={selectedCampaign?.id} />
        </div>
    );

    const renderBrandView = () => (
        <div className="brand-view">
            <div className="view-header">
                <h2>Brand Knowledge Base</h2>
            </div>
            {!brandData ? (
                <div className="empty-state">
                    <span className="empty-icon">🎨</span>
                    <h3>Loading brand data...</h3>
                </div>
            ) : (
                <div className="brand-sections">
                    {brandData.brand_identity && (
                        <div className="brand-section-card">
                            <h3>Brand Identity</h3>
                            <p>{brandData.brand_identity.mission || brandData.brand_identity.description || 'N/A'}</p>
                        </div>
                    )}
                    {brandData.target_audience && (
                        <div className="brand-section-card">
                            <h3>Target Audience</h3>
                            <p>{typeof brandData.target_audience === 'string'
                                ? brandData.target_audience
                                : JSON.stringify(brandData.target_audience, null, 2)}</p>
                        </div>
                    )}
                    {brandData.tone_of_voice && (
                        <div className="brand-section-card">
                            <h3>Tone of Voice</h3>
                            <p>{typeof brandData.tone_of_voice === 'string'
                                ? brandData.tone_of_voice
                                : JSON.stringify(brandData.tone_of_voice, null, 2)}</p>
                        </div>
                    )}
                    {brandData.competitors && (
                        <div className="brand-section-card">
                            <h3>Competitors</h3>
                            <p>{Array.isArray(brandData.competitors)
                                ? brandData.competitors.join(', ')
                                : String(brandData.competitors)}</p>
                        </div>
                    )}
                    {brandData.visual_identity && (
                        <div className="brand-section-card">
                            <h3>Visual Identity</h3>
                            <p>{typeof brandData.visual_identity === 'string'
                                ? brandData.visual_identity
                                : JSON.stringify(brandData.visual_identity, null, 2)}</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );

    // Kanban handlers
    const handleTaskMove = useCallback((taskId, newStatus) => {
        setKanbanTasks(prev => prev.map(task =>
            task.id === taskId ? { ...task, status: newStatus } : task
        ));
    }, []);

    const handleAddTask = useCallback((task) => {
        setKanbanTasks(prev => [...prev, { ...task, id: Date.now().toString() }]);
    }, []);

    // Calendar handlers
    const handlePostMove = useCallback((postId, newDate) => {
        setScheduledPosts(prev => prev.map(post =>
            post.id === postId ? { ...post, scheduledAt: newDate.toISOString() } : post
        ));
    }, []);

    const handleAddPost = useCallback((date) => {
        const newPost = {
            id: Date.now().toString(),
            title: 'New Post',
            platform: 'instagram',
            scheduledAt: date.toISOString(),
        };
        setScheduledPosts(prev => [...prev, newPost]);
    }, []);

    // TrendMaster handlers
    const handleCreateBriefFromTrend = useCallback((trendData) => {
        setNewCampaign({
            name: `Campaign: ${trendData.title}`,
            goal: trendData.context,
            target_audience: '',
            platforms: [],
        });
        setShowCreateCampaign(true);
    }, []);

    const renderWorkflowView = () => (
        <div className="workflow-view">
            <KanbanBoard
                tasks={kanbanTasks}
                onTaskMove={handleTaskMove}
                onAddTask={handleAddTask}
                onTaskClick={(task) => console.log('Task clicked:', task)}
                campaignName={selectedCampaign?.name || 'All Campaigns'}
            />
        </div>
    );

    const renderCalendarView = () => (
        <div className="calendar-view">
            <SocialCalendar
                scheduledPosts={scheduledPosts}
                onPostMove={handlePostMove}
                onAddPost={handleAddPost}
                onPostClick={(post) => console.log('Post clicked:', post)}
            />
        </div>
    );

    const renderTrendsView = () => (
        <div className="trends-view">
            <TrendMaster
                onCreateBrief={handleCreateBriefFromTrend}
                onAnalyzeCompetitor={(trend) => console.log('Analyze trend:', trend)}
                onRefresh={() => console.log('Refresh trends')}
            />
        </div>
    );

    const renderImageEditorView = () => (
        <div className="image-editor-view">
            <ConversationalImageEditor
                onSave={(image, format) => console.log('Save image:', format)}
                onExport={(image, format) => console.log('Export image:', format)}
            />
        </div>
    );

    const renderMainContent = () => {
        switch (activeView) {
            case 'chat': return renderChatView();
            case 'campaigns': return renderCampaignsView();
            case 'workflow': return renderWorkflowView();
            case 'calendar': return renderCalendarView();
            case 'trends': return renderTrendsView();
            case 'assets': return renderAssetsView();
            case 'image-editor': return renderImageEditorView();
            case 'brand': return renderBrandView();
            default: return renderChatView();
        }
    };

    const renderContextPanel = () => {
        if (selectedCampaign) {
            return (
                <>
                    <div className="panel-header">
                        <h3>Campaign Details</h3>
                    </div>
                    <div className="panel-content">
                        <div className="context-campaign">
                            <h4>{selectedCampaign.name}</h4>
                            <span className={`status-badge status-badge--${(selectedCampaign.status || 'draft').toLowerCase()}`}>
                                {selectedCampaign.status || 'Draft'}
                            </span>
                            <div className="context-field">
                                <span className="context-label">Goal</span>
                                <span className="context-value">{selectedCampaign.goal || '—'}</span>
                            </div>
                            <div className="context-field">
                                <span className="context-label">Audience</span>
                                <span className="context-value">{selectedCampaign.target_audience || '—'}</span>
                            </div>
                            <div className="context-field">
                                <span className="context-label">Platforms</span>
                                <span className="context-value">
                                    {(selectedCampaign.platforms || []).join(', ') || '—'}
                                </span>
                            </div>
                        </div>
                    </div>
                </>
            );
        }

        if (brandData) {
            return (
                <>
                    <div className="panel-header">
                        <h3>Brand Summary</h3>
                    </div>
                    <div className="panel-content">
                        <div className="context-brand">
                            {brandData.brand_identity?.name && (
                                <h4>{brandData.brand_identity.name}</h4>
                            )}
                            <p className="context-brand-desc">
                                {brandData.brand_identity?.mission || brandData.brand_identity?.description || 'Brand data loaded'}
                            </p>
                        </div>
                    </div>
                </>
            );
        }

        return (
            <>
                <div className="panel-header">
                    <h3>Context</h3>
                </div>
                <div className="panel-content">
                    <p className="panel-empty">
                        Select a campaign or asset to see details here.
                    </p>
                </div>
            </>
        );
    };

    return (
        <div className="dashboard-page">
            {/* Sidebar */}
            <aside className="sidebar">
                <div className="sidebar-header">
                    <span className="logo-icon">✨</span>
                    <span className="logo-text">Marketing Agent</span>
                </div>

                <nav className="sidebar-nav">
                    {NAV_ITEMS.map(item => (
                        <button
                            key={item.key}
                            className={`nav-item${activeView === item.key ? ' active' : ''}`}
                            onClick={() => setActiveView(item.key)}
                        >
                            <span className="nav-icon">{item.icon}</span>
                            <span>{item.label}</span>
                        </button>
                    ))}
                </nav>

                {/* Kata Lab - Premium Feature */}
                <div className="sidebar-kata">
                    <button
                        className="kata-launch-btn"
                        onClick={() => onNavigate('kata-lab')}
                    >
                        <span className="kata-icon">🎭</span>
                        <div className="kata-info">
                            <span className="kata-title">Kata Lab</span>
                            <span className="kata-desc">AI Video Studio</span>
                        </div>
                        <span className="kata-badge">New</span>
                    </button>
                </div>

                {activeView === 'chat' && conversations.length > 0 && (
                    <div className="sidebar-conversations">
                        <h4 className="sidebar-section-title">Recent Conversations</h4>
                        {conversations.slice(0, 5).map(conv => (
                            <button
                                key={conv.id}
                                className={`conversation-item${conversationId === conv.id ? ' active' : ''}`}
                                onClick={() => setConversationId(conv.id)}
                            >
                                {conv.title || 'Untitled'}
                            </button>
                        ))}
                    </div>
                )}

                <div className="sidebar-footer">
                    <button className="btn btn-secondary btn-sm" onClick={onLogout}>
                        Switch Organization
                    </button>
                </div>
            </aside>

            {/* Main content */}
            <main className="main-content">
                {renderMainContent()}
            </main>

            {/* Right panel (context) */}
            <aside className="context-panel">
                {renderContextPanel()}
            </aside>

            {/* Create Campaign Modal */}
            {showCreateCampaign && (
                <div className="modal-overlay" onClick={() => setShowCreateCampaign(false)}>
                    <div className="modal" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>Create Campaign</h2>
                            <button className="modal-close" onClick={() => setShowCreateCampaign(false)}>
                                &times;
                            </button>
                        </div>
                        <div className="modal-body">
                            <div className="form-group">
                                <label className="form-label">Campaign Name</label>
                                <input
                                    className="form-input"
                                    placeholder="e.g. Summer Product Launch"
                                    value={newCampaign.name}
                                    onChange={e => setNewCampaign(prev => ({ ...prev, name: e.target.value }))}
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Goal</label>
                                <textarea
                                    className="form-input form-textarea"
                                    placeholder="What do you want to achieve?"
                                    value={newCampaign.goal}
                                    onChange={e => setNewCampaign(prev => ({ ...prev, goal: e.target.value }))}
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Target Audience</label>
                                <input
                                    className="form-input"
                                    placeholder="e.g. Tech-savvy millennials"
                                    value={newCampaign.target_audience}
                                    onChange={e => setNewCampaign(prev => ({ ...prev, target_audience: e.target.value }))}
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Platforms</label>
                                <div className="platform-chips">
                                    {['Instagram', 'Twitter', 'LinkedIn', 'Email', 'Blog', 'Facebook'].map(p => (
                                        <button
                                            key={p}
                                            className={`platform-chip${newCampaign.platforms.includes(p) ? ' selected' : ''}`}
                                            onClick={() => togglePlatform(p)}
                                            type="button"
                                        >
                                            {p}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button className="btn btn-secondary" onClick={() => setShowCreateCampaign(false)}>
                                Cancel
                            </button>
                            <button
                                className="btn btn-primary"
                                onClick={handleCreateCampaign}
                                disabled={loading || !newCampaign.name.trim()}
                            >
                                {loading ? 'Creating...' : 'Create Campaign'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Execution Overlay */}
            {showExecution && (
                <div className="modal-overlay" onClick={handleCloseExecution}>
                    <div className="modal modal--wide" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>Campaign Execution</h2>
                            <button className="modal-close" onClick={handleCloseExecution}>
                                &times;
                            </button>
                        </div>
                        <div className="modal-body">
                            <div className="execution-status">
                                <ProgressIndicator
                                    phases={executionPhases}
                                    currentPhase={executionCurrentPhase}
                                />
                                <p className="execution-message">
                                    {executionMessage || `Executing ${selectedCampaign?.name || 'campaign'}...`}
                                </p>
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button className="btn btn-secondary" onClick={handleCloseExecution}>
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Deliverables Sliding Panel */}
            <SlidingDeliverablesPanel
                isOpen={showDeliverables}
                onClose={() => setShowDeliverables(false)}
                deliverables={deliverables}
                onSelect={(id) => console.log('Selected deliverable:', id)}
                onSave={(deliverable) => {
                    setDeliverables(prev => prev.map(d =>
                        d.id === deliverable.id ? deliverable : d
                    ));
                }}
                onGenerate={async (action, text, type) => {
                    console.log('AI action:', action, text, type);
                    return text;
                }}
                campaignName={selectedCampaign?.name || 'Campaign'}
            />
        </div>
    );
}

export default DashboardPage;
