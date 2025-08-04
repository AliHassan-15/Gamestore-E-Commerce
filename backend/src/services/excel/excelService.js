const XLSX = require('xlsx');
const { logger } = require('../../utils/logger');
const { Category, Subcategory, Product } = require('../../models');

const excelService = {
  // Import categories from Excel
  importCategories: async (filePath) => {
    try {
      const workbook = XLSX.readFile(filePath);
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const data = XLSX.utils.sheet_to_json(worksheet);

      const results = {
        success: [],
        errors: [],
        total: data.length
      };

      for (const row of data) {
        try {
          const categoryData = {
            name: row.name || row.Name || row.CATEGORY_NAME,
            description: row.description || row.Description || row.DESCRIPTION || '',
            image_url: row.image_url || row.ImageUrl || row.IMAGE_URL || '',
            is_active: row.is_active !== undefined ? row.is_active : true,
            sort_order: row.sort_order || row.SortOrder || row.SORT_ORDER || 0,
            meta_title: row.meta_title || row.MetaTitle || row.META_TITLE || '',
            meta_description: row.meta_description || row.MetaDescription || row.META_DESCRIPTION || ''
          };

          // Check if category already exists
          const existingCategory = await Category.findOne({
            where: { name: categoryData.name }
          });

          if (existingCategory) {
            results.errors.push({
              row: data.indexOf(row) + 1,
              error: `Category "${categoryData.name}" already exists`
            });
            continue;
          }

          const category = await Category.create(categoryData);
          results.success.push({
            id: category.id,
            name: category.name
          });

          logger.info(`Category imported: ${category.name}`);
        } catch (error) {
          results.errors.push({
            row: data.indexOf(row) + 1,
            error: error.message
          });
        }
      }

      return results;
    } catch (error) {
      logger.error('Import categories error:', error);
      throw error;
    }
  },

  // Import subcategories from Excel
  importSubcategories: async (filePath) => {
    try {
      const workbook = XLSX.readFile(filePath);
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const data = XLSX.utils.sheet_to_json(worksheet);

      const results = {
        success: [],
        errors: [],
        total: data.length
      };

      for (const row of data) {
        try {
          const subcategoryData = {
            name: row.name || row.Name || row.SUBCATEGORY_NAME,
            description: row.description || row.Description || row.DESCRIPTION || '',
            category_id: row.category_id || row.CategoryId || row.CATEGORY_ID,
            image_url: row.image_url || row.ImageUrl || row.IMAGE_URL || '',
            is_active: row.is_active !== undefined ? row.is_active : true,
            sort_order: row.sort_order || row.SortOrder || row.SORT_ORDER || 0,
            meta_title: row.meta_title || row.MetaTitle || row.META_TITLE || '',
            meta_description: row.meta_description || row.MetaDescription || row.META_DESCRIPTION || ''
          };

          // Check if category exists
          const category = await Category.findByPk(subcategoryData.category_id);
          if (!category) {
            results.errors.push({
              row: data.indexOf(row) + 1,
              error: `Category with ID ${subcategoryData.category_id} not found`
            });
            continue;
          }

          // Check if subcategory already exists
          const existingSubcategory = await Subcategory.findOne({
            where: { 
              name: subcategoryData.name,
              category_id: subcategoryData.category_id
            }
          });

          if (existingSubcategory) {
            results.errors.push({
              row: data.indexOf(row) + 1,
              error: `Subcategory "${subcategoryData.name}" already exists in category "${category.name}"`
            });
            continue;
          }

          const subcategory = await Subcategory.create(subcategoryData);
          results.success.push({
            id: subcategory.id,
            name: subcategory.name,
            category: category.name
          });

          logger.info(`Subcategory imported: ${subcategory.name} in category ${category.name}`);
        } catch (error) {
          results.errors.push({
            row: data.indexOf(row) + 1,
            error: error.message
          });
        }
      }

      return results;
    } catch (error) {
      logger.error('Import subcategories error:', error);
      throw error;
    }
  },

  // Import products from Excel
  importProducts: async (filePath) => {
    try {
      const workbook = XLSX.readFile(filePath);
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const data = XLSX.utils.sheet_to_json(worksheet);

      const results = {
        success: [],
        errors: [],
        total: data.length
      };

      for (const row of data) {
        try {
          const productData = {
            name: row.name || row.Name || row.PRODUCT_NAME,
            description: row.description || row.Description || row.DESCRIPTION || '',
            short_description: row.short_description || row.ShortDescription || row.SHORT_DESCRIPTION || '',
            price: parseFloat(row.price || row.Price || row.PRICE || 0),
            sale_price: row.sale_price || row.SalePrice || row.SALE_PRICE ? parseFloat(row.sale_price || row.SalePrice || row.SALE_PRICE) : null,
            cost_price: row.cost_price || row.CostPrice || row.COST_PRICE ? parseFloat(row.cost_price || row.CostPrice || row.COST_PRICE) : null,
            category_id: row.category_id || row.CategoryId || row.CATEGORY_ID,
            subcategory_id: row.subcategory_id || row.SubcategoryId || row.SUBCATEGORY_ID,
            sku: row.sku || row.SKU || row.Sku,
            stock_quantity: parseInt(row.stock_quantity || row.StockQuantity || row.STOCK_QUANTITY || 0),
            min_stock_level: parseInt(row.min_stock_level || row.MinStockLevel || row.MIN_STOCK_LEVEL || 5),
            weight: row.weight || row.Weight || row.WEIGHT ? parseFloat(row.weight || row.Weight || row.WEIGHT) : null,
            dimensions: row.dimensions || row.Dimensions || row.DIMENSIONS || '',
            tags: row.tags || row.Tags || row.TAGS ? (row.tags || row.Tags || row.TAGS).split(',').map(tag => tag.trim()) : [],
            is_active: row.is_active !== undefined ? row.is_active : true,
            is_featured: row.is_featured !== undefined ? row.is_featured : false,
            is_bestseller: row.is_bestseller !== undefined ? row.is_bestseller : false,
            meta_title: row.meta_title || row.MetaTitle || row.META_TITLE || '',
            meta_description: row.meta_description || row.MetaDescription || row.META_DESCRIPTION || '',
            specifications: row.specifications || row.Specifications || row.SPECIFICATIONS ? JSON.parse(row.specifications || row.Specifications || row.SPECIFICATIONS) : {},
            warranty_info: row.warranty_info || row.WarrantyInfo || row.WARRANTY_INFO || '',
            shipping_info: row.shipping_info || row.ShippingInfo || row.SHIPPING_INFO || '',
            return_policy: row.return_policy || row.ReturnPolicy || row.RETURN_POLICY || ''
          };

          // Check if SKU already exists
          const existingProduct = await Product.findOne({
            where: { sku: productData.sku }
          });

          if (existingProduct) {
            results.errors.push({
              row: data.indexOf(row) + 1,
              error: `Product with SKU "${productData.sku}" already exists`
            });
            continue;
          }

          // Validate category and subcategory
          if (productData.category_id) {
            const category = await Category.findByPk(productData.category_id);
            if (!category) {
              results.errors.push({
                row: data.indexOf(row) + 1,
                error: `Category with ID ${productData.category_id} not found`
              });
              continue;
            }
          }

          if (productData.subcategory_id) {
            const subcategory = await Subcategory.findByPk(productData.subcategory_id);
            if (!subcategory) {
              results.errors.push({
                row: data.indexOf(row) + 1,
                error: `Subcategory with ID ${productData.subcategory_id} not found`
              });
              continue;
            }
          }

          const product = await Product.create(productData);
          results.success.push({
            id: product.id,
            name: product.name,
            sku: product.sku
          });

          logger.info(`Product imported: ${product.name} (SKU: ${product.sku})`);
        } catch (error) {
          results.errors.push({
            row: data.indexOf(row) + 1,
            error: error.message
          });
        }
      }

      return results;
    } catch (error) {
      logger.error('Import products error:', error);
      throw error;
    }
  },

  // Export categories to Excel
  exportCategories: async () => {
    try {
      const categories = await Category.findAll({
        include: [
          { model: Subcategory, as: 'subcategories' }
        ],
        order: [['sort_order', 'ASC'], ['name', 'ASC']]
      });

      const data = categories.map(category => ({
        'Category ID': category.id,
        'Category Name': category.name,
        'Description': category.description || '',
        'Image URL': category.image_url || '',
        'Active': category.is_active ? 'Yes' : 'No',
        'Sort Order': category.sort_order,
        'Meta Title': category.meta_title || '',
        'Meta Description': category.meta_description || '',
        'Created Date': category.created_at,
        'Subcategories Count': category.subcategories ? category.subcategories.length : 0
      }));

      const worksheet = XLSX.utils.json_to_sheet(data);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Categories');

      const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
      
      logger.info(`Categories exported: ${categories.length} categories`);
      return buffer;
    } catch (error) {
      logger.error('Export categories error:', error);
      throw error;
    }
  },

  // Export subcategories to Excel
  exportSubcategories: async () => {
    try {
      const subcategories = await Subcategory.findAll({
        include: [
          { model: Category, as: 'category' }
        ],
        order: [['category_id', 'ASC'], ['sort_order', 'ASC'], ['name', 'ASC']]
      });

      const data = subcategories.map(subcategory => ({
        'Subcategory ID': subcategory.id,
        'Subcategory Name': subcategory.name,
        'Category ID': subcategory.category_id,
        'Category Name': subcategory.category ? subcategory.category.name : '',
        'Description': subcategory.description || '',
        'Image URL': subcategory.image_url || '',
        'Active': subcategory.is_active ? 'Yes' : 'No',
        'Sort Order': subcategory.sort_order,
        'Meta Title': subcategory.meta_title || '',
        'Meta Description': subcategory.meta_description || '',
        'Created Date': subcategory.created_at
      }));

      const worksheet = XLSX.utils.json_to_sheet(data);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Subcategories');

      const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
      
      logger.info(`Subcategories exported: ${subcategories.length} subcategories`);
      return buffer;
    } catch (error) {
      logger.error('Export subcategories error:', error);
      throw error;
    }
  },

  // Export products to Excel
  exportProducts: async () => {
    try {
      const products = await Product.findAll({
        include: [
          { model: Category, as: 'category' },
          { model: Subcategory, as: 'subcategory' }
        ],
        order: [['created_at', 'DESC']]
      });

      const data = products.map(product => ({
        'Product ID': product.id,
        'Product Name': product.name,
        'SKU': product.sku,
        'Description': product.description || '',
        'Short Description': product.short_description || '',
        'Price': product.price,
        'Sale Price': product.sale_price || '',
        'Cost Price': product.cost_price || '',
        'Category ID': product.category_id || '',
        'Category Name': product.category ? product.category.name : '',
        'Subcategory ID': product.subcategory_id || '',
        'Subcategory Name': product.subcategory ? product.subcategory.name : '',
        'Stock Quantity': product.stock_quantity,
        'Min Stock Level': product.min_stock_level,
        'Weight': product.weight || '',
        'Dimensions': product.dimensions || '',
        'Tags': product.tags ? product.tags.join(', ') : '',
        'Active': product.is_active ? 'Yes' : 'No',
        'Featured': product.is_featured ? 'Yes' : 'No',
        'Bestseller': product.is_bestseller ? 'Yes' : 'No',
        'Meta Title': product.meta_title || '',
        'Meta Description': product.meta_description || '',
        'Warranty Info': product.warranty_info || '',
        'Shipping Info': product.shipping_info || '',
        'Return Policy': product.return_policy || '',
        'Created Date': product.created_at
      }));

      const worksheet = XLSX.utils.json_to_sheet(data);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Products');

      const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
      
      logger.info(`Products exported: ${products.length} products`);
      return buffer;
    } catch (error) {
      logger.error('Export products error:', error);
      throw error;
    }
  },

  // Generate sample Excel template
  generateCategoryTemplate: () => {
    const template = [
      {
        'name': 'Action Games',
        'description': 'Fast-paced action games',
        'image_url': 'https://example.com/action-games.jpg',
        'is_active': true,
        'sort_order': 1,
        'meta_title': 'Action Games - GameStore',
        'meta_description': 'Browse our collection of action games'
      },
      {
        'name': 'RPG Games',
        'description': 'Role-playing games',
        'image_url': 'https://example.com/rpg-games.jpg',
        'is_active': true,
        'sort_order': 2,
        'meta_title': 'RPG Games - GameStore',
        'meta_description': 'Browse our collection of RPG games'
      }
    ];

    const worksheet = XLSX.utils.json_to_sheet(template);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Categories Template');

    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
    return buffer;
  },

  generateProductTemplate: () => {
    const template = [
      {
        'name': 'Sample Game',
        'description': 'This is a sample game description',
        'short_description': 'Short description',
        'price': 59.99,
        'sale_price': 49.99,
        'cost_price': 30.00,
        'category_id': 1,
        'subcategory_id': 1,
        'sku': 'GAME-001',
        'stock_quantity': 100,
        'min_stock_level': 10,
        'weight': 0.5,
        'dimensions': '10x5x1 inches',
        'tags': 'action, adventure, multiplayer',
        'is_active': true,
        'is_featured': false,
        'is_bestseller': false,
        'meta_title': 'Sample Game - GameStore',
        'meta_description': 'Buy Sample Game at GameStore',
        'warranty_info': '1 year warranty',
        'shipping_info': 'Free shipping on orders over $50',
        'return_policy': '30-day return policy'
      }
    ];

    const worksheet = XLSX.utils.json_to_sheet(template);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Products Template');

    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
    return buffer;
  }
};

module.exports = { excelService }; 