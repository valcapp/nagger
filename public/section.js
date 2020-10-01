class tellSection{
    constructor(ui){
        this.ui = ui
        this.domDiv = document.querySelector(`.nag-section.questions-div`)
        this.menu = new Menu(this)
        this.content = new Content(this)
        this.domDiv.querySelector('div.save-answers button').addEventListener('click',()=>{
            this.ui.nagger.saveAnswers()
        })
    } 
}

    
class Menu{
    constructor(section){
        this.section = section
        this.ui = this.section.ui
        this.domDiv = section.domDiv.querySelector('.questions-menu')
        this.depths = ['area','target']
        this.tree = new Map()
        this.buildMenu(this.ui.nagger.questions,'root',this.depths);
        this.showChildren('root')
    }

    buildMenu(itemsArray,parentButton,depths){
        if(depths.length>=1){
            const currentDepth = depths[0];
            let nextDepths = [...depths].slice(1);
            if(!this.tree.get(parentButton)){
                this.tree.set(parentButton,[])
            }
            const items = new Set(itemsArray.map( q => q[currentDepth] ));
            items.forEach( item => {
                const menuButton = this.createMenuButton(item,`${currentDepth}-depth`);
                this.domDiv.append(menuButton);
                this.tree.get(parentButton).push(menuButton)
                const subArray = itemsArray.filter(q => q[currentDepth] === item);
                this.buildMenu(subArray,menuButton,nextDepths)
            })
        }
    }

    createMenuButton(content,...classNames){
        const menuButton = document.createElement('div');
        menuButton.innerHTML = content;
        menuButton.addEventListener('click',()=>this.clickMenuButton(menuButton));
        menuButton.classList.add('questions-menu-button',...classNames);
        return menuButton;
    }

    clickMenuButton(clickedButton){
        const brothers = Array.from(this.tree.values()).find( childrenSet => childrenSet.includes(clickedButton))
        if (clickedButton.classList.contains('selected')){
            this.deselectMenuButton(clickedButton,brothers)
        } else {
            this.selectMenuButton(clickedButton,brothers);
        }
    }

    deselectMenuButton(selectedButton,brothers){
        brothers.forEach(
            button => button.classList.add('active')
        );
        selectedButton.classList.remove('selected');
        this.hideChildren(selectedButton);
    }

    selectMenuButton(selectedButton,brothers){
        brothers.forEach(
            button => button.classList.remove('active')
        );
        selectedButton.classList.add('active','selected');
        this.showChildren(selectedButton);
    }

    showChildren(parentButton){
        const childButtons = this.tree.get(parentButton)
        if (childButtons instanceof Array){
            childButtons.forEach(childButton => {
                if (childButton instanceof Element){
                    childButton.classList.add('active');
                }
            })
        }
    }

    hideChildren(parentButton){
        const childButtons = this.tree.get(parentButton)
        if (childButtons instanceof Array){
            childButtons.forEach(childButton => {
                if (childButton instanceof Element){
                    childButton.classList.remove('active','selected');
                }
            })
        }
    }

    /** Recursive function, it takes an array, find the selected item in the array, if there are branches related to that item in the this.menu.tree it will call itslef recursively
     * At the end undefined is returned but the selected item at the lower possible depth can be found at this.focusItem
     * @param {*} currentArray the array to check 
     */
    checkSelected(currentArray,focusItem){
        if (currentArray){
            const currentDepth = currentArray.filter(el => el instanceof Element ).find( el => el.classList.contains('selected') )
            if (currentDepth) {
                focusItem = currentDepth
            }
            const nextArray = this.section.menu.tree.get(currentDepth)
            return this.checkSelected(nextArray,focusItem)
        }
        return focusItem
    }

    reviewSelected(){
        return this.checkSelected(Array.from(this.section.menu.tree.keys()))
    }

}


class Content{
    constructor(section){
        this.section = section
        this.ui = this.section.ui
        this.domDiv = this.section.domDiv.querySelector('.questions-content')
        this.section.menu.domDiv.addEventListener('click',()=>this.reviewContent());
        this.donut = new PlotlyDonut(this.domDiv)
        this.reviewContent()
    }

    reviewContent(){
        this.wipeContent()
        this.focus = focus = this.readFocus()
        this.textArea().innerHTML = focus? `<h4> ... about ${focus.item}</h4>` : `<h4> ... overall</h4>`
        this.ui.nagger.loaded.then(()=>{
            if (focus && focus.depth ==='target'){
                this.nextQuestion()
            } else {
                this.showData()
            }
        }) 
    }

    wipeContent(){
        while (this.domDiv.firstChild) {
            this.domDiv.firstChild.remove()
        }
    }

    readFocus(){
        const focusItem = this.section.menu.reviewSelected()
        let focus
        if (focusItem){
            focus = {
                depth: Array.from(focusItem.classList).find(c=>c.includes('-depth')).replace('-depth',''),
                item: focusItem.innerHTML
            }
        }
        return focus
    }

    textArea(){
        let textArea = this.domDiv.querySelector('.text-area')
        if(!textArea){
            textArea = document.createElement('div')
            textArea.classList.add('text-area')
            this.domDiv.appendChild(textArea)
        }
        return textArea
    }

    showData(tell=true){
        const focus = this.focus
        const data = this.ui.nagger.checkAnswers(focus)
        this.showDonut(data)
        if(tell){this.tellData(data)}
    }

    showDonut(data){
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