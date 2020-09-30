const express = require('express')
const app = express()
const fs = require('fs');
const port = 5000

app.use(express.json())
app.use(express.static('public'))

const etch = require('./etch')

app.get('/csv-etch',(req,res)=>{
  res.json(etch) 
})

app.get('/', (req, res) => {
  res.render('index.html',JSON.stringify({questionsCSV}))
})

app.post('/answers',(req,res)=>{
  const data = JSON.stringify(req.body,null,4)
  console.log(data)
  fs.writeFile(__dirname+'/public/data/json/answers.json', data, error => {
    if (error) {
      console.log(error)
      res.status(500).json('failed')
    }
    else{
      console.log('Answers saved at '+new Date())
      res.status(200).json('success');
    }
  })

})

app.listen(port, () => {
  console.log(`Nagger app listening at http://localhost:${port}`)
})