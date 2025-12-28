/*
  ==============================================================================

    This file contains the basic framework code for a JUCE processor editor.

  ==============================================================================
*/

#include "MainComponent.h"
#include <cstring>

//==============================================================================
MainComponent::MainComponent()
{
    setSize (1000, 800);
    setVisible (true);
    setOpaque (true);
    
    // Initialize audio device manager
    audioDeviceManager.initialiseWithDefaultDevices (0, 2);
    audioDeviceManager.addAudioCallback (this);
    
    // Use JUCE WebView for CSS-based UI (WebBrowserComponent is in juce_gui_extra)
    useWebView = true;
    
    // Create WebView with native integration enabled for message passing
    auto options = juce::WebBrowserComponent::Options{}
        .withNativeIntegrationEnabled (true)
        .withEventListener ("message", [this](const juce::var& message) {
            handleJavaScriptMessage (message);
        });
    
    webView = std::make_unique<juce::WebBrowserComponent> (options);
    
    addAndMakeVisible (webView.get());
    webView->setBounds (getLocalBounds());
    webView->setVisible (true);
    
    DBG ("WebView created, bounds: " + getLocalBounds().toString());
    DBG ("Component size: " + juce::String (getWidth()) + "x" + juce::String (getHeight()));
    DBG ("Component visible: " + juce::String (isVisible() ? "YES" : "NO"));
    
    loadWebUI();
}

MainComponent::~MainComponent()
{
    audioDeviceManager.removeAudioCallback (this);
    audioDeviceManager.closeAudioDevice();
}

//==============================================================================
void MainComponent::paint (juce::Graphics& g)
{
    // Only paint if not using WebView
    if (!useWebView)
    {
        g.fillAll (getLookAndFeel().findColour (juce::ResizableWindow::backgroundColourId));
        g.setColour (juce::Colours::white);
        g.setFont (20.0f);
        g.drawFittedText ("Synth (Native JUCE UI)", getLocalBounds(), juce::Justification::centred, 1);
    }
    else
    {
        // Paint a background color so we can see if WebView is working
        g.fillAll (juce::Colours::darkgrey);
    }
}

void MainComponent::resized()
{
    if (webView != nullptr)
        webView->setBounds (getLocalBounds());
}

