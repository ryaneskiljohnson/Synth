// ============================================
// UI Component Library - Blackway FX Kit
// ============================================

class UIComponents {
    constructor() {
        this.components = new Map();
    }

    // ============================================
    // Filmstrip Helper - Calculate frame position
    // ============================================
    calculateFilmstripFrame(value, min, max, totalFrames = 128) {
        // Clamp value to range
        const clamped = Math.max(min, Math.min(max, value));
        // Normalize to 0-1
        const normalized = (clamped - min) / (max - min);
        // Calculate frame index (0 to totalFrames-1)
        const frameIndex = Math.floor(normalized * (totalFrames - 1));
        return frameIndex;
    }

    // ============================================
    // Knob Component with Filmstrip
    // ============================================
    createKnob(containerId, options = {}) {
        const {
            id = `knob_${Date.now()}`,
            min = 0,
            max = 100,
            value = 50,
            filmstrip = 'knob_small_black_128_frames.png',
            size = 80,
            label = '',
            onChange = null
        } = options;

        const container = document.getElementById(containerId);
        if (!container) {
            console.error(`Container ${containerId} not found`);
            return null;
        }

        const knobContainer = document.createElement('div');
        knobContainer.className = 'knob-container';
        knobContainer.id = id;
        knobContainer.style.cssText = `
            width: ${size}px;
            height: ${size}px;
            position: relative;
            margin: 0 auto;
            cursor: pointer;
            user-select: none;
        `;

        const knobImage = document.createElement('div');
        knobImage.className = 'knob-image';
        knobImage.style.cssText = `
            width: 100%;
            height: 100%;
            background-image: url('Assets/PNG Filmstripes 128 frames/${filmstrip}');
            background-size: ${size * 128}px ${size}px;
            background-repeat: no-repeat;
            background-position: 0 0;
            image-rendering: pixelated;
        `;

        const labelElement = label ? document.createElement('div') : null;
        if (labelElement) {
            labelElement.className = 'knob-label';
            labelElement.textContent = label;
            labelElement.style.cssText = `
                text-align: center;
                margin-top: 5px;
                font-size: 0.85em;
                color: rgba(255, 255, 255, 0.8);
            `;
        }

        knobContainer.appendChild(knobImage);
        if (labelElement) {
            const wrapper = document.createElement('div');
            wrapper.style.textAlign = 'center';
            wrapper.appendChild(knobContainer);
            wrapper.appendChild(labelElement);
            container.appendChild(wrapper);
        } else {
            container.appendChild(knobContainer);
        }

        let currentValue = value;
        let isDragging = false;
        let startY = 0;
        let startValue = 0;

        const updateKnob = (newValue) => {
            currentValue = Math.max(min, Math.min(max, newValue));
            const frameIndex = this.calculateFilmstripFrame(currentValue, min, max, 128);
            const offsetX = -frameIndex * size;
            knobImage.style.backgroundPosition = `${offsetX}px 0`;
            
            if (onChange) {
                onChange(currentValue);
            }
        };

        // Mouse events
        knobContainer.addEventListener('mousedown', (e) => {
            isDragging = true;
            startY = e.clientY;
            startValue = currentValue;
            e.preventDefault();
        });

        document.addEventListener('mousemove', (e) => {
            if (!isDragging) return;
            const deltaY = startY - e.clientY;
            const sensitivity = (max - min) / 200; // Adjust sensitivity
            const newValue = startValue + (deltaY * sensitivity);
            updateKnob(newValue);
        });

        document.addEventListener('mouseup', () => {
            isDragging = false;
        });

        // Touch events
        knobContainer.addEventListener('touchstart', (e) => {
            isDragging = true;
            startY = e.touches[0].clientY;
            startValue = currentValue;
            e.preventDefault();
        });

        document.addEventListener('touchmove', (e) => {
            if (!isDragging) return;
            const deltaY = startY - e.touches[0].clientY;
            const sensitivity = (max - min) / 200;
            const newValue = startValue + (deltaY * sensitivity);
            updateKnob(newValue);
        });

        document.addEventListener('touchend', () => {
            isDragging = false;
        });

        // Initialize
        updateKnob(value);

        const component = {
            id,
            setValue: updateKnob,
            getValue: () => currentValue,
            destroy: () => {
                knobContainer.remove();
                if (labelElement) labelElement.remove();
            }
        };

        this.components.set(id, component);
        return component;
    }

