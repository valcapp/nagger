class tellSection extends Section{
    constructor(ui){
        super(ui,'.tell-div')
        this.content = new tellContent(this)
    }
}

class tellContent extends Content{
    constructor(section){
        super(section)
        this.section.domDiv.querySelector('div.save-answers button').addEventListener('click',()=>{
            this.ui.nagger.saveAnswers()
        })
        this.reviewContent()
    }

    generateContent(){
        this.textArea().innerHTML = this.focus? `<h3>${this.focus.item}</h3>` : `<h3>overall</h3>`   
        if (this.focus && this.focus.depth ==='target'){
            this.nextQuestion()
        } else {
            this.showData()
        }
    }

    getData(){
        const focus = this.focus
        const accuracy = this.ui.nagger.assessQuality(focus)
        const score = this.ui.nagger.assessScore(focus)
        return {score,accuracy}
    }

    showData(tell=true){
        const data = this.getData()
        this.showDonut(data.accuracy)
        if(tell){this.tellData(data.score,data.accuracy)}
        return data
    }

    showDonut(data){
        if (!this.donut){
            this.donut = new PlotlyDonut(this.domDiv,'ply-donut-canvas')
        }
        this.donut.refresh(data)
    }

    tellData(score,accuracy){
        this.textArea().innerHTML += `<p> I know ${accuracy}% of potential data.
        To increase the percentage, select a specific area and answer the questions.</p>
        <p>Based on what I know, your current score is ${score.toFixed(1)}.</p>`
    }

    nextQuestion(){
        this.textArea().querySelectorAll('.ask-question, .complete-message').forEach(q=>q.remove())
        const data = this.showData(false)
        const question = this.ui.nagger.questions.find( q => q.idq === this.pickIdq() ) 
        if (question){
            this.askQuestion(question)
        } else if (data.accuracy === 100){
            this.targetCompleted()
        } else {
            this.nextQuestion()
        }
    }

    targetCompleted(){
        const div = document.createElement('p')
        div.classList.add("complete-message")
        const message = document.createElement('p')
        message.innerHTML = `Congratulations! You completed the answers for this target!`
        const button = document.createElement('button')
        button.innerHTML = "Review Answers"
        button.classList.add("ball","review-answers")
        const focus = this.readFocus()
        button.addEventListener('click', () => {
            this.review = {...focus, date: new Date()}
            this.nextQuestion()
        })
        div.append(message)
        div.append(button)
        this.textArea().append(div)
    }

    pickIdq(){
        const focus = this.focus       
        const unanswered = this.ui.nagger.queryAnswers(focus).answers.filter( this.dateFilter() )
        const randomQuestion = unanswered[Math.floor(Math.random()*unanswered.length)]
        if(randomQuestion){
            return randomQuestion.idq
        }
    }

    dateFilter(){
        let filter
        const now = new Date()
        const cadence = this.ui.nagger.weeksCadence * 1000 * 60 * 60 * 24 * 7 // millisends by seconds by hours by day by week
        filter = a => typeof a.date === 'undefined' || (now.getTime()-a.date.getTime()) > cadence
        if (this.review && Object.keys(focus).every(k=>focus[k]===this.review[k]) ){
            filter = a => {
                console.log("review date: ", this.review.date) 
                console.log("answer date:", a.date) 
                return typeof a.date === 'undefined' || this.review.date.getTime() > a.date.getTime()
            }
        }
        return filter
    }

    askQuestion(question){
        const qDiv = document.createElement('div')
        qDiv.classList.add('ask-question')
        qDiv.innerHTML = `<p>${question.question}</p>`
        const answerDiv = document.createElement('div')
        const answers = ['yes','no'].forEach(a=>answerDiv.append(this.createAnswerButton(question.idq,a)) )
        qDiv.append(answerDiv)
        this.textArea().append(qDiv)
    }

    createAnswerButton(idq,answer){
        const button = document.createElement('button')
        // button.classList.add('ball')
        button.addEventListener('click',()=>this.answerQuestion(idq,answer))
        button.innerHTML = answer
        return button
    }

    answerQuestion(idq,answer){
        this.ui.nagger.answer(idq,answer);
        this.nextQuestion();
    }
}


class PlotlyDonut extends PlotlyChart{

    dataSchema = {
        hoverinfo: 'label+percent+name',
        hole: .8,
        type: 'pie',
        marker: {
            // colors: ['#DCDCDC','#e60073']
            colors: ['#DCDCDC',this.color]
        },
    }

    getData(data){
        return[{
            ...this.dataSchema,
            values: [100-data,data],
            labels: ['unknown','known'],
            name: 'available data'
        }]
    }

    getLayout(varTitle) {
        return{
            height: 300,
            width: 300,
            title: 'I know...',
            annotations: [
                {
                    font: {
                    size: 12
                    },
                    showarrow: false,
                    text: 'Accuracy',
                    x: 0.5,
                    y: 0.5
                }
            ]
        }
    }

    // refresh(data){
    //     this.prepareCanvas('quality')
    //     Plotly.newPlot(`donut-quality`,this.getData(data,'quality'),this.getLayout('Data Completion'))
    // }

    // prepareCanvas(varTitle){
    //     let donutDiv = this.homeDiv.querySelector(`#donut-${varTitle}`)
    //     if(!donutDiv){
    //         donutDiv = document.createElement('div')
    //         donutDiv.setAttribute("id",`donut-${varTitle}`)
    //         this.homeDiv.appendChild(donutDiv)
    //         this.homeDiv.insertBefore(donutDiv, this.homeDiv.childNodes[0] || null);
    //     }
    // }
}