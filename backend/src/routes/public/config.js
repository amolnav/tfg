const express = require('express');
const router = express.Router();
const configService = require('../../services/configService');
const { asyncHandler } = require('../../middleware/errorHandler');

/**
 * GET /api/public/config
 * Retrieves public front-end configurations like specialties.
 */
router.get('/', asyncHandler(async (req, res) => {
  const config = await configService.getPublicFrontendConfig();

  res.json({
    status: 'success',
    data: config
  });
}));

module.exports = router;