void MainComponent::loadWebUI()
{
    // Try multiple locations for UI files
    juce::File htmlFile;
    
    // 1. Try absolute path from known project location (for development)
    // This works when running from Xcode
    auto projectRoot = juce::File ("/Users/rjmacbookpro/Development/Synth");
    htmlFile = projectRoot.getChildFile ("UI").getChildFile ("ui.html");
    
    DBG ("Trying project root: " + htmlFile.getFullPathName());
    DBG ("Exists: " + juce::String (htmlFile.existsAsFile() ? "YES" : "NO"));
    
    // 2. Try relative to executable (for deployed apps)
    if (!htmlFile.existsAsFile())
    {
        auto exeDir = juce::File::getSpecialLocation (juce::File::currentExecutableFile).getParentDirectory();
        htmlFile = exeDir.getChildFile ("UI").getChildFile ("ui.html");
    }
    
    // 3. Try relative to current working directory (for development)
    if (!htmlFile.existsAsFile())
    {
        auto cwd = juce::File::getCurrentWorkingDirectory();
        htmlFile = cwd.getChildFile ("UI").getChildFile ("ui.html");
        
        // Also try going up directories to find the project root
        auto checkDir = cwd;
        for (int i = 0; i < 5 && !htmlFile.existsAsFile(); ++i)
        {
            htmlFile = checkDir.getChildFile ("UI").getChildFile ("ui.html");
            if (!htmlFile.existsAsFile())
                checkDir = checkDir.getParentDirectory();
        }
    }
    
    // 4. Try relative to app bundle Resources (for macOS)
    if (!htmlFile.existsAsFile())
    {
        auto appDir = juce::File::getSpecialLocation (juce::File::currentApplicationFile);
        if (appDir.isDirectory())
        {
            htmlFile = appDir.getChildFile ("Contents")
                          .getChildFile ("Resources")
                          .getChildFile ("UI")
                          .getChildFile ("ui.html");
        }
    }
    
    DBG ("Looking for UI file at: " + htmlFile.getFullPathName());
    DBG ("File exists: " + juce::String (htmlFile.existsAsFile() ? "YES" : "NO"));
    
    if (htmlFile.existsAsFile())
    {
        // Read HTML file and inline CSS/JS to avoid path issues
        auto htmlContent = htmlFile.loadFileAsString();
        auto uiDir = htmlFile.getParentDirectory();
        
        DBG ("HTML file loaded, length: " + juce::String (htmlContent.length()));
        
        // Try to read and inline CSS
        auto cssFile = uiDir.getChildFile ("styles.css");
        if (cssFile.existsAsFile())
        {
            auto cssContent = cssFile.loadFileAsString();
            DBG ("CSS file loaded, length: " + juce::String (cssContent.length()));
            
            // Replace <link rel="stylesheet" href="styles.css"> with inline style
            // Try multiple variations of the link tag
            htmlContent = htmlContent.replace ("<link rel=\"stylesheet\" href=\"styles.css\">",
                                               "<style>" + cssContent + "</style>");
            htmlContent = htmlContent.replace ("<link rel=\"stylesheet\" href=\"styles.css\" />",
                                               "<style>" + cssContent + "</style>");
            htmlContent = htmlContent.replace ("<link rel='stylesheet' href='styles.css'>",
                                               "<style>" + cssContent + "</style>");
        }
        else
        {
            DBG ("CSS file not found at: " + cssFile.getFullPathName());
        }
        
        // Try to read and inline JS
        auto jsFile = uiDir.getChildFile ("app.js");
        if (jsFile.existsAsFile())
        {
            auto jsContent = jsFile.loadFileAsString();
            DBG ("JS file loaded, length: " + juce::String (jsContent.length()));
            
            // Replace <script src="app.js"></script> with inline script
            // Try multiple variations
            htmlContent = htmlContent.replace ("<script src=\"app.js\"></script>",
                                               "<script>" + jsContent + "</script>");
            htmlContent = htmlContent.replace ("<script src='app.js'></script>",
                                               "<script>" + jsContent + "</script>");
        }
        else
        {
            DBG ("JS file not found at: " + jsFile.getFullPathName());
        }
        
        DBG ("Final HTML length: " + juce::String (htmlContent.length()));
        
        // Write the inlined HTML to a temporary file and load that
        // This avoids data URL encoding/decoding issues
        auto tempDir = juce::File::getSpecialLocation (juce::File::tempDirectory)
                          .getChildFile ("Synth");
        tempDir.createDirectory();
        
        auto tempFile = tempDir.getChildFile ("SynthUI.html");
        tempFile.replaceWithText (htmlContent);
        
        // Copy other HTML files to temp directory so they can be accessed
        auto componentsFile = uiDir.getChildFile ("components.html");
        if (componentsFile.existsAsFile())
        {
            auto tempComponentsFile = tempDir.getChildFile ("components.html");
            componentsFile.copyFileTo (tempComponentsFile);
            DBG ("Copied components.html to temp directory");
        }
        
        auto demoFile = uiDir.getChildFile ("demo.html");
        if (demoFile.existsAsFile())
        {
            auto tempDemoFile = tempDir.getChildFile ("demo.html");
            demoFile.copyFileTo (tempDemoFile);
            DBG ("Copied demo.html to temp directory");
        }
        
        // Copy components.js to temp directory
        auto componentsJsFile = uiDir.getChildFile ("components.js");
        if (componentsJsFile.existsAsFile())
        {
            auto tempComponentsJsFile = tempDir.getChildFile ("components.js");
            componentsJsFile.copyFileTo (tempComponentsJsFile);
            DBG ("Copied components.js to temp directory");
        }
        
        // Copy assets folder to temp directory so they can be referenced
        auto assetsSource = projectRoot.getChildFile ("Blackway FX Kit (VST)").getChildFile ("Assets");
        auto assetsDest = tempDir.getChildFile ("Assets");
        
        if (assetsSource.exists() && assetsSource.isDirectory())
        {
            DBG ("Copying assets to temp directory...");
            assetsDest.deleteRecursively();
            assetsSource.copyDirectoryTo (assetsDest);
            DBG ("Assets copied to: " + assetsDest.getFullPathName());
        }
        
        auto filePath = tempFile.getFullPathName();
        filePath = filePath.replace (" ", "%20");
        juce::String fileURL = "file://" + filePath;
        
        DBG ("Loading UI from temp file: " + fileURL);
        
        // Ensure WebView is visible and properly sized
        webView->setVisible (true);
        webView->setBounds (getLocalBounds());
        webView->toFront (false);
        
        // Load the file URL
        webView->goToURL (fileURL);
        
        // Force a repaint
        repaint();
        webView->repaint();
        
        DBG ("WebView URL loaded, WebView visible: " + juce::String (webView->isVisible() ? "YES" : "NO"));
        DBG ("WebView bounds: " + webView->getBounds().toString());
        DBG ("Component visible: " + juce::String (isVisible() ? "YES" : "NO"));
        DBG ("Component bounds: " + getBounds().toString());
        
        return;
    }
    
    DBG ("UI file not found, using fallback HTML");
    
    // Fallback: Use minimal embedded HTML (avoid large string construction that causes crash)
    const char* minimalHTML = 
        "<!DOCTYPE html><html><head><meta charset='UTF-8'><title>Synth</title></head>"
        "<body style='font-family: system-ui; padding: 40px; text-align: center; "
        "background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; "
        "height: 100vh; display: flex; flex-direction: column; justify-content: center;'>"
        "<h1>🎹 Synth</h1>"
        "<p>Please place UI files in the UI/ directory</p>"
        "<p style='font-size: 0.9em; opacity: 0.8;'>Expected: UI/ui.html, UI/styles.css, UI/app.js</p>"
        "</body></html>";
    
    // Use URL encoding instead of Base64 for better compatibility
    juce::String htmlString (minimalHTML);
    auto escapedHTML = juce::URL::addEscapeChars (htmlString, true);
    juce::String dataURL = "data:text/html;charset=utf-8," + escapedHTML;
    webView->goToURL (dataURL);
    
    // Note: Large embedded HTML removed to avoid crash
    // Always use UI/ui.html file for full functionality
}

