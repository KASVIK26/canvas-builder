const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { createCanvas, loadImage } = require('canvas');
const { generatePDF } = require('../utils/pdfGenerator');
const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

// Store canvas instances (in production, use Redis or database)
const canvasStore = new Map();

// Initialize canvas
router.post('/init', (req, res) => {
  try {
    const { width, height, id } = req.body;
    
    if (!width || !height || !id) {
      return res.status(400).json({ error: 'Width, height, and ID are required' });
    }

    if (width < 1 || height < 1 || width > 5000 || height > 5000) {
      return res.status(400).json({ error: 'Invalid canvas dimensions' });
    }

    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');
    
    // Set white background
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, width, height);
    
    // Store canvas and elements
    canvasStore.set(id, {
      canvas,
      ctx,
      elements: [],
      dimensions: { width, height }
    });

    res.json({ 
      success: true, 
      message: 'Canvas initialized successfully',
      dimensions: { width, height }
    });
  } catch (error) {
    console.error('Canvas initialization error:', error);
    res.status(500).json({ error: 'Failed to initialize canvas' });
  }
});

// Add rectangle
router.post('/add-rectangle', (req, res) => {
  try {
    const { id, x, y, width, height, fillColor, strokeColor, strokeWidth } = req.body;
    
    if (!canvasStore.has(id)) {
      return res.status(404).json({ error: 'Canvas not found' });
    }

    const { ctx, elements } = canvasStore.get(id);
    
    // Draw rectangle
    ctx.fillStyle = fillColor || '#000000';
    ctx.fillRect(x, y, width, height);
    
    if (strokeColor && strokeWidth > 0) {
      ctx.strokeStyle = strokeColor;
      ctx.lineWidth = strokeWidth;
      ctx.strokeRect(x, y, width, height);
    }
    
    // Store element data
    elements.push({
      type: 'rectangle',
      x, y, width, height,
      fillColor, strokeColor, strokeWidth,
      timestamp: Date.now()
    });

    res.json({ success: true, message: 'Rectangle added successfully' });
  } catch (error) {
    console.error('Rectangle error:', error);
    res.status(500).json({ error: 'Failed to add rectangle' });
  }
});

// Add circle
router.post('/add-circle', (req, res) => {
  try {
    const { id, x, y, radius, fillColor, strokeColor, strokeWidth } = req.body;
    
    if (!canvasStore.has(id)) {
      return res.status(404).json({ error: 'Canvas not found' });
    }

    const { ctx, elements } = canvasStore.get(id);
    
    // Draw circle
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, 2 * Math.PI);
    ctx.fillStyle = fillColor || '#000000';
    ctx.fill();
    
    if (strokeColor && strokeWidth > 0) {
      ctx.strokeStyle = strokeColor;
      ctx.lineWidth = strokeWidth;
      ctx.stroke();
    }
    
    // Store element data
    elements.push({
      type: 'circle',
      x, y, radius,
      fillColor, strokeColor, strokeWidth,
      timestamp: Date.now()
    });

    res.json({ success: true, message: 'Circle added successfully' });
  } catch (error) {
    console.error('Circle error:', error);
    res.status(500).json({ error: 'Failed to add circle' });
  }
});

// Add text
router.post('/add-text', (req, res) => {
  try {
    const { id, text, x, y, fontSize, fontFamily, fillColor, strokeColor, strokeWidth } = req.body;
    
    if (!canvasStore.has(id)) {
      return res.status(404).json({ error: 'Canvas not found' });
    }

    const { ctx, elements } = canvasStore.get(id);
    
    // Set font
    ctx.font = `${fontSize || 20}px ${fontFamily || 'Arial'}`;
    ctx.fillStyle = fillColor || '#000000';
    
    // Draw text
    ctx.fillText(text, x, y);
    
    if (strokeColor && strokeWidth > 0) {
      ctx.strokeStyle = strokeColor;
      ctx.lineWidth = strokeWidth;
      ctx.strokeText(text, x, y);
    }
    
    // Store element data
    elements.push({
      type: 'text',
      text, x, y, fontSize, fontFamily,
      fillColor, strokeColor, strokeWidth,
      timestamp: Date.now()
    });

    res.json({ success: true, message: 'Text added successfully' });
  } catch (error) {
    console.error('Text error:', error);
    res.status(500).json({ error: 'Failed to add text' });
  }
});

