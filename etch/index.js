const fs = require('fs'),
    path = require('path')

module.exports = (function (){
    let etch = {}
    const csvPath = path.join(__dirname,'csv')
    fs.readdirSync(csvPath)
        .filter( file => path.extname( file ) === '.csv')
        .forEach( file => {
            try {
                etch[file.slice(0,-4)] = fs.readFileSync(path.join(csvPath,file), 'utf8'); 
            } catch(e) {
                console.log('Error:', e.stack);
            }
        })
    return etch
})()