import React from 'react';
import './OnboardingProgress.css';

const STAGE_LABELS = {
    initializing: 'Setting up',
    crawling_website: 'Analyzing website',
    analyzing_brand: 'Extracting brand identity',
    researching_market: 'Researching market',
    researching_audience: 'Identifying audience',
    synthesizing: 'Synthesizing insights',
    generating_profile: 'Generating profile',
    complete: 'Complete',
};

function OnboardingProgress({ progress }) {
    const stageLabel = STAGE_LABELS[progress.stage] || 'Working';
    const percentage = Math.round(progress.progress * 100);

    return (
        <div className="onboarding-progress animate-fadeIn">
            <div className="progress-content">
                <h2>Analyzing your brand</h2>

                <div className="progress-status">
                    <span className="status-label">{stageLabel}</span>
                    <span className="status-percent">{percentage}%</span>
                </div>

                <div className="progress-bar-track">
                    <div
                        className="progress-bar-fill"
                        style={{ width: `${percentage}%` }}
                    />
                </div>

                {progress.message && (
                    <p className="progress-message">{progress.message}</p>
                )}
            </div>
        </div>
    );
}

export default OnboardingProgress;