void MainComponent::handleJavaScriptMessage (const juce::var& message)
{
    // Handle messages from JavaScript
    // Message can be a JSON string or already parsed var
    juce::var parsedMessage = message;
    
    // If it's a string, parse it as JSON
    if (message.isString())
    {
        auto result = juce::JSON::parse (message.toString(), parsedMessage);
        if (result.failed())
        {
            DBG ("Failed to parse message: " + result.getErrorMessage());
            return;
        }
    }
    
    // Extract message data
    if (auto* obj = parsedMessage.getDynamicObject())
    {
        auto type = obj->getProperty ("type").toString();
        auto value = obj->getProperty ("value");
        
        if (type == "volume")
        {
            auto volumeValue = (float) value;
            DBG ("Volume changed: " + juce::String (volumeValue));
            currentVolume = volumeValue / 100.0f; // Convert 0-100 to 0.0-1.0
        }
        else if (type == "frequency")
        {
            auto freqValue = (float) value;
            DBG ("Frequency changed: " + juce::String (freqValue));
            currentFrequency = (double) freqValue;
            // Update phase delta if audio is already started
            if (sampleRate > 0.0)
                phaseDelta = juce::MathConstants<double>::twoPi * currentFrequency / sampleRate;
        }
        else if (type == "detune")
        {
            auto detuneValue = (float) value;
            DBG ("Detune changed: " + juce::String (detuneValue));
            // TODO: Update detune
            // audioEngine.setDetune (detuneValue);
        }
        else if (type == "waveform")
        {
            auto waveformValue = value.toString();
            DBG ("Waveform changed: " + waveformValue);
            currentWaveform = waveformValue;
        }
        else if (type == "attack")
        {
            auto attackValue = (float) value;
            DBG ("Attack changed: " + juce::String (attackValue));
            // TODO: Update attack time
            // audioEngine.setAttack (attackValue / 1000.0f);
        }
        else if (type == "decay")
        {
            auto decayValue = (float) value;
            DBG ("Decay changed: " + juce::String (decayValue));
            // TODO: Update decay time
            // audioEngine.setDecay (decayValue / 1000.0f);
        }
        else if (type == "sustain")
        {
            auto sustainValue = (float) value;
            DBG ("Sustain changed: " + juce::String (sustainValue));
            // TODO: Update sustain level
            // audioEngine.setSustain (sustainValue / 100.0f);
        }
        else if (type == "release")
        {
            auto releaseValue = (float) value;
            DBG ("Release changed: " + juce::String (releaseValue));
            // TODO: Update release time
            // audioEngine.setRelease (releaseValue / 1000.0f);
        }
        else if (type == "cutoff")
        {
            auto cutoffValue = (float) value;
            DBG ("Cutoff changed: " + juce::String (cutoffValue));
            // TODO: Update filter cutoff
            // audioEngine.setCutoff (cutoffValue);
        }
        else if (type == "resonance")
        {
            auto resonanceValue = (float) value;
            DBG ("Resonance changed: " + juce::String (resonanceValue));
            // TODO: Update filter resonance
            // audioEngine.setResonance (resonanceValue);
        }
        else if (type == "filterType")
        {
            auto filterTypeValue = value.toString();
            DBG ("Filter type changed: " + filterTypeValue);
            // TODO: Update filter type
            // audioEngine.setFilterType (filterTypeValue);
        }
        else if (type == "playNote")
        {
            DBG ("Play note triggered");
            isPlaying = true;
            currentPhase = 0.0;
            // Update phase delta based on current frequency
            if (sampleRate > 0.0)
                phaseDelta = juce::MathConstants<double>::twoPi * currentFrequency / sampleRate;
        }
        else if (type == "stopNote")
        {
            DBG ("Stop note triggered");
            isPlaying = false;
        }
    }
}

