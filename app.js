const controls = {
  brightness: document.getElementById('brightness'),
  contrast: document.getElementById('contrast'),
  saturation: document.getElementById('saturation'),
  sharpness: document.getElementById('sharpness'),
  denoise: document.getElementById('denoise'),
  warmth: document.getElementById('warmth'),
  grayscale: document.getElementById('grayscale'),
  blur: document.getElementById('blur'),
  vignette: document.getElementById('vignette'),
};

const valueLabels = {
  brightness: document.getElementById('brightnessValue'),
  contrast: document.getElementById('contrastValue'),
  saturation: document.getElementById('saturationValue'),
  sharpness: document.getElementById('sharpnessValue'),
  denoise: document.getElementById('denoiseValue'),
  warmth: document.getElementById('warmthValue'),
  grayscale: document.getElementById('grayscaleValue'),
  blur: document.getElementById('blurValue'),
  vignette: document.getElementById('vignetteValue'),
};

const fileInput = document.getElementById('fileInput');
const presetSelect = document.getElementById('presetSelect');
const previewCanvas = document.getElementById('previewCanvas');
const placeholder = document.getElementById('placeholder');
const statusPill = document.getElementById('statusPill');
const resetBtn = document.getElementById('resetBtn');
const savePngBtn = document.getElementById('savePngBtn');
const saveJpgBtn = document.getElementById('saveJpgBtn');

const state = {
  image: null,
  originalImageData: null,
  hasImage: false,
  activePreset: 'custom',
};

const defaultValues = {
  brightness: 100,
  contrast: 100,
  saturation: 100,
  sharpness: 0,
  denoise: 0,
  warmth: 0,
  grayscale: 0,
  blur: 0,
  vignette: 0,
};

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function updateValueLabel(name, value) {
  const label = valueLabels[name];
  if (!label) return;

  if (['brightness', 'contrast', 'saturation'].includes(name)) {
    label.textContent = `${value}%`;
    return;
  }

  if (name === 'grayscale') {
    label.textContent = `${value}%`;
    return;
  }

  if (name === 'blur') {
    label.textContent = `${value}px`;
    return;
  }

  if (name === 'warmth') {
    label.textContent = `${value > 0 ? '+' : ''}${value}`;
    return;
  }

  label.textContent = value;
}

function syncControlDisplay() {
  Object.entries(controls).forEach(([name, input]) => {
    updateValueLabel(name, Number(input.value));
  });
}

function setControlValues(values) {
  Object.entries(values).forEach(([name, value]) => {
    const input = controls[name];
    if (!input) return;
    input.value = value;
    updateValueLabel(name, Number(value));
  });
}

function applyPreset(name) {
  const presets = {
    custom: { ...defaultValues },
    portrait: {
      brightness: 110,
      contrast: 120,
      saturation: 118,
      sharpness: 38,
      denoise: 4,
      warmth: 12,
      grayscale: 0,
      blur: 0,
      vignette: 20,
    },
    enhance: {
      brightness: 108,
      contrast: 130,
      saturation: 118,
      sharpness: 52,
      denoise: 6,
      warmth: 8,
      grayscale: 0,
      blur: 0,
      vignette: 8,
    },
    cinematic: {
      brightness: 96,
      contrast: 140,
      saturation: 110,
      sharpness: 48,
      denoise: 8,
      warmth: 20,
      grayscale: 10,
      blur: 0,
      vignette: 34,
    },
    blackwhite: {
      brightness: 106,
      contrast: 120,
      saturation: 0,
      sharpness: 22,
      denoise: 5,
      warmth: 0,
      grayscale: 100,
      blur: 0,
      vignette: 10,
    },
  };

  const preset = presets[name] || presets.custom;
  setControlValues(preset);
  renderImage();
}

function readImageFile(file) {
  if (!file || !file.type.startsWith('image/')) return;

  const reader = new FileReader();
  reader.onload = (event) => {
    const img = new Image();
    img.onload = () => {
      state.image = img;
      state.hasImage = true;
      state.originalImageData = null;
      placeholder.classList.add('hidden');
      statusPill.textContent = `${file.name}`;
      renderImage();
    };
    img.src = event.target.result;
  };
  reader.readAsDataURL(file);
}

function getCanvasSize() {
  const canvas = previewCanvas;
  return { width: canvas.width, height: canvas.height };
}

function createBlankCanvas(width, height) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  return canvas;
}

function normalizeInt(value) {
  return clamp(Math.round(value), 0, 255);
}