    // ============================================
    // Slider Component with Filmstrip
    // ============================================
    createSlider(containerId, options = {}) {
        const {
            id = `slider_${Date.now()}`,
            min = 0,
            max = 100,
            value = 50,
            filmstrip = 'slider_horizontal_128_frames.png',
            orientation = 'horizontal', // 'horizontal' or 'vertical'
            width = 200,
            height = 30,
            label = '',
            onChange = null
        } = options;

        const container = document.getElementById(containerId);
        if (!container) {
            console.error(`Container ${containerId} not found`);
            return null;
        }

        const sliderContainer = document.createElement('div');
        sliderContainer.className = 'slider-container-filmstrip';
        sliderContainer.id = id;
        
        const isHorizontal = orientation === 'horizontal';
        sliderContainer.style.cssText = `
            width: ${isHorizontal ? width : height}px;
            height: ${isHorizontal ? height : width}px;
            position: relative;
            margin: 0 auto;
            cursor: pointer;
            user-select: none;
        `;

        const sliderImage = document.createElement('div');
        sliderImage.className = 'slider-image';
        sliderImage.style.cssText = `
            width: 100%;
            height: 100%;
            background-image: url('Assets/PNG Filmstripes 128 frames/${filmstrip}');
            background-size: ${isHorizontal ? `${height * 128}px ${height}px` : `${height}px ${height * 128}px`};
            background-repeat: no-repeat;
            background-position: 0 0;
            image-rendering: pixelated;
        `;

        const labelElement = label ? document.createElement('div') : null;
        if (labelElement) {
            labelElement.className = 'slider-label';
            labelElement.textContent = label;
            labelElement.style.cssText = `
                text-align: center;
                margin-top: 5px;
                font-size: 0.85em;
                color: rgba(255, 255, 255, 0.8);
            `;
        }

        sliderContainer.appendChild(sliderImage);
        
        const wrapper = document.createElement('div');
        wrapper.style.textAlign = 'center';
        wrapper.appendChild(sliderContainer);
        if (labelElement) wrapper.appendChild(labelElement);
        container.appendChild(wrapper);

        let currentValue = value;
        let isDragging = false;
        let startPos = 0;
        let startValue = 0;

        const updateSlider = (newValue) => {
            currentValue = Math.max(min, Math.min(max, newValue));
            const frameIndex = this.calculateFilmstripFrame(currentValue, min, max, 128);
            
            if (isHorizontal) {
                const offsetX = -frameIndex * height;
                sliderImage.style.backgroundPosition = `${offsetX}px 0`;
            } else {
                const offsetY = -frameIndex * height;
                sliderImage.style.backgroundPosition = `0 ${offsetY}px`;
            }
            
            if (onChange) {
                onChange(currentValue);
            }
        };

        const getEventPos = (e) => {
            return isHorizontal ? e.clientX : e.clientY;
        };

        const getTouchPos = (e) => {
            return isHorizontal ? e.touches[0].clientX : e.touches[0].clientY;
        };

        // Mouse events
        sliderContainer.addEventListener('mousedown', (e) => {
            isDragging = true;
            startPos = getEventPos(e);
            startValue = currentValue;
            e.preventDefault();
        });

        document.addEventListener('mousemove', (e) => {
            if (!isDragging) return;
            const delta = getEventPos(e) - startPos;
            const sensitivity = (max - min) / (isHorizontal ? width : width);
            const newValue = startValue + (delta * sensitivity);
            updateSlider(newValue);
        });

        document.addEventListener('mouseup', () => {
            isDragging = false;
        });

        // Touch events
        sliderContainer.addEventListener('touchstart', (e) => {
            isDragging = true;
            startPos = getTouchPos(e);
            startValue = currentValue;
            e.preventDefault();
        });

        document.addEventListener('touchmove', (e) => {
            if (!isDragging) return;
            const delta = getTouchPos(e) - startPos;
            const sensitivity = (max - min) / (isHorizontal ? width : width);
            const newValue = startValue + (delta * sensitivity);
            updateSlider(newValue);
        });

        document.addEventListener('touchend', () => {
            isDragging = false;
        });

        // Initialize
        updateSlider(value);

        const component = {
            id,
            setValue: updateSlider,
            getValue: () => currentValue,
            destroy: () => {
                sliderContainer.remove();
                if (labelElement) labelElement.remove();
            }
        };

        this.components.set(id, component);
        return component;
    }

    // ============================================
    // Toggle Button Component
    // ============================================
    createToggleButton(containerId, options = {}) {
        const {
            id = `toggle_${Date.now()}`,
            onImage = 'button_rectangular_small_on.png',
            offImage = 'button_rectangular_small_off.png',
            initialState = false,
            label = '',
            onChange = null
        } = options;

        const container = document.getElementById(containerId);
        if (!container) {
            console.error(`Container ${containerId} not found`);
            return null;
        }

        const button = document.createElement('button');
        button.className = 'toggle-button';
        button.id = id;
        button.style.cssText = `
            background: url('Assets/${initialState ? onImage : offImage}') center/cover no-repeat;
            border: none;
            padding: 0;
            cursor: pointer;
            min-width: 100px;
            min-height: 40px;
            transition: transform 0.1s ease;
        `;

        if (label) {
            button.textContent = label;
            button.style.cssText += `
                color: white;
                font-weight: bold;
                text-shadow: 0 1px 3px rgba(0, 0, 0, 0.8);
            `;
        }

        let isOn = initialState;

        button.addEventListener('click', () => {
            isOn = !isOn;
            button.style.backgroundImage = `url('Assets/${isOn ? onImage : offImage}')`;
            
            if (onChange) {
                onChange(isOn);
            }
        });

        button.addEventListener('mousedown', () => {
            button.style.transform = 'scale(0.95)';
        });

        button.addEventListener('mouseup', () => {
            button.style.transform = 'scale(1)';
        });

        container.appendChild(button);

        const component = {
            id,
            setState: (state) => {
                isOn = state;
                button.style.backgroundImage = `url('Assets/${isOn ? onImage : offImage}')`;
            },
            getState: () => isOn,
            toggle: () => {
                isOn = !isOn;
                button.style.backgroundImage = `url('Assets/${isOn ? onImage : offImage}')`;
                if (onChange) onChange(isOn);
            },
            destroy: () => button.remove()
        };

        this.components.set(id, component);
        return component;
    }

