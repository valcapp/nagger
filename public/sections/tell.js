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
        this.textArea().innerHTML = this.focus? `<h4> ... about ${this.focus.item}</h4>` : `<h4> ... overall</h4>`   
        if (this.focus && this.focus.depth ==='target'){
            this.nextQuestion()
        } else {
            this.showData()
        }
    }

    showData(tell=true){
        const focus = this.focus
        const data = this.ui.nagger.checkAnswers(focus)
        this.showDonut(data)
        if(tell){this.tellData(data)}
    }

    showDonut(data){
        if (!this.donut){
            this.donut = new PlotlyDonut(this.domDiv)
        }
        this.donut.refresh(data)
    }

    tellData(data){
        this.textArea().innerHTML += `<p> I know ${data.quality}% of potential data.
        To increase the percentage, select a specific area and answer the questions.</p>
        <p>Based on what I know, your current score is ${data.score}.</p>`
    }

    nextQuestion(){
        this.showData(false)
        const question = this.ui.nagger.questions.find( q => q.idq === this.pickIdq() ) 
        if (question){
            this.askQuestion(question)
        }else{
            const message = document.createElement('p')
            message.innerHTML = `Congratulations! You completed the answers for this target!`
            this.textArea().append(message)
        }
    }

    pickIdq(){
        const focus = this.focus
        const today = new Date()
        const cadence = this.ui.nagger.weeksCadence * 1000 * 60 * 60 * 24 * 7 // millisends by seconds by hours by day by week
        const unanswered = this.ui.nagger.checkAnswers(focus).answers.filter( a => (today-a.date) > cadence || typeof a.date === 'undefined')
        const randomQuestion = unanswered[Math.floor(Math.random()*unanswered.length)]
        if(randomQuestion){
            return randomQuestion.idq
        }
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
        this.textArea().querySelectorAll('.ask-question').forEach(q=>q.remove())
        this.nextQuestion();
    }
}


class PlotlyDonut{
    constructor(contentDiv){
        this.contentDiv = contentDiv
    }

    dataSchema = {
        hoverinfo: 'label+percent+name',
        hole: .8,
        type: 'pie',
        marker: {
            colors: ['#DCDCDC','#e60073']
        },
    }

    getData(data,varb){
        if (varb === 'score') {
            return[{
                ...this.dataSchema,
                values: [5-data.score,data.score],
                labels: ['to do','achieved'],
                name: 'Score'
            }]
        } else if (varb === 'quality'){
            return[{
                ...this.dataSchema,
                values: [100-data.quality,data.quality],
                labels: ['unknown','known'],
                name: 'Data Completion'
            }]
        }
    }

    getLayout(varTitle) {
        return{
            height: 300,
            width: 300,
            title: varTitle,
            annotations: [
                {
                    font: {
                    size: 12
                    },
                    showarrow: false,
                    text: 'Completion',
                    x: 0.5,
                    y: 0.5
                }
            ]
        }
    }

    refresh(data){
        this.prepareCanvas('quality')
        Plotly.newPlot(`donut-quality`,this.getData(data,'quality'),this.getLayout('Data Completion'))
    }

    prepareCanvas(varTitle){
        let donutDiv = this.contentDiv.querySelector(`#donut-${varTitle}`)
        if(!donutDiv){
            donutDiv = document.createElement('div')
            donutDiv.setAttribute("id",`donut-${varTitle}`)
            this.contentDiv.appendChild(donutDiv)
            this.contentDiv.insertBefore(donutDiv, this.contentDiv.childNodes[0] || null);
        }
    }
}