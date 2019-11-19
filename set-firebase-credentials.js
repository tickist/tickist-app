const serviceAccount = require('./serviceAccountDev.json');
const serviceAccountTesting = require('./serviceAccountTesting.json');
const serviceAccountCI = require('./serviceAccountCI.json');

console.log("Staging credentials\n");
console.log(`export SERVICE_ACCOUNT='${JSON.stringify(serviceAccount)}'`);
console.log('\n');
console.log("Testing credentials\n");
console.log(`export SERVICE_ACCOUNT='${JSON.stringify(serviceAccountTesting)}'`);
console.log('\n');
console.log("CI credentials\n");
console.log(`export SERVICE_ACCOUNT='${JSON.stringify(serviceAccountCI)}'`);
console.log('\n');
