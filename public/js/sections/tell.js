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

    showData(tell=true){
        const focus = this.focus
        const accuracy = this.ui.nagger.assessQuality(focus)
        const score = this.ui.nagger.assessScore(focus)
        this.showDonut(accuracy)
        if(tell){this.tellData(score,accuracy)}
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
        const unanswered = this.ui.nagger.queryAnswers(focus).answers.filter( a => (today-a.date) > cadence || typeof a.date === 'undefined')
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


class PlotlyDonut extends PlotlyChart{

    dataSchema = {
        hoverinfo: 'label+percent+name',
        hole: .8,
        type: 'pie',
        marker: {
            colors: ['#DCDCDC','#e60073']
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