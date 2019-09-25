const serviceAccount = require('./serviceAccount.json');
const serviceAccountTesting = require('./serviceAccountTesting.json');

console.log("Staging credentials\n");
console.log(`export SERVICE_ACCOUNT='${JSON.stringify(serviceAccount)}'`);
console.log("Testing credentials\n");
console.log(`export SERVICE_ACCOUNT='${JSON.stringify(serviceAccountTesting)}'`);
