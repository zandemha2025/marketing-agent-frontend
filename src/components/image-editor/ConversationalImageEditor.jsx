import React, { useState, useCallback, useRef, useEffect } from 'react';
import './ConversationalImageEditor.css';

/**
 * ConversationalImageEditor - AI-powered image editing with natural language.
 *
 * Features:
 * - Natural language editing commands
 * - Real-time preview
 * - Version history
 * - Quick preset adjustments
 * - Export in multiple formats
 */

const QUICK_ACTIONS = [
    { key: 'remove-bg', label: 'Remove Background', icon: '✂️', prompt: 'Remove the background' },
    { key: 'enhance', label: 'Enhance Quality', icon: '✨', prompt: 'Enhance image quality and clarity' },
    { key: 'resize-social', label: 'Resize for Social', icon: '📐', prompt: 'Resize to Instagram square (1080x1080)' },
    { key: 'add-text', label: 'Add Text', icon: '🔤', prompt: 'Add promotional text overlay' },
    { key: 'filters', label: 'Apply Filter', icon: '🎨', prompt: 'Apply a professional marketing filter' },
    { key: 'crop', label: 'Smart Crop', icon: '⬜', prompt: 'Crop to focus on the main subject' },
];

const EXPORT_FORMATS = [
    { key: 'png', label: 'PNG', description: 'Lossless, transparent background' },
    { key: 'jpg', label: 'JPG', description: 'Smaller file size' },
    { key: 'webp', label: 'WebP', description: 'Modern web format' },
];

const SOCIAL_PRESETS = [
    { key: 'ig-square', label: 'Instagram Square', size: '1080x1080' },
    { key: 'ig-story', label: 'Instagram Story', size: '1080x1920' },
    { key: 'fb-post', label: 'Facebook Post', size: '1200x630' },
    { key: 'twitter', label: 'Twitter Post', size: '1200x675' },
    { key: 'linkedin', label: 'LinkedIn Post', size: '1200x627' },
    { key: 'youtube', label: 'YouTube Thumbnail', size: '1280x720' },
];

