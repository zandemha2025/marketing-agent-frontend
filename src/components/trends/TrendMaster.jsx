import React, { useState, useCallback, useEffect } from 'react';
import './TrendMaster.css';

/**
 * TrendMaster - AI-powered trend analysis and opportunity discovery.
 *
 * Features:
 * - Real-time trend monitoring
 * - Competitor activity tracking
 * - Industry news aggregation
 * - Opportunity scoring and recommendations
 * - One-click campaign brief generation from trends
 */

const TREND_CATEGORIES = [
    { key: 'all', label: 'All Trends', icon: '🔥' },
    { key: 'industry', label: 'Industry', icon: '🏭' },
    { key: 'social', label: 'Social Media', icon: '📱' },
    { key: 'competitor', label: 'Competitors', icon: '🎯' },
    { key: 'consumer', label: 'Consumer', icon: '👥' },
    { key: 'tech', label: 'Technology', icon: '💻' },
];

const TREND_TIMEFRAMES = [
    { key: '24h', label: 'Last 24h' },
    { key: '7d', label: 'Last 7 days' },
    { key: '30d', label: 'Last 30 days' },
    { key: '90d', label: 'Last quarter' },
];

// Mock data - in real app, this comes from backend
const MOCK_TRENDS = [
    {
        id: 't1',
        title: 'AI-Generated Content Goes Mainstream',
        description: 'Brands are increasingly using AI tools for content creation, with 73% of marketers planning to increase AI tool usage.',
        category: 'tech',
        score: 95,
        change: '+23%',
        sentiment: 'positive',
        sources: ['Marketing Week', 'AdAge', 'HubSpot'],
        relevance: 'high',
        actionable: true,
        opportunities: [
            'Create AI-assisted content workflow',
            'Highlight human creativity as differentiator',
            'Develop AI transparency guidelines'
        ],
    },
    {
        id: 't2',
        title: 'Short-Form Video Dominates Engagement',
        description: 'TikTok and Instagram Reels are driving 2.5x more engagement than static content across all demographics.',
        category: 'social',
        score: 92,
        change: '+18%',
        sentiment: 'positive',
        sources: ['Social Media Today', 'Sprout Social'],
        relevance: 'high',
        actionable: true,
        opportunities: [
            'Develop 15-second brand storytelling',
            'Create behind-the-scenes content series',
            'Partner with micro-influencers'
        ],
    },
    {
        id: 't3',
        title: 'Privacy-First Marketing Strategies',
        description: 'With cookie deprecation, brands are pivoting to first-party data and contextual advertising.',
        category: 'industry',
        score: 88,
        change: '+31%',
        sentiment: 'neutral',
        sources: ['AdExchanger', 'Digiday'],
        relevance: 'high',
        actionable: true,
        opportunities: [
            'Build email list incentive programs',
            'Develop loyalty app with data exchange',
            'Invest in contextual targeting'
        ],
    },
    {
        id: 't4',
        title: 'Competitor X Launches Sustainability Campaign',
        description: 'Major competitor announced carbon-neutral goals and sustainability-focused product line.',
        category: 'competitor',
        score: 85,
        change: 'New',
        sentiment: 'neutral',
        sources: ['PRNewswire', 'Industry Reports'],
        relevance: 'critical',
        actionable: true,
        opportunities: [
            'Audit own sustainability messaging',
            'Accelerate ESG initiatives communication',
            'Counter-position with authenticity'
        ],
    },
    {
        id: 't5',
        title: 'Gen Z Values Authenticity Over Polish',
        description: 'Research shows Gen Z consumers prefer raw, authentic content over highly produced brand messaging.',
        category: 'consumer',
        score: 79,
        change: '+12%',
        sentiment: 'positive',
        sources: ['Pew Research', 'Morning Consult'],
        relevance: 'medium',
        actionable: true,
        opportunities: [
            'Test lo-fi content formats',
            'Feature real employees and customers',
            'Embrace imperfection in storytelling'
        ],
    },
];