// Upload and add image
router.post('/add-image', upload.single('image'), async (req, res) => {
  try {
    const { id, x, y, width, height, imageUrl } = req.body;
    
    if (!canvasStore.has(id)) {
      return res.status(404).json({ error: 'Canvas not found' });
    }

    const { ctx, elements } = canvasStore.get(id);
    let imagePath;
    
    if (req.file) {
      // File upload
      imagePath = req.file.path;
    } else if (imageUrl) {
      // URL provided
      imagePath = imageUrl;
    } else {
      return res.status(400).json({ error: 'No image file or URL provided' });
    }
    
    // Load and draw image
    const image = await loadImage(imagePath);
    const drawWidth = width || image.width;
    const drawHeight = height || image.height;
    
    ctx.drawImage(image, x || 0, y || 0, drawWidth, drawHeight);
    
    // Store element data
    elements.push({
      type: 'image',
      x: x || 0,
      y: y || 0,
      width: drawWidth,
      height: drawHeight,
      src: req.file ? `/uploads/${req.file.filename}` : imageUrl,
      timestamp: Date.now()
    });

    res.json({ 
      success: true, 
      message: 'Image added successfully',
      imageInfo: {
        width: drawWidth,
        height: drawHeight,
        src: req.file ? `/uploads/${req.file.filename}` : imageUrl
      }
    });
  } catch (error) {
    console.error('Image error:', error);
    res.status(500).json({ error: 'Failed to add image' });
  }
});

// Get canvas preview
router.get('/preview/:id', (req, res) => {
  try {
    const { id } = req.params;
    
    if (!canvasStore.has(id)) {
      return res.status(404).json({ error: 'Canvas not found' });
    }

    const { canvas } = canvasStore.get(id);
    const buffer = canvas.toBuffer('image/png');
    
    res.setHeader('Content-Type', 'image/png');
    res.send(buffer);
  } catch (error) {
    console.error('Preview error:', error);
    res.status(500).json({ error: 'Failed to generate preview' });
  }
});

// Export as PDF
router.post('/export-pdf', async (req, res) => {
  try {
    const { id, filename } = req.body;
    
    if (!canvasStore.has(id)) {
      return res.status(404).json({ error: 'Canvas not found' });
    }

    const canvasData = canvasStore.get(id);
    const pdfBuffer = await generatePDF(canvasData, filename);
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename || 'canvas'}.pdf"`);
    res.send(pdfBuffer);
  } catch (error) {
    console.error('PDF export error:', error);
    res.status(500).json({ error: 'Failed to export PDF' });
  }
});

// Get canvas elements
router.get('/elements/:id', (req, res) => {
  try {
    const { id } = req.params;
    
    if (!canvasStore.has(id)) {
      return res.status(404).json({ error: 'Canvas not found' });
    }

    const { elements, dimensions } = canvasStore.get(id);
    res.json({ elements, dimensions });
  } catch (error) {
    console.error('Elements error:', error);
    res.status(500).json({ error: 'Failed to get elements' });
  }
});

// Clear canvas
router.post('/clear', (req, res) => {
  try {
    const { id } = req.body;
    
    if (!canvasStore.has(id)) {
      return res.status(404).json({ error: 'Canvas not found' });
    }

    const canvasData = canvasStore.get(id);
    const { ctx, dimensions } = canvasData;
    
    // Clear canvas
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, dimensions.width, dimensions.height);
    
    // Clear elements
    canvasData.elements = [];
    
    res.json({ success: true, message: 'Canvas cleared successfully' });
  } catch (error) {
    console.error('Clear error:', error);
    res.status(500).json({ error: 'Failed to clear canvas' });
  }
});

module.exports = router;