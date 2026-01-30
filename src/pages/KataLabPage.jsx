import React, { useState } from 'react';
import SyntheticInfluencerCreator from '../components/kata/SyntheticInfluencerCreator';
import VideoCompositor from '../components/kata/VideoCompositor';
import ScriptBuilder from '../components/kata/ScriptBuilder';
import KataPreview from '../components/kata/KataPreview';
import '../styles/kata-lab.css';

function KataLabPage({ organizationId, onBack }) {
    const [activeMode, setActiveMode] = useState('influencer'); // influencer, compositor, script
    const [currentJob, setCurrentJob] = useState(null);
    const [generatedContent, setGeneratedContent] = useState(null);

    const modes = [
        {
            id: 'influencer',
            name: 'Synthetic Influencer',
            icon: '👤',
            description: 'Create AI influencers with your products'
        },
        {
            id: 'compositor',
            name: 'Video Compositor',
            icon: '🎬',
            description: 'Merge videos, add products, create mashups'
        },
        {
            id: 'script',
            name: 'Script Builder',
            icon: '📝',
            description: 'AI-assisted script writing'
        }
    ];

    const handleJobCreated = (job) => {
        setCurrentJob(job);
        // Start polling for job status
        pollJobStatus(job.job_id);
    };

    const pollJobStatus = async (jobId) => {
        const interval = setInterval(async () => {
            try {
                const response = await fetch(`/api/kata/jobs/${jobId}`);
                const data = await response.json();

                setCurrentJob(data);

                if (data.status === 'completed') {
                    clearInterval(interval);
                    setGeneratedContent(data.result);
                } else if (data.status === 'failed') {
                    clearInterval(interval);
                }
            } catch (error) {
                console.error('Error polling job status:', error);
            }
        }, 2000);
    };

    const handleReset = () => {
        setCurrentJob(null);
        setGeneratedContent(null);
    };

    return (
        <div className="kata-lab-page">
            <header className="kata-header">
                <button className="back-button" onClick={onBack}>
                    ← Back to Dashboard
                </button>
                <div className="kata-title">
                    <h1>🎭 Kata Lab</h1>
                    <p>AI-Powered Content Creation Studio</p>
                </div>
            </header>

            <div className="kata-content">
                {/* Mode Selection */}
                <div className="mode-selector">
                    {modes.map(mode => (
                        <button
                            key={mode.id}
                            className={`mode-button ${activeMode === mode.id ? 'active' : ''}`}
                            onClick={() => {
                                setActiveMode(mode.id);
                                handleReset();
                            }}
                        >
                            <span className="mode-icon">{mode.icon}</span>
                            <span className="mode-name">{mode.name}</span>
                            <span className="mode-desc">{mode.description}</span>
                        </button>
                    ))}
                </div>

                <div className="kata-workspace">
                    {/* Left Panel - Creator */}
                    <div className="creator-panel">
                        {activeMode === 'influencer' && (
                            <SyntheticInfluencerCreator
                                organizationId={organizationId}
                                onJobCreated={handleJobCreated}
                                disabled={currentJob && currentJob.status === 'processing'}
                            />
                        )}
                        {activeMode === 'compositor' && (
                            <VideoCompositor
                                organizationId={organizationId}
                                onJobCreated={handleJobCreated}
                                disabled={currentJob && currentJob.status === 'processing'}
                            />
                        )}
                        {activeMode === 'script' && (
                            <ScriptBuilder
                                organizationId={organizationId}
                                onScriptGenerated={(script) => setGeneratedContent({ script })}
                            />
                        )}
                    </div>

                    {/* Right Panel - Preview */}
                    <div className="preview-panel">
                        <KataPreview
                            job={currentJob}
                            content={generatedContent}
                            onReset={handleReset}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}

export default KataLabPage;
