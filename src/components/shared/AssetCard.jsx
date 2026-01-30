import React from 'react';
import './AssetCard.css';

const TYPE_ICONS = {
    copy: '✍️',
    image: '🖼️',
    video: '🎬',
    email: '📧',
    social: '📱',
    blog: '📝',
    ad: '📢',
    landing_page: '🌐',
};

function AssetCard({ asset, onClick }) {
    const icon = TYPE_ICONS[asset.type] || '📄';
    const status = asset.status || 'draft';

    return (
        <div className="asset-card" onClick={onClick}>
            <div className="asset-card-icon">{icon}</div>
            <div className="asset-card-body">
                <h4 className="asset-card-name">{asset.name || 'Untitled Asset'}</h4>
                <div className="asset-card-row">
                    <span className={`asset-card-status asset-card-status--${status.toLowerCase()}`}>
                        {status}
                    </span>
                    {asset.platform && (
                        <span className="asset-card-platform">{asset.platform}</span>
                    )}
                </div>
            </div>
            <div className="asset-card-version">v{asset.version ?? 1}</div>
        </div>
    );
}

export default AssetCard;