void MainComponent::sendMessageToWebView (const juce::var& message)
{
    // Send message from C++ to JavaScript
    if (webView != nullptr)
    {
        webView->evaluateJavascript ("window.receiveMessageFromJUCE(" + 
                                     juce::JSON::toString (message) + ");");
    }
}

//==============================================================================
// Audio callback methods
void MainComponent::audioDeviceIOCallbackWithContext (const float* const* inputChannelData,
                                                      int numInputChannels,
                                                      float* const* outputChannelData,
                                                      int numOutputChannels,
                                                      int numSamples,
                                                      const juce::AudioIODeviceCallbackContext& context)
{
    // Clear output buffers
    for (int channel = 0; channel < numOutputChannels; ++channel)
    {
        juce::FloatVectorOperations::clear (outputChannelData[channel], numSamples);
    }
    
    // Generate audio if playing
    if (isPlaying)
    {
        for (int sample = 0; sample < numSamples; ++sample)
        {
            float sampleValue = 0.0f;
            
            // Generate waveform based on current selection
            if (currentWaveform == "sine")
            {
                sampleValue = (float) std::sin (currentPhase);
            }
            else if (currentWaveform == "square")
            {
                sampleValue = (currentPhase < juce::MathConstants<double>::pi) ? 1.0f : -1.0f;
            }
            else if (currentWaveform == "sawtooth")
            {
                // Sawtooth: linear ramp from -1 to 1
                sampleValue = (float) ((currentPhase / juce::MathConstants<double>::twoPi) * 2.0 - 1.0);
            }
            else if (currentWaveform == "triangle")
            {
                // Triangle: linear ramp up then down
                if (currentPhase < juce::MathConstants<double>::pi)
                    sampleValue = (float) ((currentPhase / juce::MathConstants<double>::pi) * 2.0 - 1.0);
                else
                    sampleValue = (float) (3.0 - (currentPhase / juce::MathConstants<double>::pi) * 2.0);
            }
            else
            {
                // Default to sine
                sampleValue = (float) std::sin (currentPhase);
            }
            
            // Apply volume
            sampleValue *= currentVolume;
            
            // Write to all output channels
            for (int channel = 0; channel < numOutputChannels; ++channel)
            {
                outputChannelData[channel][sample] = sampleValue;
            }
            
            // Update phase
            currentPhase += phaseDelta;
            if (currentPhase >= juce::MathConstants<double>::twoPi)
                currentPhase -= juce::MathConstants<double>::twoPi;
        }
    }
}

void MainComponent::audioDeviceAboutToStart (juce::AudioIODevice* device)
{
    if (device != nullptr)
    {
        sampleRate = device->getCurrentSampleRate();
        phaseDelta = juce::MathConstants<double>::twoPi * currentFrequency / sampleRate;
        DBG ("Audio device started, sample rate: " + juce::String (sampleRate));
    }
}

void MainComponent::audioDeviceStopped()
{
    DBG ("Audio device stopped");
}

void MainComponent::audioDeviceError (const juce::String& errorMessage)
{
    DBG ("Audio device error: " + errorMessage);
}
