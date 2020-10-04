const fs = require('fs'),
    path = require('path')

const loadData = (folder) => {
        let data = {}
        const csvPath = path.join(__dirname,folder)
        fs.readdirSync(csvPath)
            .filter( file => path.extname( file ) === '.csv')
            .forEach( file => {
                try {
                    data[file.slice(0,-4)] = fs.readFileSync(path.join(csvPath,file), 'utf8'); 
                } catch(e) {
                    console.log('Error:', e.stack);
                }
            })
        return data
    }
module.exports = {
    etch: loadData('etch'),
    answers: loadData('answers')
}