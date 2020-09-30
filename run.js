require('./app.js');
const open = require('open');

(async () => {
    await open("http://localhost:5000/", {app: ['chrome', "--incognito"]});
})();