function applyPixelAdjustments(imageData, options) {
  const { data } = imageData;
  const brightness = options.brightness / 100;
  const contrast = options.contrast / 100;
  const saturation = options.saturation / 100;
  const grayscale = options.grayscale / 100;
  const warmth = options.warmth;

  for (let i = 0; i < data.length; i += 4) {
    let r = data[i];
    let g = data[i + 1];
    let b = data[i + 2];

    r = r * brightness;
    g = g * brightness;
    b = b * brightness;

    r = (r - 128) * contrast + 128;
    g = (g - 128) * contrast + 128;
    b = (b - 128) * contrast + 128;

    const avg = (r + g + b) / 3;
    const grayscaleFactor = 1 - grayscale;
    r = r * grayscaleFactor + avg * grayscale;
    g = g * grayscaleFactor + avg * grayscale;
    b = b * grayscaleFactor + avg * grayscale;

    const sR = (r - avg) * saturation + avg;
    const sG = (g - avg) * saturation + avg;
    const sB = (b - avg) * saturation + avg;

    if (warmth > 0) {
      r = clamp(sR + warmth, 0, 255);
      g = clamp(sG + warmth * 0.5, 0, 255);
      b = clamp(sB - warmth * 0.5, 0, 255);
    } else if (warmth < 0) {
      r = clamp(sR + warmth * 0.6, 0, 255);
      g = clamp(sG + warmth * 0.2, 0, 255);
      b = clamp(sB - warmth * 0.8, 0, 255);
    } else {
      r = sR;
      g = sG;
      b = sB;
    }

    data[i] = normalizeInt(r);
    data[i + 1] = normalizeInt(g);
    data[i + 2] = normalizeInt(b);
  }

  return imageData;
}

function applyDenoise(imageData, strength) {
  if (strength <= 0) return imageData;

  const { data, width, height } = imageData;
  const copy = new Uint8ClampedArray(data);
  const radius = 1;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let r = 0;
      let g = 0;
      let b = 0;
      let count = 0;

      for (let yy = Math.max(0, y - radius); yy <= Math.min(height - 1, y + radius); yy++) {
        for (let xx = Math.max(0, x - radius); xx <= Math.min(width - 1, x + radius); xx++) {
          const index = (yy * width + xx) * 4;
          r += copy[index];
          g += copy[index + 1];
          b += copy[index + 2];
          count++;
        }
      }

      const index = (y * width + x) * 4;
      const factor = Math.max(0, 1 - strength / 30);
      data[index] = clamp((copy[index] * factor) + (r / count) * (1 - factor), 0, 255);
      data[index + 1] = clamp((copy[index + 1] * factor) + (g / count) * (1 - factor), 0, 255);
      data[index + 2] = clamp((copy[index + 2] * factor) + (b / count) * (1 - factor), 0, 255);
    }
  }

  return imageData;
}

function applySharpen(imageData, amount) {
  if (amount <= 0) return imageData;

  const { data, width, height } = imageData;
  const copy = new Uint8ClampedArray(data);
  const strength = amount / 100;
  const kernel = [
    0, -1, 0,
    -1, 5, -1,
    0, -1, 0,
  ];

  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      for (let c = 0; c < 3; c++) {
        let sum = 0;
        for (let ky = 0; ky < 3; ky++) {
          for (let kx = 0; kx < 3; kx++) {
            const idx = ((y + ky - 1) * width + (x + kx - 1)) * 4 + c;
            sum += copy[idx] * kernel[ky * 3 + kx];
          }
        }

        const idx = (y * width + x) * 4 + c;
        const original = copy[idx];
        const value = original + (sum - original) * strength;
        data[idx] = clamp(value, 0, 255);
      }
    }
  }

  return imageData;
}

function applyVignette(imageData, amount) {
  if (amount <= 0) return imageData;

  const { data, width, height } = imageData;
  const centerX = width / 2;
  const centerY = height / 2;
  const maxDistance = Math.sqrt((centerX ** 2) + (centerY ** 2));
  const intensity = amount / 100;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const index = (y * width + x) * 4;
      const dx = x - centerX;
      const dy = y - centerY;
      const distance = Math.sqrt((dx ** 2) + (dy ** 2));
      const factor = clamp(1 - (distance / maxDistance) * (1.4 * intensity), 0, 1);

      data[index] = data[index] * factor;
      data[index + 1] = data[index + 1] * factor;
      data[index + 2] = data[index + 2] * factor;
    }
  }

  return imageData;
}

