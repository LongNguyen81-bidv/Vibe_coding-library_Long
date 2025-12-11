const prisma = require('../config/prisma');

/**
 * Get all fine levels
 * GET /api/fine-levels
 */
const getAllFineLevels = async (req, res) => {
  try {
    const fineLevels = await prisma.fineLevel.findMany({
      orderBy: {
        createdAt: 'desc'
      }
    });

    res.json({
      success: true,
      data: fineLevels
    });
  } catch (error) {
    console.error('Get fine levels error:', error);
    res.status(500).json({
      success: false,
      message: 'Đã xảy ra lỗi khi lấy danh sách mức phạt'
    });
  }
};

/**
 * Create a new fine level
 * POST /api/fine-levels
 */
const createFineLevel = async (req, res) => {
  try {
    const { name, amount, description } = req.body;

    // Check if fine level name already exists
    const existingFineLevel = await prisma.fineLevel.findUnique({
      where: { name }
    });

    if (existingFineLevel) {
      return res.status(400).json({
        success: false,
        message: 'Mức phạt này đã tồn tại',
        errors: [{ field: 'name', message: 'Mức phạt này đã tồn tại' }]
      });
    }

    const fineLevel = await prisma.fineLevel.create({
      data: {
        name,
        amount: parseFloat(amount),
        description: description || null
      }
    });

    res.status(201).json({
      success: true,
      message: 'Thêm mức phạt thành công!',
      data: fineLevel
    });
  } catch (error) {
    console.error('Create fine level error:', error);
    
    // Handle unique constraint violation
    if (error.code === 'P2002') {
      return res.status(400).json({
        success: false,
        message: 'Mức phạt này đã tồn tại',
        errors: [{ field: 'name', message: 'Mức phạt này đã tồn tại' }]
      });
    }

    res.status(500).json({
      success: false,
      message: 'Đã xảy ra lỗi khi thêm mức phạt'
    });
  }
};

/**
 * Update a fine level
 * PUT /api/fine-levels/:id
 */
const updateFineLevel = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, amount, description } = req.body;

    // Check if fine level exists
    const existingFineLevel = await prisma.fineLevel.findUnique({
      where: { id }
    });

    if (!existingFineLevel) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy mức phạt'
      });
    }

    // Check if new name already exists (excluding current fine level)
    if (name && name !== existingFineLevel.name) {
      const duplicateFineLevel = await prisma.fineLevel.findFirst({
        where: {
          name,
          id: { not: id }
        }
      });

      if (duplicateFineLevel) {
        return res.status(400).json({
          success: false,
          message: 'Mức phạt này đã tồn tại',
          errors: [{ field: 'name', message: 'Mức phạt này đã tồn tại' }]
        });
      }
    }

    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (amount !== undefined) updateData.amount = parseFloat(amount);
    if (description !== undefined) updateData.description = description || null;

    const updatedFineLevel = await prisma.fineLevel.update({
      where: { id },
      data: updateData
    });

    res.json({
      success: true,
      message: 'Cập nhật thành công!',
      data: updatedFineLevel
    });
  } catch (error) {
    console.error('Update fine level error:', error);
    
    // Handle unique constraint violation
    if (error.code === 'P2002') {
      return res.status(400).json({
        success: false,
        message: 'Mức phạt này đã tồn tại',
        errors: [{ field: 'name', message: 'Mức phạt này đã tồn tại' }]
      });
    }

    if (error.code === 'P2025') {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy mức phạt'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Đã xảy ra lỗi khi cập nhật mức phạt'
    });
  }
};

/**
 * Delete a fine level
 * DELETE /api/fine-levels/:id
 */
const deleteFineLevel = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if fine level exists
    const fineLevel = await prisma.fineLevel.findUnique({
      where: { id },
      include: {
        fines: {
          select: { id: true }
        }
      }
    });

    if (!fineLevel) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy mức phạt'
      });
    }

    // Check if fine level is being used in any fine
    if (fineLevel.fines.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Không thể xóa mức phạt đang được sử dụng'
      });
    }

    await prisma.fineLevel.delete({
      where: { id }
    });

    res.json({
      success: true,
      message: 'Xóa mức phạt thành công!'
    });
  } catch (error) {
    console.error('Delete fine level error:', error);

    // Handle foreign key constraint violation
    if (error.code === 'P2003') {
      return res.status(400).json({
        success: false,
        message: 'Không thể xóa mức phạt đang được sử dụng'
      });
    }

    if (error.code === 'P2025') {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy mức phạt'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Đã xảy ra lỗi khi xóa mức phạt'
    });
  }
};

module.exports = {
  getAllFineLevels,
  createFineLevel,
  updateFineLevel,
  deleteFineLevel
};

