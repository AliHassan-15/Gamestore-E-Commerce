const { Category, Subcategory, Product } = require('../models');
const { logger } = require('../utils/logger');
const { Op } = require('sequelize');

const categoryController = {
  // Get all categories
  getAllCategories: async (req, res) => {
    try {
      const categories = await Category.findAll({
        where: { is_active: true },
        include: [
          {
            model: Subcategory,
            as: 'subcategories',
            where: { is_active: true },
            required: false,
            attributes: ['id', 'name', 'description', 'slug', 'sort_order']
          }
        ],
        order: [
          ['sort_order', 'ASC'],
          [{ model: Subcategory, as: 'subcategories' }, 'sort_order', 'ASC']
        ],
        attributes: ['id', 'name', 'description', 'slug', 'sort_order', 'image_url']
      });

      res.json({
        success: true,
        data: categories
      });
    } catch (error) {
      logger.error('Error getting categories:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get categories'
      });
    }
  },

  // Get category by ID
  getCategoryById: async (req, res) => {
    try {
      const { id } = req.params;

      const category = await Category.findByPk(id, {
        include: [
          {
            model: Subcategory,
            as: 'subcategories',
            where: { is_active: true },
            required: false,
            attributes: ['id', 'name', 'description', 'slug', 'sort_order']
          },
          {
            model: Product,
            as: 'products',
            where: { is_active: true },
            required: false,
            attributes: ['id', 'name', 'price', 'sku', 'images', 'is_featured', 'is_bestseller'],
            limit: 10
          }
        ],
        attributes: ['id', 'name', 'description', 'slug', 'sort_order', 'image_url', 'meta_title', 'meta_description']
      });

      if (!category) {
        return res.status(404).json({
          success: false,
          message: 'Category not found'
        });
      }

      res.json({
        success: true,
        data: category
      });
    } catch (error) {
      logger.error('Error getting category:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get category'
      });
    }
  },

  // Get category by slug
  getCategoryBySlug: async (req, res) => {
    try {
      const { slug } = req.params;

      const category = await Category.findOne({
        where: { slug, is_active: true },
        include: [
          {
            model: Subcategory,
            as: 'subcategories',
            where: { is_active: true },
            required: false,
            attributes: ['id', 'name', 'description', 'slug', 'sort_order']
          }
        ],
        attributes: ['id', 'name', 'description', 'slug', 'sort_order', 'image_url', 'meta_title', 'meta_description']
      });

      if (!category) {
        return res.status(404).json({
          success: false,
          message: 'Category not found'
        });
      }

      res.json({
        success: true,
        data: category
      });
    } catch (error) {
      logger.error('Error getting category by slug:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get category'
      });
    }
  },

  // Get all subcategories
  getAllSubcategories: async (req, res) => {
    try {
      const subcategories = await Subcategory.findAll({
        where: { is_active: true },
        include: [
          {
            model: Category,
            as: 'category',
            attributes: ['id', 'name', 'slug']
          }
        ],
        order: [['sort_order', 'ASC']],
        attributes: ['id', 'name', 'description', 'slug', 'sort_order', 'category_id']
      });

      res.json({
        success: true,
        data: subcategories
      });
    } catch (error) {
      logger.error('Error getting subcategories:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get subcategories'
      });
    }
  },

  // Get subcategory by ID
  getSubcategoryById: async (req, res) => {
    try {
      const { id } = req.params;

      const subcategory = await Subcategory.findByPk(id, {
        include: [
          {
            model: Category,
            as: 'category',
            attributes: ['id', 'name', 'slug']
          },
          {
            model: Product,
            as: 'products',
            where: { is_active: true },
            required: false,
            attributes: ['id', 'name', 'price', 'sku', 'images', 'is_featured', 'is_bestseller'],
            limit: 10
          }
        ],
        attributes: ['id', 'name', 'description', 'slug', 'sort_order', 'category_id', 'meta_title', 'meta_description']
      });

      if (!subcategory) {
        return res.status(404).json({
          success: false,
          message: 'Subcategory not found'
        });
      }

      res.json({
        success: true,
        data: subcategory
      });
    } catch (error) {
      logger.error('Error getting subcategory:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get subcategory'
      });
    }
  },

  // Get subcategory by slug
  getSubcategoryBySlug: async (req, res) => {
    try {
      const { slug } = req.params;

      const subcategory = await Subcategory.findOne({
        where: { slug, is_active: true },
        include: [
          {
            model: Category,
            as: 'category',
            attributes: ['id', 'name', 'slug']
          }
        ],
        attributes: ['id', 'name', 'description', 'slug', 'sort_order', 'category_id', 'meta_title', 'meta_description']
      });

      if (!subcategory) {
        return res.status(404).json({
          success: false,
          message: 'Subcategory not found'
        });
      }

      res.json({
        success: true,
        data: subcategory
      });
    } catch (error) {
      logger.error('Error getting subcategory by slug:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get subcategory'
      });
    }
  },

  // Admin: Create category
  createCategory: async (req, res) => {
    try {
      const { name, description, slug, sort_order, image_url, meta_title, meta_description } = req.body;

      // Check if category with same slug exists
      const existingCategory = await Category.findOne({ where: { slug } });
      if (existingCategory) {
        return res.status(400).json({
          success: false,
          message: 'Category with this slug already exists'
        });
      }

      const category = await Category.create({
        name,
        description,
        slug,
        sort_order: sort_order || 0,
        image_url,
        meta_title,
        meta_description,
        is_active: true
      });

      res.status(201).json({
        success: true,
        message: 'Category created successfully',
        data: category
      });
    } catch (error) {
      logger.error('Error creating category:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create category'
      });
    }
  },

  // Admin: Update category
  updateCategory: async (req, res) => {
    try {
      const { id } = req.params;
      const { name, description, slug, sort_order, image_url, meta_title, meta_description, is_active } = req.body;

      const category = await Category.findByPk(id);
      if (!category) {
        return res.status(404).json({
          success: false,
          message: 'Category not found'
        });
      }

      // Check if slug is being changed and if it conflicts
      if (slug && slug !== category.slug) {
        const existingCategory = await Category.findOne({ where: { slug } });
        if (existingCategory) {
          return res.status(400).json({
            success: false,
            message: 'Category with this slug already exists'
          });
        }
      }

      await category.update({
        name,
        description,
        slug,
        sort_order,
        image_url,
        meta_title,
        meta_description,
        is_active
      });

      res.json({
        success: true,
        message: 'Category updated successfully',
        data: category
      });
    } catch (error) {
      logger.error('Error updating category:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update category'
      });
    }
  },

  // Admin: Delete category
  deleteCategory: async (req, res) => {
    try {
      const { id } = req.params;

      const category = await Category.findByPk(id);
      if (!category) {
        return res.status(404).json({
          success: false,
          message: 'Category not found'
        });
      }

      // Check if category has products
      const productCount = await Product.count({ where: { category_id: id } });
      if (productCount > 0) {
        return res.status(400).json({
          success: false,
          message: `Cannot delete category. It has ${productCount} associated products.`
        });
      }

      // Check if category has subcategories
      const subcategoryCount = await Subcategory.count({ where: { category_id: id } });
      if (subcategoryCount > 0) {
        return res.status(400).json({
          success: false,
          message: `Cannot delete category. It has ${subcategoryCount} associated subcategories.`
        });
      }

      await category.destroy();

      res.json({
        success: true,
        message: 'Category deleted successfully'
      });
    } catch (error) {
      logger.error('Error deleting category:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete category'
      });
    }
  },

  // Admin: Create subcategory
  createSubcategory: async (req, res) => {
    try {
      const { name, description, slug, category_id, sort_order, meta_title, meta_description } = req.body;

      // Validate category exists
      const category = await Category.findByPk(category_id);
      if (!category) {
        return res.status(404).json({
          success: false,
          message: 'Parent category not found'
        });
      }

      // Check if subcategory with same slug exists
      const existingSubcategory = await Subcategory.findOne({ where: { slug } });
      if (existingSubcategory) {
        return res.status(400).json({
          success: false,
          message: 'Subcategory with this slug already exists'
        });
      }

      const subcategory = await Subcategory.create({
        name,
        description,
        slug,
        category_id,
        sort_order: sort_order || 0,
        meta_title,
        meta_description,
        is_active: true
      });

      res.status(201).json({
        success: true,
        message: 'Subcategory created successfully',
        data: subcategory
      });
    } catch (error) {
      logger.error('Error creating subcategory:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create subcategory'
      });
    }
  },

  // Admin: Update subcategory
  updateSubcategory: async (req, res) => {
    try {
      const { id } = req.params;
      const { name, description, slug, category_id, sort_order, meta_title, meta_description, is_active } = req.body;

      const subcategory = await Subcategory.findByPk(id);
      if (!subcategory) {
        return res.status(404).json({
          success: false,
          message: 'Subcategory not found'
        });
      }

      // Validate category exists if changing
      if (category_id && category_id !== subcategory.category_id) {
        const category = await Category.findByPk(category_id);
        if (!category) {
          return res.status(404).json({
            success: false,
            message: 'Parent category not found'
          });
        }
      }

      // Check if slug is being changed and if it conflicts
      if (slug && slug !== subcategory.slug) {
        const existingSubcategory = await Subcategory.findOne({ where: { slug } });
        if (existingSubcategory) {
          return res.status(400).json({
            success: false,
            message: 'Subcategory with this slug already exists'
          });
        }
      }

      await subcategory.update({
        name,
        description,
        slug,
        category_id,
        sort_order,
        meta_title,
        meta_description,
        is_active
      });

      res.json({
        success: true,
        message: 'Subcategory updated successfully',
        data: subcategory
      });
    } catch (error) {
      logger.error('Error updating subcategory:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update subcategory'
      });
    }
  },

  // Admin: Delete subcategory
  deleteSubcategory: async (req, res) => {
    try {
      const { id } = req.params;

      const subcategory = await Subcategory.findByPk(id);
      if (!subcategory) {
        return res.status(404).json({
          success: false,
          message: 'Subcategory not found'
        });
      }

      // Check if subcategory has products
      const productCount = await Product.count({ where: { subcategory_id: id } });
      if (productCount > 0) {
        return res.status(400).json({
          success: false,
          message: `Cannot delete subcategory. It has ${productCount} associated products.`
        });
      }

      await subcategory.destroy();

      res.json({
        success: true,
        message: 'Subcategory deleted successfully'
      });
    } catch (error) {
      logger.error('Error deleting subcategory:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete subcategory'
      });
    }
  }
};

module.exports = { categoryController }; 