const express = require('express');
const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const { authMiddleware, adminMiddleware } = require('../middleware/auth/authMiddleware');

const router = express.Router();

// Configure multer storage for product images
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../../uploads/products'));
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const uniqueName = `product-${uuidv4()}${ext}`;
    cb(null, uniqueName); 
  }
});

// File filter for product images only
const fileFilter = (req, file, cb) => {
  // Allow only image files
  const allowedTypes = /jpeg|jpg|png|gif|webp/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error('Only image files (jpeg, jpg, png, gif, webp) are allowed!'));
  }
};

const upload = multer({ 
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
});

// Admin only routes - require authentication and admin role
router.use(authMiddleware, adminMiddleware);

// POST /upload/product-images - Upload product images (Admin only)
router.post('/product-images', upload.array('images', 5), (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'No images uploaded' 
      });
    }

    const uploadedImages = req.files.map(file => ({
      filename: file.filename,
      originalname: file.originalname,
      mimetype: file.mimetype,
      size: file.size,
      path: `/uploads/products/${file.filename}`,
      url: `${req.protocol}://${req.get('host')}/uploads/products/${file.filename}`
    }));

    res.status(200).json({
      success: true,
      message: 'Product images uploaded successfully',
      data: {
        count: uploadedImages.length,
        images: uploadedImages
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Product images upload failed',
      error: error.message
    });
  }
});

// POST /upload/product-image - Upload single product image (Admin only)
router.post('/product-image', upload.single('image'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ 
        success: false, 
        message: 'No image uploaded' 
      });
    }

    const uploadedImage = {
      filename: req.file.filename,
      originalname: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size,
      path: `/uploads/products/${req.file.filename}`,
      url: `${req.protocol}://${req.get('host')}/uploads/products/${req.file.filename}`
    };

    res.status(200).json({
      success: true,
      message: 'Product image uploaded successfully',
      data: uploadedImage
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Product image upload failed',
      error: error.message
    });
  }
});

// DELETE /upload/product-image/:filename - Delete product image (Admin only)
router.delete('/product-image/:filename', (req, res) => {
  try {
    const { filename } = req.params;
    const fs = require('fs');
    const filePath = path.join(__dirname, '../../uploads/products', filename);

    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      res.status(200).json({
        success: true,
        message: 'Product image deleted successfully'
      });
    } else {
      res.status(404).json({
        success: false,
        message: 'Product image not found'
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Product image deletion failed',
      error: error.message
    });
  }
});

// GET /upload/product-images - Get list of uploaded product images (Admin only)
router.get('/product-images', (req, res) => {
  try {
    const fs = require('fs');
    const uploadsDir = path.join(__dirname, '../../uploads/products');
    
    if (!fs.existsSync(uploadsDir)) {
      return res.status(200).json({
        success: true,
        data: {
          images: []
        }
      });
    }

    const files = fs.readdirSync(uploadsDir);
    const images = files
      .filter(file => /\.(jpg|jpeg|png|gif|webp)$/i.test(file))
      .map(file => ({
        filename: file,
        path: `/uploads/products/${file}`,
        url: `${req.protocol}://${req.get('host')}/uploads/products/${file}`
      }));

    res.status(200).json({
      success: true,
      data: {
        images
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to get product images',
      error: error.message
    });
  }
});

module.exports = router; 