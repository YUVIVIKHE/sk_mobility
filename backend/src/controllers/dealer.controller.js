const dealerService = require('../services/dealer.service');
const { asyncHandler } = require('../utils/helpers');
const upload = require('../middleware/upload');

exports.list = asyncHandler(async (req, res) => {
  const data = await dealerService.list(req.query);
  res.json({ success: true, ...data });
});

exports.getById = asyncHandler(async (req, res) => {
  const data = await dealerService.getById(req.params.id);
  res.json({ success: true, data });
});

exports.register = asyncHandler(async (req, res) => {
  const data = await dealerService.register(req.body, req);
  res.status(201).json({ success: true, data });
});

exports.create = asyncHandler(async (req, res) => {
  const data = await dealerService.create(req.body, req.user.id, req);
  res.status(201).json({ success: true, data });
});

exports.approve = asyncHandler(async (req, res) => {
  const data = await dealerService.approve(req.params.id, req.body, req.user.id, req);
  res.json({ success: true, data });
});

exports.uploadDocument = asyncHandler(async (req, res) => {
  if (!req.file) throw new (require('../utils/helpers').AppError)('No file uploaded', 400);
  req.uploadSubDir = 'dealer-documents';
  const data = await dealerService.addDocument(req.params.id, req.file, req.body.documentType, req);
  res.status(201).json({ success: true, data });
});

exports.getPerformance = asyncHandler(async (req, res) => {
  const data = await dealerService.getPerformance(req.params.id);
  res.json({ success: true, data });
});

exports.getMyProfile = asyncHandler(async (req, res) => {
  if (!req.user.dealer) throw new (require('../utils/helpers').AppError)('Dealer profile not found', 404);
  const data = await dealerService.getById(req.user.dealer.id);
  res.json({ success: true, data });
});
