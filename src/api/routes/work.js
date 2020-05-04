/* eslint-disable no-console */
const https = require('https');

const MessageValidator = require('sns-validator');
const WorkResponseService = require('../route-services/work-response');

const validator = new MessageValidator();

module.exports = {
  'work#response': [(req, res) => {
    let msg;

    // First let's try parsing the body. It should be JSON.
    try {
      msg = JSON.parse(req.body);
    } catch (error) {
      res.status(500).send('nok');
      return;
    }

    const io = req.app.get('io');

    const responseService = new WorkResponseService(io, msg);
    responseService.sendResponse();


    /*
    // Asynchronously validate and process the message.
    validator.validate(msg, (err, message) => {
      // Ignore errors.
      if (err) {
        console.error(
          'Error validating the SNS response: ', err,
        );
        return;
      }

      // Handle subscripton and unsubscription automatically.
      if (message.Type === 'SubscriptionConfirmation'
        || message.Type === 'UnsubscribeConfirmation') {
        https.get(message.SubscribeURL);
      }

      // Notifications are passed on to the service for processing.
      if (message.Type === 'Notification') {
        try {
          const workResult = JSON.parse(message.Message);
          const responseService = new WorkResponseService(workResult);
        } catch (e) {
          console.error(
            'Error processing the work response message: ', e,
          );
        }
      }
  });
  */

    // SNS is really dumb, so we can just send back a generic response.
    // It doesn't really care what we do afterwards.
    res.status(200).send('ok');
  }],
};
