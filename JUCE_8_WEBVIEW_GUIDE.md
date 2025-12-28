# JUCE 8 WebView Guide

This project uses **JUCE 8's WebView** feature to create beautiful CSS-based UIs for your audio application.

## Features

- ✅ **Full CSS Support**: Style your UI with modern CSS (gradients, animations, glassmorphism, etc.)
- ✅ **JavaScript Integration**: Use React, Vue, or vanilla JavaScript
- ✅ **Bidirectional Communication**: Send messages between JavaScript and C++
- ✅ **Hot Reloading**: Edit HTML/CSS files and refresh during development
- ✅ **Cross-Platform**: Works on macOS, Windows, and Linux

## Architecture

```
┌─────────────────┐
│  JavaScript UI  │  (HTML/CSS/JS in UI/ folder)
│   (WebView)     │
└────────┬────────┘
         │ Messages
         │ (JSON)
         ▼
┌─────────────────┐
│  C++ JUCE Code  │  (MainComponent.cpp)
│  Audio Engine   │
└─────────────────┘
```

## Message Passing

### JavaScript → C++

In your JavaScript (`UI/app.js`):

```javascript
sendToJUCE({
    type: 'volume',
    value: 75.0
});
```

In your C++ (`Source/MainComponent.cpp`):

```cpp
void MainComponent::handleJavaScriptMessage (const juce::var& message)
{
    if (auto* obj = message.getDynamicObject())
    {
        auto type = obj->getProperty ("type").toString();
        auto value = obj->getProperty ("value");
        
        if (type == "volume")
        {
            // Update your audio engine
            audioEngine.setVolume ((float) value);
        }
    }
}
```

### C++ → JavaScript

In your C++:

```cpp
void MainComponent::sendMessageToWebView (const juce::var& message)
{
    if (webView != nullptr)
    {
        webView->evaluateJavaScript (
            "window.receiveMessageFromJUCE(" + 
            juce::JSON::toString (message) + 
            ");"
        );
    }
}
```

In your JavaScript:

```javascript
function receiveMessageFromJUCE(message) {
    console.log('Message from JUCE:', message);
    // Update UI based on C++ state
    if (message.type === 'updateVolume') {
        document.getElementById('volume').value = message.value;
    }
}
```

## Development Workflow

### Option 1: External Files (Recommended for Development)

1. Edit `UI/ui.html`, `UI/styles.css`, or `UI/app.js`
2. The app loads from these files automatically
3. Refresh the WebView to see changes (or restart the app)

### Option 2: Embedded HTML

The code falls back to embedded HTML if files aren't found, useful for distribution.

## Using Web Frameworks

You can use React, Vue, or any other framework:

### React Example

```bash
# In UI/ directory
npm init -y
npm install react react-dom
```

Then build your React app and load it:

```cpp
webView->goToURL (juce::URL (reactBuildFolder.getChildFile ("index.html")));
```

### Vue Example

Similar setup - build your Vue app and point WebView to the built HTML file.

## Styling Tips

### Modern CSS Features Supported

- ✅ CSS Grid & Flexbox
- ✅ CSS Variables
- ✅ Gradients
- ✅ Animations & Transitions
- ✅ Backdrop Filter (glassmorphism)
- ✅ Custom Properties
- ✅ Media Queries

### Example: Glassmorphism

```css
.container {
    background: rgba(255, 255, 255, 0.1);
    backdrop-filter: blur(10px);
    border: 1px solid rgba(255, 255, 255, 0.2);
}
```

## Platform-Specific Notes

### macOS
- Uses WKWebView
- Full WebKit feature support

### Windows
- Uses WebView2 (Edge Chromium)
- Requires WebView2 runtime (usually pre-installed)

### Linux
- Uses WebKitGTK
- May require additional packages

## Troubleshooting

### WebView Not Loading

1. Ensure `juce_web_browser` module is added in Projucer
2. Check that JUCE 8.0+ is being used
3. Verify HTML file paths are correct

### Messages Not Working

1. Check browser console for JavaScript errors
2. Verify `bind()` is called before loading HTML
3. Use `DBG()` in C++ to debug message reception

### Performance Issues

- Use CSS transforms instead of changing layout properties
- Avoid frequent message passing (throttle if needed)
- Use `requestAnimationFrame` for animations

## Resources

- [JUCE 8 WebView Blog Post](https://juce.com/blog/juce-8-feature-overview-webview-uis/)
- [JUCE WebBrowserComponent Documentation](https://juce.com/api/classWebBrowserComponent.html)
- [WebViewPluginDemo](https://github.com/juce-framework/JUCE/tree/master/examples/Plugins/WebViewPluginDemo)

## Next Steps

1. Customize `UI/styles.css` to match your design
2. Add more controls in `UI/ui.html`
3. Connect controls to your audio engine in `MainComponent::handleJavaScriptMessage()`
4. Consider using a web framework for complex UIs
