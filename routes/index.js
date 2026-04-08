var express = require('express');
var router = express.Router();
var db = require('../queries');
var housing = require('../housingEligibility');


router.get('/api/puppies', db.getAllPuppies);
router.get('/api/puppies/:id', db.getSinglePuppy);
router.post('/api/puppies', db.createPuppy);
router.put('/api/puppies/:id', db.updatePuppy);
router.delete('/api/puppies/:id', db.removePuppy);

// 토허제 구역 주택 매수 가능 여부 판단
router.post('/api/housing-eligibility', housing.checkEligibilityHandler);

// application -------------------------------------------------------------
router.get('/', function (req, res) {

    res.render('index', {title: 'node-postgres-promises'}); // load the single view file (angular will handle the page changes on the front-end)
});

module.exports = router;