    // ============================================
    // Switch Component (Horizontal/Vertical)
    // ============================================
    createSwitch(containerId, options = {}) {
        const {
            id = `switch_${Date.now()}`,
            orientation = 'horizontal', // 'horizontal' or 'vertical'
            initialState = false,
            label = '',
            onChange = null
        } = options;

        const container = document.getElementById(containerId);
        if (!container) {
            console.error(`Container ${containerId} not found`);
            return null;
        }

        const switchButton = document.createElement('button');
        switchButton.className = 'switch-button';
        switchButton.id = id;
        
        const onImage = orientation === 'horizontal' ? 'switch_horizontal_on.png' : 'switch_vertical_on.png';
        const offImage = orientation === 'horizontal' ? 'switch_horizontal_off.png' : 'switch_vertical_off.png';
        
        switchButton.style.cssText = `
            background: url('Assets/${initialState ? onImage : offImage}') center/cover no-repeat;
            border: none;
            padding: 0;
            cursor: pointer;
            min-width: 60px;
            min-height: 30px;
            transition: transform 0.1s ease;
        `;

        if (label) {
            switchButton.textContent = label;
            switchButton.style.cssText += `
                color: white;
                font-weight: bold;
                text-shadow: 0 1px 3px rgba(0, 0, 0, 0.8);
            `;
        }

        let isOn = initialState;

        switchButton.addEventListener('click', () => {
            isOn = !isOn;
            switchButton.style.backgroundImage = `url('Assets/${isOn ? onImage : offImage}')`;
            
            if (onChange) {
                onChange(isOn);
            }
        });

        switchButton.addEventListener('mousedown', () => {
            switchButton.style.transform = 'scale(0.95)';
        });

        switchButton.addEventListener('mouseup', () => {
            switchButton.style.transform = 'scale(1)';
        });

        container.appendChild(switchButton);

        const component = {
            id,
            setState: (state) => {
                isOn = state;
                switchButton.style.backgroundImage = `url('Assets/${isOn ? onImage : offImage}')`;
            },
            getState: () => isOn,
            toggle: () => {
                isOn = !isOn;
                switchButton.style.backgroundImage = `url('Assets/${isOn ? onImage : offImage}')`;
                if (onChange) onChange(isOn);
            },
            destroy: () => switchButton.remove()
        };

        this.components.set(id, component);
        return component;
    }

    // ============================================
    // LED Component
    // ============================================
    createLED(containerId, options = {}) {
        const {
            id = `led_${Date.now()}`,
            initialState = false,
            label = '',
            size = 20
        } = options;

        const container = document.getElementById(containerId);
        if (!container) {
            console.error(`Container ${containerId} not found`);
            return null;
        }

        const ledContainer = document.createElement('div');
        ledContainer.className = 'led-container';
        ledContainer.id = id;
        ledContainer.style.cssText = `
            display: inline-block;
            text-align: center;
        `;

        const led = document.createElement('div');
        led.className = 'led';
        led.style.cssText = `
            width: ${size}px;
            height: ${size}px;
            background: url('Assets/${initialState ? 'led_on.png' : 'led_off.png'}') center/contain no-repeat;
            margin: 0 auto;
        `;

        const labelElement = label ? document.createElement('div') : null;
        if (labelElement) {
            labelElement.className = 'led-label';
            labelElement.textContent = label;
            labelElement.style.cssText = `
                margin-top: 5px;
                font-size: 0.85em;
                color: rgba(255, 255, 255, 0.8);
            `;
        }

        ledContainer.appendChild(led);
        if (labelElement) ledContainer.appendChild(labelElement);
        container.appendChild(ledContainer);

        let isOn = initialState;

        const component = {
            id,
            setState: (state) => {
                isOn = state;
                led.style.backgroundImage = `url('Assets/${isOn ? 'led_on.png' : 'led_off.png'})`;
            },
            getState: () => isOn,
            destroy: () => ledContainer.remove()
        };

        this.components.set(id, component);
        return component;
    }

    // ============================================
    // Cleanup
    // ============================================
    destroyComponent(id) {
        const component = this.components.get(id);
        if (component && component.destroy) {
            component.destroy();
            this.components.delete(id);
        }
    }

    destroyAll() {
        this.components.forEach((component) => {
            if (component.destroy) component.destroy();
        });
        this.components.clear();
    }
}

// Export for use
window.UIComponents = UIComponents;
