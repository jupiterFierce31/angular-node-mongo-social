
var express = require('express');
var router = express.Router();
var braintree = require('braintree');
const config = require('./../config.js');
const MODE = {
    booking: {
        amount: '100.00'
    },
    upToExpert: {
        amount: '99.00'
    }
};
router.post('/', function (req, res, next) {
    var gateway = braintree.connect(config.BRAINTREE);

    var amount = MODE[req.body.data.mode].amount;
    // Use the payment method nonce here
    var nonceFromTheClient = req.body.paymentMethodNonce;
    // Create a new transaction for mode
    var newTransaction = gateway.transaction.sale({
        amount: amount,
        paymentMethodNonce: nonceFromTheClient,
        options: {
            // This option requests the funds from the transaction
            // once it has been authorized successfully
            submitForSettlement: true
        }
    }, function (error, result) {
        if (result) {
            if (result.success)
                switch (req.body.data.mode) {
                    case 'booking':
                        booking();
                        break;
                    case 'upToExpert':

                        upToExpert(req.body.data.user).then(function (resolve) {
                            res.send({ success: true })
                        }, function (err) {
                            res.status(400).send({ message: 'Unable to update user' })

                        })
                        break;
                }
            else res.send({ success: false, message: 'Payment problem' })
        } else {
            res.status(500).send(error);
        }
    });
});
function booking() {

}
function upToExpert(user) {
    return new Promise(function (resolve, reject) {
        models.User.upgradeToExpert(user._id, (err, result) => {

            if (err) reject(err);
            else {

                resolve(result);
            }
        })
    })
}

module.exports = router;