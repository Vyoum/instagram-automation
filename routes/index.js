const express = require('express');
const router = express.Router();
const postController = require('../controllers/postController');
const classesController = require('../controllers/classesController');
const subscribersController = require('../controllers/subscribersController');

const logger = require('../services/logger');

// Home Route
router.get('/', (req, res) => {
    res.render('index', { errorMessage: null });
});

// Logs Route
router.get('/logs', (req, res) => {
    const logs = logger.getLogs();
    res.json(logs);
});

// Generate Post
router.post('/generate', postController.generatePost);
router.get('/review', postController.renderReview);
router.post('/decision', postController.handleDecision);

// Classes Management
router.get('/classes', classesController.renderList);
router.get('/classes/new', classesController.renderForm);
router.post('/classes', classesController.create);

// Subscribers
router.get('/subscribers', subscribersController.renderList);

module.exports = router;
