const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const multer = require('../middleware/multer-config');
const bookCtrl = require('../controllers/book');

router.post('/', auth, multer, bookCtrl.createBook);
router.get('/', bookCtrl.getAllBook);
router.get('/bestrating', bookCtrl.getTopRatedBook)
router.get('/:id', bookCtrl.getBook);
router.delete('/:id', auth, bookCtrl.deleteBook);
router.post('/:id/rating', auth, bookCtrl.setRatingBook)
router.put('/:id', auth, multer, bookCtrl.modifyBook);

module.exports = router;