export default function TrendMaster({
    onCreateBrief,
    onAnalyzeCompetitor,
    onRefresh,
    isLoading = false,
    customTrends = null,
}) {
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [selectedTimeframe, setSelectedTimeframe] = useState('7d');
    const [expandedTrend, setExpandedTrend] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [trends, setTrends] = useState(customTrends || MOCK_TRENDS);

    useEffect(() => {
        if (customTrends) {
            setTrends(customTrends);
        }
    }, [customTrends]);

    const filteredTrends = trends.filter(trend => {
        const matchesCategory = selectedCategory === 'all' || trend.category === selectedCategory;
        const matchesSearch = !searchQuery ||
            trend.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            trend.description.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesCategory && matchesSearch;
    });

    const handleCreateBriefFromTrend = useCallback((trend) => {
        if (onCreateBrief) {
            onCreateBrief({
                source: 'trend',
                trendId: trend.id,
                title: trend.title,
                context: trend.description,
                opportunities: trend.opportunities,
            });
        }
    }, [onCreateBrief]);

    const getScoreColor = (score) => {
        if (score >= 90) return '#10b981';
        if (score >= 75) return '#f59e0b';
        if (score >= 50) return '#6366f1';
        return '#666';
    };

    const getSentimentIcon = (sentiment) => {
        switch (sentiment) {
            case 'positive': return '📈';
            case 'negative': return '📉';
            default: return '➡️';
        }
    };

    const getRelevanceBadge = (relevance) => {
        switch (relevance) {
            case 'critical': return { label: 'Critical', color: '#ef4444' };
            case 'high': return { label: 'High', color: '#f59e0b' };
            case 'medium': return { label: 'Medium', color: '#6366f1' };
            default: return { label: 'Low', color: '#666' };
        }
    };

    return (
        <div className="trend-master">
            {/* Header */}
            <div className="trend-master__header">
                <div className="trend-master__title">
                    <h2>🔥 TrendMaster</h2>
                    <span className="trend-master__subtitle">AI-Powered Trend Intelligence</span>
                </div>
                <div className="trend-master__actions">
                    <button
                        className="trend-master__refresh"
                        onClick={onRefresh}
                        disabled={isLoading}
                    >
                        {isLoading ? '🔄 Updating...' : '🔄 Refresh'}
                    </button>
                </div>
            </div>

            {/* Search and Filters */}
            <div className="trend-master__filters">
                <div className="trend-master__search">
                    <span className="search-icon">🔍</span>
                    <input
                        type="text"
                        placeholder="Search trends..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>

                <div className="trend-master__timeframe">
                    {TREND_TIMEFRAMES.map(tf => (
                        <button
                            key={tf.key}
                            className={`timeframe-btn ${selectedTimeframe === tf.key ? 'timeframe-btn--active' : ''}`}
                            onClick={() => setSelectedTimeframe(tf.key)}
                        >
                            {tf.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Category Tabs */}
            <div className="trend-master__categories">
                {TREND_CATEGORIES.map(cat => (
                    <button
                        key={cat.key}
                        className={`category-tab ${selectedCategory === cat.key ? 'category-tab--active' : ''}`}
                        onClick={() => setSelectedCategory(cat.key)}
                    >
                        <span>{cat.icon}</span>
                        <span>{cat.label}</span>
                    </button>
                ))}
            </div>

            {/* Trends List */}
            <div className="trend-master__content">
                {isLoading ? (
                    <div className="trend-master__loading">
                        <div className="loading-spinner" />
                        <p>Analyzing trends across your industry...</p>
                    </div>
                ) : filteredTrends.length === 0 ? (
                    <div className="trend-master__empty">
                        <span className="empty-icon">🔍</span>
                        <p>No trends found matching your criteria</p>
                    </div>
                ) : (
                    <div className="trends-list">
                        {filteredTrends.map(trend => {
                            const isExpanded = expandedTrend === trend.id;
                            const relevanceBadge = getRelevanceBadge(trend.relevance);

                            return (
                                <div
                                    key={trend.id}
                                    className={`trend-card ${isExpanded ? 'trend-card--expanded' : ''}`}
                                >
                                    {/* Trend Header */}
                                    <div
                                        className="trend-card__header"
                                        onClick={() => setExpandedTrend(isExpanded ? null : trend.id)}
                                    >
                                        <div className="trend-card__score" style={{ borderColor: getScoreColor(trend.score) }}>
                                            <span className="score-value">{trend.score}</span>
                                        </div>

                                        <div className="trend-card__info">
                                            <h3 className="trend-card__title">{trend.title}</h3>
                                            <p className="trend-card__description">{trend.description}</p>

                                            <div className="trend-card__meta">
                                                <span
                                                    className="trend-card__relevance"
                                                    style={{ backgroundColor: relevanceBadge.color }}
                                                >
                                                    {relevanceBadge.label}
                                                </span>
                                                <span className="trend-card__change">
                                                    {getSentimentIcon(trend.sentiment)} {trend.change}
                                                </span>
                                                <span className="trend-card__sources">
                                                    📰 {trend.sources.length} sources
                                                </span>
                                            </div>
                                        </div>

                                        <div className="trend-card__expand">
                                            <span className={`expand-icon ${isExpanded ? 'expanded' : ''}`}>▼</span>
                                        </div>
                                    </div>

                                    {/* Expanded Content */}
                                    {isExpanded && (
                                        <div className="trend-card__body">
                                            <div className="trend-card__section">
                                                <h4>💡 Opportunities</h4>
                                                <ul className="opportunity-list">
                                                    {trend.opportunities.map((opp, idx) => (
                                                        <li key={idx}>{opp}</li>
                                                    ))}
                                                </ul>
                                            </div>

                                            <div className="trend-card__section">
                                                <h4>📰 Sources</h4>
                                                <div className="sources-list">
                                                    {trend.sources.map((source, idx) => (
                                                        <span key={idx} className="source-tag">{source}</span>
                                                    ))}
                                                </div>
                                            </div>

                                            <div className="trend-card__actions">
                                                <button
                                                    className="trend-action-btn trend-action-btn--primary"
                                                    onClick={() => handleCreateBriefFromTrend(trend)}
                                                >
                                                    ✨ Create Campaign Brief
                                                </button>
                                                <button
                                                    className="trend-action-btn"
                                                    onClick={() => onAnalyzeCompetitor?.(trend)}
                                                >
                                                    🎯 Deep Analysis
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Quick Stats */}
            <div className="trend-master__stats">
                <div className="stat-item">
                    <span className="stat-value">{trends.length}</span>
                    <span className="stat-label">Active Trends</span>
                </div>
                <div className="stat-item">
                    <span className="stat-value">{trends.filter(t => t.relevance === 'high' || t.relevance === 'critical').length}</span>
                    <span className="stat-label">High Priority</span>
                </div>
                <div className="stat-item">
                    <span className="stat-value">{trends.filter(t => t.actionable).length}</span>
                    <span className="stat-label">Actionable</span>
                </div>
            </div>
        </div>
    );
}
