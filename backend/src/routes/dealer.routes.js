const router = require('express').Router();
const { body } = require('express-validator');
const dealerController = require('../controllers/dealer.controller');
const { authenticate } = require('../middleware/auth');
const { authorize, authorizeRoles } = require('../middleware/rbac');
const upload = require('../middleware/upload');
const validate = require('../middleware/validate');

router.post('/register', [
  body('businessName').trim().notEmpty(),
  body('contactPerson').trim().notEmpty(),
  body('email').isEmail(),
  body('phone').notEmpty(),
], validate, dealerController.register);

router.use(authenticate);

router.get('/me', authorizeRoles('dealer'), dealerController.getMyProfile);
router.post('/', authorize('manage_dealers'), [
  body('businessName').trim().notEmpty(),
  body('contactPerson').trim().notEmpty(),
  body('email').isEmail(),
  body('phone').notEmpty(),
], validate, dealerController.create);
router.get('/', authorize('view_dealers', 'manage_dealers'), dealerController.list);
router.get('/:id', authorize('view_dealers', 'manage_dealers'), dealerController.getById);
router.get('/:id/performance', authorize('view_dealers', 'view_reports'), dealerController.getPerformance);
router.patch('/:id/approve', authorize('approve_dealers'), [
  body('status').isIn(['approved', 'rejected', 'suspended']),
], validate, dealerController.approve);
router.post('/:id/documents', authorize('manage_dealers'), (req, res, next) => {
  req.uploadSubDir = 'dealer-documents';
  next();
}, upload.single('document'), [
  body('documentType').isIn(['gst', 'pan', 'aadhar', 'bank', 'license', 'other']),
], validate, dealerController.uploadDocument);

module.exports = router;