function applyBlur(imageData, radius) {
  if (radius <= 0) return imageData;

  const { data, width, height } = imageData;
  const copy = new Uint8ClampedArray(data);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      let r = 0;
      let g = 0;
      let b = 0;
      let count = 0;

      for (let yy = -radius; yy <= radius; yy++) {
        for (let xx = -radius; xx <= radius; xx++) {
          const px = clamp(x + xx, 0, width - 1);
          const py = clamp(y + yy, 0, height - 1);
          const source = (py * width + px) * 4;
          r += copy[source];
          g += copy[source + 1];
          b += copy[source + 2];
          count++;
        }
      }

      data[idx] = r / count;
      data[idx + 1] = g / count;
      data[idx + 2] = b / count;
    }
  }

  return imageData;
}

function renderImage() {
  if (!state.hasImage || !state.image) {
    return;
  }

  const originalCanvas = createBlankCanvas(state.image.width, state.image.height);
  const originalCtx = originalCanvas.getContext('2d');
  originalCtx.clearRect(0, 0, originalCanvas.width, originalCanvas.height);
  originalCtx.drawImage(state.image, 0, 0);

  const outputCanvas = createBlankCanvas(originalCanvas.width, originalCanvas.height);
  const outputCtx = outputCanvas.getContext('2d');

  outputCtx.filter = `
    brightness(${controls.brightness.value}%)
    contrast(${controls.contrast.value}%)
    saturate(${controls.saturation.value}%)
    blur(${controls.blur.value}px)
    grayscale(${controls.grayscale.value}%)
  `;

  outputCtx.drawImage(originalCanvas, 0, 0);
  outputCtx.filter = 'none';

  let imageData = outputCtx.getImageData(0, 0, outputCanvas.width, outputCanvas.height);
  imageData = applyPixelAdjustments(imageData, {
    brightness: Number(controls.brightness.value),
    contrast: Number(controls.contrast.value),
    saturation: Number(controls.saturation.value),
    grayscale: Number(controls.grayscale.value),
    warmth: Number(controls.warmth.value),
  });

  imageData = applyDenoise(imageData, Number(controls.denoise.value));
  imageData = applySharpen(imageData, Number(controls.sharpness.value));
  imageData = applyBlur(imageData, Number(controls.blur.value));
  imageData = applyVignette(imageData, Number(controls.vignette.value));

  const processedCanvas = createBlankCanvas(outputCanvas.width, outputCanvas.height);
  const processedCtx = processedCanvas.getContext('2d');
  processedCtx.putImageData(imageData, 0, 0);

  const finalCanvas = createBlankCanvas(previewCanvas.width, previewCanvas.height);
  const finalCtx = finalCanvas.getContext('2d');

  const scale = Math.min(finalCanvas.width / processedCanvas.width, finalCanvas.height / processedCanvas.height);
  const scaledWidth = processedCanvas.width * scale;
  const scaledHeight = processedCanvas.height * scale;
  const offsetX = (finalCanvas.width - scaledWidth) / 2;
  const offsetY = (finalCanvas.height - scaledHeight) / 2;

  finalCtx.clearRect(0, 0, finalCanvas.width, finalCanvas.height);
  finalCtx.fillStyle = '#0a1422';
  finalCtx.fillRect(0, 0, finalCanvas.width, finalCanvas.height);
  finalCtx.drawImage(processedCanvas, offsetX, offsetY, scaledWidth, scaledHeight);

  const previewCtx = previewCanvas.getContext('2d');
  previewCtx.clearRect(0, 0, previewCanvas.width, previewCanvas.height);
  previewCtx.drawImage(finalCanvas, 0, 0);
}

function resetControls() {
  setControlValues(defaultValues);
  presetSelect.value = 'custom';
  renderImage();
}

function saveImage(type = 'image/png') {
  if (!state.hasImage || !state.image) return;

  const canvas = previewCanvas;
  const link = document.createElement('a');
  const quality = type === 'image/jpeg' ? 0.96 : undefined;
  const fileName = `pixelrefine-${Date.now()}.${type === 'image/jpeg' ? 'jpg' : 'png'}`;

  link.download = fileName;
  link.href = canvas.toDataURL(type, quality);
  link.click();
}

[...Object.keys(controls)].forEach((key) => {
  controls[key].addEventListener('input', () => {
    presetSelect.value = 'custom';
    state.activePreset = 'custom';
    updateValueLabel(key, Number(controls[key].value));
    renderImage();
  });
});

fileInput.addEventListener('change', (event) => {
  const file = event.target.files[0];
  readImageFile(file);
});

presetSelect.addEventListener('change', (event) => {
  applyPreset(event.target.value);
});

resetBtn.addEventListener('click', resetControls);

savePngBtn.addEventListener('click', () => saveImage('image/png'));
saveJpgBtn.addEventListener('click', () => saveImage('image/jpeg'));

syncControlDisplay();

previewCanvas.width = 1200;
previewCanvas.height = 800;

statusPill.textContent = 'Belum ada foto';
placeholder.classList.remove('hidden');
