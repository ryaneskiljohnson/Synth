# Fixing Projucer Module Path Error

## The Problem

Projucer is showing an error: "At least one of your JUCE module paths is invalid!"

This happens because the `.jucer` file is configured to use **global JUCE module paths**, but they're not set up in Projucer yet.

## Solution Options

### Option 1: Set Global Path in Projucer (Recommended)

1. Open Projucer
2. Go to **File → Global Paths** (or **Projucer → Global Paths** on macOS)
3. Set the **JUCE modules path** to your JUCE installation:
   - Example: `/Users/rjmacbookpro/JUCE/modules`
   - Or wherever you have JUCE installed
4. Click **OK**
5. Now try saving `Synth.jucer` again

### Option 2: Use Local JUCE Copy (Better for Version Control)

If you want to use a local JUCE copy in your project:

1. **Add JUCE as a submodule** (if using git):
   ```bash
   cd /Users/rjmacbookpro/Development/Synth
   git submodule add https://github.com/juce-framework/JUCE.git JUCE
   git submodule update --init --recursive
   ```

2. **Or download JUCE manually**:
   - Download from https://juce.com or clone from GitHub
   - Place the JUCE folder in your project root: `/Users/rjmacbookpro/Development/Synth/JUCE`

3. **In Projucer**:
   - Open `Synth.jucer`
   - Go to the **Modules** tab
   - For each module, change from "Use global path" to "Use local copy"
   - Set the path to `JUCE/modules` (relative to project)
   - Save the project

### Option 3: Quick Fix - Use Local Copy for All Modules

1. Open `Synth.jucer` in Projucer
2. Click on the **Modules** tab (left sidebar)
3. Select all modules (Cmd+A / Ctrl+A)
4. In the module settings, change:
   - **"Use global path"** → **"Use local copy"**
   - Set path to: `JUCE/modules` (if JUCE is in project root)
   - Or: `../../JUCE/modules` (if JUCE is two levels up)
5. Click **Save Project**

## Finding Your JUCE Installation

If you're not sure where JUCE is installed:

```bash
# Search for JUCE
find ~ -type d -name "JUCE" 2>/dev/null | head -5

# Or check common locations
ls -la ~/JUCE
ls -la ~/Development/JUCE
ls -la /Applications/JUCE
```

## After Fixing

Once the paths are configured:
1. Projucer should save without errors
2. You can generate Xcode/Visual Studio projects
3. The project will build successfully

## Need Help?

If you're still having issues:
- Make sure JUCE 8.0+ is installed (for WebView support)
- Verify the `juce_web_browser` module exists in your JUCE installation
- Check that the path points to the `modules` folder (not the JUCE root)
