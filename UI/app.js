// ============================================
// Synth UI - JavaScript Controller
// ============================================

// JUCE 8 WebView message passing helper
function sendToJUCE(message) {
    // JUCE 8 uses window.__JUCE__.backend.emitEvent() for message passing
    if (typeof window.__JUCE__ !== 'undefined' && 
        typeof window.__JUCE__.backend !== 'undefined' &&
        typeof window.__JUCE__.backend.emitEvent === 'function') {
        // Send message using JUCE 8 native integration
        window.__JUCE__.backend.emitEvent('message', message);
    } else {
        // Fallback for different platforms
        if (window.chrome && window.chrome.webview) {
            // Windows WebView2
            window.chrome.webview.postMessage(message);
        } else if (window.webkit && window.webkit.messageHandlers) {
            // macOS WKWebView (alternative method)
            window.webkit.messageHandlers.juce.postMessage(message);
        } else {
            console.warn('JUCE message handler not available');
        }
    }
}

// Update value displays with smooth animations
function updateValueDisplay(elementId, value, suffix = '') {
    const element = document.getElementById(elementId);
    if (element) {
        element.textContent = value + suffix;
        // Add a subtle animation
        element.style.transform = 'scale(1.1)';
        setTimeout(() => {
            element.style.transform = 'scale(1)';
        }, 150);
    }
}

// Initialize all controls
document.addEventListener('DOMContentLoaded', function() {
    // Volume Control
    const volumeSlider = document.getElementById('volume');
    volumeSlider.addEventListener('input', function(e) {
        const value = parseFloat(e.target.value);
        updateValueDisplay('volumeValue', value, '%');
        sendToJUCE({type: 'volume', value: value});
    });

    // Frequency Control
    const frequencySlider = document.getElementById('frequency');
    frequencySlider.addEventListener('input', function(e) {
        const value = parseFloat(e.target.value);
        updateValueDisplay('frequencyValue', value, ' Hz');
        sendToJUCE({type: 'frequency', value: value});
    });

    // Detune Control
    const detuneSlider = document.getElementById('detune');
    detuneSlider.addEventListener('input', function(e) {
        const value = parseFloat(e.target.value);
        updateValueDisplay('detuneValue', value, ' cents');
        sendToJUCE({type: 'detune', value: value});
    });

    // Attack Control
    const attackSlider = document.getElementById('attack');
    attackSlider.addEventListener('input', function(e) {
        const value = parseFloat(e.target.value);
        updateValueDisplay('attackValue', value, ' ms');
        sendToJUCE({type: 'attack', value: value});
    });

    // Decay Control
    const decaySlider = document.getElementById('decay');
    decaySlider.addEventListener('input', function(e) {
        const value = parseFloat(e.target.value);
        updateValueDisplay('decayValue', value, ' ms');
        sendToJUCE({type: 'decay', value: value});
    });

    // Sustain Control
    const sustainSlider = document.getElementById('sustain');
    sustainSlider.addEventListener('input', function(e) {
        const value = parseFloat(e.target.value);
        updateValueDisplay('sustainValue', value, '%');
        sendToJUCE({type: 'sustain', value: value});
    });

    // Release Control
    const releaseSlider = document.getElementById('release');
    releaseSlider.addEventListener('input', function(e) {
        const value = parseFloat(e.target.value);
        updateValueDisplay('releaseValue', value, ' ms');
        sendToJUCE({type: 'release', value: value});
    });

    // Cutoff Control
    const cutoffSlider = document.getElementById('cutoff');
    cutoffSlider.addEventListener('input', function(e) {
        const value = parseFloat(e.target.value);
        updateValueDisplay('cutoffValue', value, ' Hz');
        sendToJUCE({type: 'cutoff', value: value});
    });

    // Resonance Control
    const resonanceSlider = document.getElementById('resonance');
    resonanceSlider.addEventListener('input', function(e) {
        const value = parseFloat(e.target.value);
        updateValueDisplay('resonanceValue', value);
        sendToJUCE({type: 'resonance', value: value});
    });

    // Waveform Select
    const waveformSelect = document.getElementById('waveform');
    waveformSelect.addEventListener('change', function(e) {
        sendToJUCE({type: 'waveform', value: e.target.value});
    });

    // Filter Type Select
    const filterTypeSelect = document.getElementById('filterType');
    filterTypeSelect.addEventListener('change', function(e) {
        sendToJUCE({type: 'filterType', value: e.target.value});
    });

    // Play Button
    const playButton = document.getElementById('playButton');
    playButton.addEventListener('click', function() {
        this.style.transform = 'scale(0.95)';
        setTimeout(() => {
            this.style.transform = 'scale(1)';
        }, 100);
    });

    // Stop Button
    const stopButton = document.getElementById('stopButton');
    stopButton.addEventListener('click', function() {
        this.style.transform = 'scale(0.95)';
        setTimeout(() => {
            this.style.transform = 'scale(1)';
        }, 100);
    });
});

// Play Note Function
function playNote() {
    sendToJUCE({type: 'playNote'});
    console.log('Note played!');
    
    // Visual feedback
    const playButton = document.getElementById('playButton');
    const statusDot = document.querySelector('.status-dot');
    if (playButton) {
        playButton.classList.add('playing');
    }
    if (statusDot) {
        statusDot.classList.add('active');
    }
}

// Stop Note Function
function stopNote() {
    sendToJUCE({type: 'stopNote'});
    console.log('Note stopped!');
    
    // Visual feedback
    const playButton = document.getElementById('playButton');
    const statusDot = document.querySelector('.status-dot');
    if (playButton) {
        playButton.classList.remove('playing');
    }
    if (statusDot) {
        statusDot.classList.remove('active');
    }
}

// Listen for messages from JUCE C++
function receiveMessageFromJUCE(message) {
    console.log('Message from JUCE:', message);
    
    // Handle messages from C++ here
    // Example: update UI based on C++ state
    if (message.type === 'updateVolume') {
        const volumeSlider = document.getElementById('volume');
        volumeSlider.value = message.value;
        updateValueDisplay('volumeValue', message.value, '%');
    } else if (message.type === 'updateFrequency') {
        const frequencySlider = document.getElementById('frequency');
        frequencySlider.value = message.value;
        updateValueDisplay('frequencyValue', message.value, ' Hz');
    }
    // Add more update handlers as needed
}

// Make function globally available for JUCE to call
window.receiveMessageFromJUCE = receiveMessageFromJUCE;

// Add smooth transitions
document.addEventListener('DOMContentLoaded', function() {
    const style = document.createElement('style');
    style.textContent = `
        .value-display {
            transition: transform 0.15s ease;
        }
    `;
    document.head.appendChild(style);
});
