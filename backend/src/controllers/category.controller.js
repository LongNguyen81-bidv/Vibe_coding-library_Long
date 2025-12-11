const prisma = require('../config/prisma');

/**
 * Get all categories
 * GET /api/categories
 */
const getAllCategories = async (req, res) => {
  try {
    const categories = await prisma.category.findMany({
      orderBy: {
        name: 'asc'
      }
    });

    res.json({
      success: true,
      data: categories
    });
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({
      success: false,
      message: 'Đã xảy ra lỗi khi lấy danh sách thể loại'
    });
  }
};

/**
 * Create a new category
 * POST /api/categories
 */
const createCategory = async (req, res) => {
  try {
    const { name } = req.body;

    // Check if category name already exists
    const existingCategory = await prisma.category.findUnique({
      where: { name }
    });

    if (existingCategory) {
      return res.status(400).json({
        success: false,
        message: 'Thể loại này đã tồn tại',
        errors: [{ field: 'name', message: 'Thể loại này đã tồn tại' }]
      });
    }

    const category = await prisma.category.create({
      data: { name }
    });

    res.status(201).json({
      success: true,
      message: 'Thêm thể loại thành công!',
      data: category
    });
  } catch (error) {
    console.error('Create category error:', error);
    
    // Handle unique constraint violation
    if (error.code === 'P2002') {
      return res.status(400).json({
        success: false,
        message: 'Thể loại này đã tồn tại',
        errors: [{ field: 'name', message: 'Thể loại này đã tồn tại' }]
      });
    }

    res.status(500).json({
      success: false,
      message: 'Đã xảy ra lỗi khi thêm thể loại'
    });
  }
};

/**
 * Update a category
 * PUT /api/categories/:id
 */
const updateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { name } = req.body;

    // Check if category exists
    const existingCategory = await prisma.category.findUnique({
      where: { id }
    });

    if (!existingCategory) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy thể loại'
      });
    }

    // Check if new name already exists (excluding current category)
    const duplicateCategory = await prisma.category.findFirst({
      where: {
        name,
        id: { not: id }
      }
    });

    if (duplicateCategory) {
      return res.status(400).json({
        success: false,
        message: 'Thể loại này đã tồn tại',
        errors: [{ field: 'name', message: 'Thể loại này đã tồn tại' }]
      });
    }

    const updatedCategory = await prisma.category.update({
      where: { id },
      data: { name }
    });

    res.json({
      success: true,
      message: 'Cập nhật thành công!',
      data: updatedCategory
    });
  } catch (error) {
    console.error('Update category error:', error);
    
    // Handle unique constraint violation
    if (error.code === 'P2002') {
      return res.status(400).json({
        success: false,
        message: 'Thể loại này đã tồn tại',
        errors: [{ field: 'name', message: 'Thể loại này đã tồn tại' }]
      });
    }

    if (error.code === 'P2025') {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy thể loại'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Đã xảy ra lỗi khi cập nhật thể loại'
    });
  }
};

/**
 * Delete a category
 * DELETE /api/categories/:id
 */
const deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if category exists
    const category = await prisma.category.findUnique({
      where: { id },
      include: {
        books: {
          select: { id: true }
        }
      }
    });

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy thể loại'
      });
    }

    // Check if category has books
    if (category.books.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Không thể xóa thể loại đang có sách thuộc về'
      });
    }

    await prisma.category.delete({
      where: { id }
    });

    res.json({
      success: true,
      message: 'Xóa thể loại thành công!'
    });
  } catch (error) {
    console.error('Delete category error:', error);

    // Handle foreign key constraint violation
    if (error.code === 'P2003') {
      return res.status(400).json({
        success: false,
        message: 'Không thể xóa thể loại đang có sách thuộc về'
      });
    }

    if (error.code === 'P2025') {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy thể loại'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Đã xảy ra lỗi khi xóa thể loại'
    });
  }
};

module.exports = {
  getAllCategories,
  createCategory,
  updateCategory,
  deleteCategory
};

