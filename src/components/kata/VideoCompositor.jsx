import React, { useState, useRef } from 'react';

function VideoCompositor({ organizationId, onJobCreated, disabled }) {
    const [mode, setMode] = useState('merge'); // merge, product, ugc
    const [videos, setVideos] = useState([]);
    const [productImage, setProductImage] = useState(null);
    const [mergeStyle, setMergeStyle] = useState('blend');
    const [targetPlatform, setTargetPlatform] = useState('tiktok');
    const [ugcIntensity, setUgcIntensity] = useState(0.5);
    const [isGenerating, setIsGenerating] = useState(false);
    const videoInputRef = useRef(null);
    const productInputRef = useRef(null);

    const compositorModes = [
        {
            id: 'merge',
            name: 'Video Merge',
            icon: '🎬',
            desc: 'Blend two videos together (movies, clips, etc.)'
        },
        {
            id: 'product',
            name: 'Product Placement',
            icon: '📦',
            desc: 'Add product into existing video'
        },
        {
            id: 'ugc',
            name: 'UGC Styling',
            icon: '📱',
            desc: 'Make content look authentic & user-generated'
        }
    ];

    const mergeStyles = [
        { id: 'blend', name: 'Seamless Blend', desc: 'Smooth transition between clips' },
        { id: 'overlay', name: 'Overlay', desc: 'One video over another' },
        { id: 'split_screen', name: 'Split Screen', desc: 'Side by side comparison' },
        { id: 'picture_in_picture', name: 'Picture in Picture', desc: 'Small video in corner' },
        { id: 'morph', name: 'Morph', desc: 'One scene morphs into another' }
    ];

    const platforms = [
        { id: 'tiktok', name: 'TikTok', res: '1080x1920' },
        { id: 'instagram', name: 'Instagram', res: '1080x1920' },
        { id: 'youtube', name: 'YouTube', res: '1920x1080' },
        { id: 'twitter', name: 'Twitter/X', res: '1280x720' }
    ];

    const handleVideoUpload = (e) => {
        const files = Array.from(e.target.files);
        const newVideos = files.map(file => ({
            file,
            preview: URL.createObjectURL(file),
            name: file.name
        }));

        if (mode === 'merge') {
            setVideos([...videos.slice(0, 1), ...newVideos].slice(0, 2));
        } else {
            setVideos(newVideos.slice(0, 1));
        }
    };

    const handleProductUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            setProductImage({
                file,
                preview: URL.createObjectURL(file),
                name: file.name
            });
        }
    };

    const removeVideo = (index) => {
        const updated = [...videos];
        URL.revokeObjectURL(updated[index].preview);
        updated.splice(index, 1);
        setVideos(updated);
    };

    const handleGenerate = async () => {
        setIsGenerating(true);

        try {
            let endpoint = '';
            let payload = {};

            if (mode === 'merge') {
                endpoint = '/api/kata/merge-videos';
                payload = {
                    video_path_1: videos[0]?.name,
                    video_path_2: videos[1]?.name,
                    merge_style: mergeStyle,
                    target_resolution: platforms.find(p => p.id === targetPlatform)?.res
                };
            } else if (mode === 'product') {
                endpoint = '/api/kata/composite-product';
                payload = {
                    video_path: videos[0]?.name,
                    product_image_path: productImage?.name,
                    product_description: 'Product placement',
                    target_platform: targetPlatform
                };
            } else if (mode === 'ugc') {
                endpoint = '/api/kata/ugc-style';
                payload = {
                    video_path: videos[0]?.name,
                    intensity: ugcIntensity,
                    target_platform: targetPlatform
                };
            }

            const response = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            const data = await response.json();
            onJobCreated(data);
        } catch (error) {
            console.error('Error in compositor:', error);
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <div className="video-compositor">
            {/* Mode Selection */}
            <div className="compositor-modes">
                {compositorModes.map(m => (
                    <button
                        key={m.id}
                        className={`mode-btn ${mode === m.id ? 'active' : ''}`}
                        onClick={() => {
                            setMode(m.id);
                            setVideos([]);
                            setProductImage(null);
                        }}
                    >
                        <span className="mode-icon">{m.icon}</span>
                        <div className="mode-info">
                            <span className="mode-name">{m.name}</span>
                            <span className="mode-desc">{m.desc}</span>
                        </div>
                    </button>
                ))}
            </div>

            {/* Video Merge Mode */}
            {mode === 'merge' && (
                <div className="merge-mode">
                    <h3>🎬 Video Merge</h3>
                    <p className="mode-helper">
                        Perfect for movie mashups, scene transitions, or combining two clips into one.
                    </p>

                    <div className="video-slots">
                        <div className="video-slot">
                            <h4>Video 1</h4>
                            {videos[0] ? (
                                <div className="video-preview">
                                    <video src={videos[0].preview} controls />
                                    <button className="remove-btn" onClick={() => removeVideo(0)}>×</button>
                                </div>
                            ) : (
                                <div
                                    className="upload-slot"
                                    onClick={() => videoInputRef.current?.click()}
                                >
                                    <span>📹</span>
                                    <span>Upload first video</span>
                                </div>
                            )}
                        </div>

                        <div className="merge-indicator">
                            <span>+</span>
                        </div>

                        <div className="video-slot">
                            <h4>Video 2</h4>
                            {videos[1] ? (
                                <div className="video-preview">
                                    <video src={videos[1].preview} controls />
                                    <button className="remove-btn" onClick={() => removeVideo(1)}>×</button>
                                </div>
                            ) : (
                                <div
                                    className="upload-slot"
                                    onClick={() => videoInputRef.current?.click()}
                                >
                                    <span>📹</span>
                                    <span>Upload second video</span>
                                </div>
                            )}
                        </div>
                    </div>

                    <input
                        ref={videoInputRef}
                        type="file"
                        accept="video/*"
                        onChange={handleVideoUpload}
                        style={{ display: 'none' }}
                    />

                    <div className="merge-styles">
                        <label>Merge Style</label>
                        <div className="style-options">
                            {mergeStyles.map(style => (
                                <div
                                    key={style.id}
                                    className={`style-option ${mergeStyle === style.id ? 'selected' : ''}`}
                                    onClick={() => setMergeStyle(style.id)}
                                >
                                    <span className="style-name">{style.name}</span>
                                    <span className="style-desc">{style.desc}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Product Placement Mode */}
            {mode === 'product' && (
                <div className="product-mode">
                    <h3>📦 Product Placement</h3>
                    <p className="mode-helper">
                        Seamlessly place your product into an existing video scene.
                    </p>

                    <div className="upload-sections">
                        <div className="upload-section">
                            <h4>Base Video</h4>
                            {videos[0] ? (
                                <div className="video-preview">
                                    <video src={videos[0].preview} controls />
                                    <button className="remove-btn" onClick={() => removeVideo(0)}>×</button>
                                </div>
                            ) : (
                                <div
                                    className="upload-slot large"
                                    onClick={() => videoInputRef.current?.click()}
                                >
                                    <span>📹</span>
                                    <span>Upload video</span>
                                </div>
                            )}
                        </div>

                        <div className="upload-section">
                            <h4>Product Image</h4>
                            {productImage ? (
                                <div className="image-preview">
                                    <img src={productImage.preview} alt="Product" />
                                    <button
                                        className="remove-btn"
                                        onClick={() => {
                                            URL.revokeObjectURL(productImage.preview);
                                            setProductImage(null);
                                        }}
                                    >
                                        ×
                                    </button>
                                </div>
                            ) : (
                                <div
                                    className="upload-slot"
                                    onClick={() => productInputRef.current?.click()}
                                >
                                    <span>📷</span>
                                    <span>Upload product image</span>
                                </div>
                            )}
                        </div>
                    </div>

                    <input
                        ref={videoInputRef}
                        type="file"
                        accept="video/*"
                        onChange={handleVideoUpload}
                        style={{ display: 'none' }}
                    />
                    <input
                        ref={productInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleProductUpload}
                        style={{ display: 'none' }}
                    />
                </div>
            )}

            {/* UGC Styling Mode */}
            {mode === 'ugc' && (
                <div className="ugc-mode">
                    <h3>📱 UGC Styling</h3>
                    <p className="mode-helper">
                        Transform polished content into authentic-looking user-generated content.
                    </p>

                    <div className="upload-section">
                        {videos[0] ? (
                            <div className="video-preview">
                                <video src={videos[0].preview} controls />
                                <button className="remove-btn" onClick={() => removeVideo(0)}>×</button>
                            </div>
                        ) : (
                            <div
                                className="upload-slot large"
                                onClick={() => videoInputRef.current?.click()}
                            >
                                <span>📹</span>
                                <span>Upload video to style</span>
                            </div>
                        )}
                    </div>

                    <input
                        ref={videoInputRef}
                        type="file"
                        accept="video/*"
                        onChange={handleVideoUpload}
                        style={{ display: 'none' }}
                    />

                    <div className="ugc-intensity">
                        <label>UGC Intensity</label>
                        <div className="intensity-slider">
                            <span>Subtle</span>
                            <input
                                type="range"
                                min="0"
                                max="1"
                                step="0.1"
                                value={ugcIntensity}
                                onChange={(e) => setUgcIntensity(parseFloat(e.target.value))}
                            />
                            <span>Heavy</span>
                        </div>
                        <div className="intensity-effects">
                            <span className={ugcIntensity >= 0.2 ? 'active' : ''}>Camera shake</span>
                            <span className={ugcIntensity >= 0.4 ? 'active' : ''}>Film grain</span>
                            <span className={ugcIntensity >= 0.6 ? 'active' : ''}>Color variance</span>
                            <span className={ugcIntensity >= 0.8 ? 'active' : ''}>Exposure flicker</span>
                        </div>
                    </div>
                </div>
            )}

            {/* Platform Selection */}
            <div className="platform-section">
                <label>Output Platform</label>
                <div className="platform-options">
                    {platforms.map(p => (
                        <button
                            key={p.id}
                            className={`platform-btn ${targetPlatform === p.id ? 'selected' : ''}`}
                            onClick={() => setTargetPlatform(p.id)}
                        >
                            {p.name}
                            <span className="resolution">{p.res}</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Generate Button */}
            <button
                className="btn-generate"
                onClick={handleGenerate}
                disabled={
                    disabled ||
                    isGenerating ||
                    (mode === 'merge' && videos.length < 2) ||
                    (mode === 'product' && (!videos[0] || !productImage)) ||
                    (mode === 'ugc' && !videos[0])
                }
            >
                {isGenerating ? (
                    <>
                        <span className="spinner"></span>
                        Processing...
                    </>
                ) : (
                    <>
                        🎬 Generate
                    </>
                )}
            </button>
        </div>
    );
}

export default VideoCompositor;