export default function ConversationalImageEditor({
    initialImage = null,
    onSave,
    onExport,
    onAIEdit,
    isProcessing = false,
}) {
    const [image, setImage] = useState(initialImage);
    const [prompt, setPrompt] = useState('');
    const [history, setHistory] = useState([]);
    const [currentVersion, setCurrentVersion] = useState(0);
    const [selectedPreset, setSelectedPreset] = useState(null);
    const [showExportModal, setShowExportModal] = useState(false);
    const [chatMessages, setChatMessages] = useState([]);
    const [isDragging, setIsDragging] = useState(false);
    const fileInputRef = useRef(null);
    const chatEndRef = useRef(null);

    // Scroll chat to bottom on new messages
    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [chatMessages]);

    const handleImageUpload = useCallback((file) => {
        if (!file || !file.type.startsWith('image/')) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            const newImage = e.target.result;
            setImage(newImage);
            setHistory([newImage]);
            setCurrentVersion(0);
            setChatMessages([
                {
                    role: 'assistant',
                    content: 'Great! I\'ve loaded your image. What would you like me to do with it? You can describe any edit in natural language, like "remove the background" or "make it look more vibrant".',
                }
            ]);
        };
        reader.readAsDataURL(file);
    }, []);

    const handleDrop = useCallback((e) => {
        e.preventDefault();
        setIsDragging(false);
        const file = e.dataTransfer.files[0];
        handleImageUpload(file);
    }, [handleImageUpload]);

    const handleDragOver = useCallback((e) => {
        e.preventDefault();
        setIsDragging(true);
    }, []);

    const handleDragLeave = useCallback((e) => {
        e.preventDefault();
        setIsDragging(false);
    }, []);

    const handleFileSelect = useCallback((e) => {
        const file = e.target.files[0];
        handleImageUpload(file);
    }, [handleImageUpload]);

    const handleSendPrompt = useCallback(async () => {
        if (!prompt.trim() || !image) return;

        const userMessage = prompt.trim();
        setPrompt('');

        // Add user message to chat
        setChatMessages(prev => [...prev, {
            role: 'user',
            content: userMessage,
        }]);

        // Call AI edit function
        if (onAIEdit) {
            try {
                const result = await onAIEdit(image, userMessage);

                // Add AI response
                setChatMessages(prev => [...prev, {
                    role: 'assistant',
                    content: result.message || 'Done! I\'ve applied your edit. What else would you like to change?',
                }]);

                // Update image if edit was successful
                if (result.image) {
                    const newHistory = [...history.slice(0, currentVersion + 1), result.image];
                    setHistory(newHistory);
                    setCurrentVersion(newHistory.length - 1);
                    setImage(result.image);
                }
            } catch (error) {
                setChatMessages(prev => [...prev, {
                    role: 'assistant',
                    content: 'Sorry, I couldn\'t process that edit. Could you try rephrasing your request?',
                    isError: true,
                }]);
            }
        } else {
            // Simulate AI response for demo
            setChatMessages(prev => [...prev, {
                role: 'assistant',
                content: `I'll "${userMessage}". (AI editing requires backend integration)`,
            }]);
        }
    }, [prompt, image, onAIEdit, history, currentVersion]);

    const handleQuickAction = useCallback((action) => {
        setPrompt(action.prompt);
        // Auto-send after a brief delay
        setTimeout(() => {
            setChatMessages(prev => [...prev, {
                role: 'user',
                content: action.prompt,
            }]);

            if (onAIEdit) {
                // Would call AI here
            }

            setChatMessages(prev => [...prev, {
                role: 'assistant',
                content: `Applying "${action.label}"... (AI integration required for actual edits)`,
            }]);
        }, 100);
        setPrompt('');
    }, [onAIEdit]);

    const handleUndo = useCallback(() => {
        if (currentVersion > 0) {
            setCurrentVersion(currentVersion - 1);
            setImage(history[currentVersion - 1]);
        }
    }, [currentVersion, history]);

    const handleRedo = useCallback(() => {
        if (currentVersion < history.length - 1) {
            setCurrentVersion(currentVersion + 1);
            setImage(history[currentVersion + 1]);
        }
    }, [currentVersion, history]);

    const handleExport = useCallback((format) => {
        if (onExport) {
            onExport(image, format);
        }
        setShowExportModal(false);
    }, [image, onExport]);

    const handlePresetSelect = useCallback((preset) => {
        setSelectedPreset(preset);
        setPrompt(`Resize to ${preset.size} (${preset.label})`);
    }, []);

    return (
        <div className="conversational-image-editor">
            {/* Header */}
            <div className="cie-header">
                <div className="cie-header__title">
                    <h2>🎨 AI Image Editor</h2>
                    <span className="cie-header__subtitle">Edit with natural language</span>
                </div>
                <div className="cie-header__actions">
                    {image && (
                        <>
                            <button
                                className="cie-btn"
                                onClick={handleUndo}
                                disabled={currentVersion === 0}
                                title="Undo"
                            >
                                ↩️ Undo
                            </button>
                            <button
                                className="cie-btn"
                                onClick={handleRedo}
                                disabled={currentVersion >= history.length - 1}
                                title="Redo"
                            >
                                ↪️ Redo
                            </button>
                            <button
                                className="cie-btn cie-btn--primary"
                                onClick={() => setShowExportModal(true)}
                            >
                                📥 Export
                            </button>
                        </>
                    )}
                </div>
            </div>

            <div className="cie-main">
                {/* Image Canvas */}
                <div className="cie-canvas">
                    {!image ? (
                        <div
                            className={`cie-upload-zone ${isDragging ? 'cie-upload-zone--dragging' : ''}`}
                            onDrop={handleDrop}
                            onDragOver={handleDragOver}
                            onDragLeave={handleDragLeave}
                            onClick={() => fileInputRef.current?.click()}
                        >
                            <div className="cie-upload-zone__icon">🖼️</div>
                            <h3>Drop image here or click to upload</h3>
                            <p>Supports PNG, JPG, WebP up to 10MB</p>
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*"
                                onChange={handleFileSelect}
                                hidden
                            />
                        </div>
                    ) : (
                        <div className="cie-image-container">
                            <img
                                src={image}
                                alt="Editing"
                                className={`cie-image ${isProcessing ? 'cie-image--processing' : ''}`}
                            />
                            {isProcessing && (
                                <div className="cie-processing-overlay">
                                    <div className="cie-spinner" />
                                    <span>Processing...</span>
                                </div>
                            )}
                            <div className="cie-image-info">
                                Version {currentVersion + 1} of {history.length}
                            </div>
                        </div>
                    )}
                </div>

                {/* Chat/Controls Panel */}
                <div className="cie-panel">
                    {/* Quick Actions */}
                    <div className="cie-quick-actions">
                        <h4>Quick Actions</h4>
                        <div className="cie-quick-actions__grid">
                            {QUICK_ACTIONS.map(action => (
                                <button
                                    key={action.key}
                                    className="cie-quick-action"
                                    onClick={() => handleQuickAction(action)}
                                    disabled={!image || isProcessing}
                                >
                                    <span className="cie-quick-action__icon">{action.icon}</span>
                                    <span className="cie-quick-action__label">{action.label}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Social Presets */}
                    <div className="cie-presets">
                        <h4>Social Media Sizes</h4>
                        <div className="cie-presets__list">
                            {SOCIAL_PRESETS.map(preset => (
                                <button
                                    key={preset.key}
                                    className={`cie-preset ${selectedPreset?.key === preset.key ? 'cie-preset--selected' : ''}`}
                                    onClick={() => handlePresetSelect(preset)}
                                    disabled={!image}
                                >
                                    <span className="cie-preset__label">{preset.label}</span>
                                    <span className="cie-preset__size">{preset.size}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Chat Interface */}
                    <div className="cie-chat">
                        <div className="cie-chat__messages">
                            {chatMessages.length === 0 ? (
                                <div className="cie-chat__welcome">
                                    <span className="cie-chat__welcome-icon">💬</span>
                                    <p>Upload an image to start editing with AI</p>
                                </div>
                            ) : (
                                chatMessages.map((msg, idx) => (
                                    <div
                                        key={idx}
                                        className={`cie-message cie-message--${msg.role} ${msg.isError ? 'cie-message--error' : ''}`}
                                    >
                                        {msg.content}
                                    </div>
                                ))
                            )}
                            <div ref={chatEndRef} />
                        </div>

                        <div className="cie-chat__input">
                            <input
                                type="text"
                                placeholder={image ? 'Describe your edit...' : 'Upload an image first'}
                                value={prompt}
                                onChange={(e) => setPrompt(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleSendPrompt()}
                                disabled={!image || isProcessing}
                            />
                            <button
                                className="cie-chat__send"
                                onClick={handleSendPrompt}
                                disabled={!image || !prompt.trim() || isProcessing}
                            >
                                ✨
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Export Modal */}
            {showExportModal && (
                <div className="cie-modal-overlay" onClick={() => setShowExportModal(false)}>
                    <div className="cie-modal" onClick={e => e.stopPropagation()}>
                        <h3>Export Image</h3>
                        <div className="cie-export-formats">
                            {EXPORT_FORMATS.map(format => (
                                <button
                                    key={format.key}
                                    className="cie-export-option"
                                    onClick={() => handleExport(format.key)}
                                >
                                    <span className="cie-export-option__label">{format.label}</span>
                                    <span className="cie-export-option__desc">{format.description}</span>
                                </button>
                            ))}
                        </div>
                        <button
                            className="cie-modal__close"
                            onClick={() => setShowExportModal(false)}
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
