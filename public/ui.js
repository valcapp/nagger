class Ui{

    constructor(ctrl){
        this.ctrl = ctrl;
        this.nagger = ctrl.nagger;
        this.head = new nagHead(this);
        this.section = {
            tell: new tellSection(this,this.nagger.questions)
        }
    }

    alertUser(key, error){
        const errorMessage = error? `\nError message:\n${error}`:''
        const message = {
            'save-answers-success':`Your answers have been saved!`,
            'save-answers-failure':`Oops! Something went wrong. Your answers were not saved!\n${errorMessage}`
        }
        alert(message[key])
    }
}


class nagHead{
    constructor(ui){
        this.ui = ui;
        this.domDiv = document.querySelector('.nag-head')
        this.activateInfoButton();
        this.activateMenuButtons();
    }

    activateInfoButton(){
        this.domDiv.querySelector('.info-button').addEventListener('click',()=>{
            const introDiv = this.domDiv.querySelector('.intro-div');
            introDiv.classList.toggle('hidden');
        })
    }

    // to switch active element (el) among the lements with class brotherClass
    switchBrother(el,brothersSelector){
        document.querySelectorAll(brothersSelector).forEach(brother=>brother.classList.remove('active'));
        el.classList.add('active');
    }

    activateMenuButtons(){
        this.domDiv.querySelectorAll('.sections-menu button').forEach(el=>{
            const targetClassName = Array.from(el.classList).find(name=>name.includes('-mi')).replace('-mi','-div'),
                targetDiv = document.getElementsByClassName(targetClassName)[0]
            el.addEventListener('click',()=>{
                this.switchBrother(el,'.sections-menu button');
                this.switchBrother(targetDiv,'.nag-section')
            });
        });
    }
        

}



class tellSection{

    constructor(ui,questions){
        this.ui = ui
        this.questions = questions
        this.domDiv = document.querySelector(`.nag-section.questions-div`)
        this.promises = new Map()
        // menu
        this.menu = this.domDiv.querySelector('.questions-menu')
        this.menuLevels = ['area','target']
        this.menuTree = new Map()
        this.buildMenu(questions,'root',this.menuLevels);
        this.showChildren('root')
        //content
        this.content = this.domDiv.querySelector('.questions-content')
        this.focusItem = undefined
        this.menu.addEventListener('click',()=>this.generateContent());
        this.donut = new PlotlyDonut(this.content)
        this.generateContent()
        //submit
        this.domDiv.querySelector('div.save-answers button').addEventListener('click',()=>{
            this.ui.nagger.saveAnswers()
        })

    }

    buildMenu(itemsArray,parentButton,levels){
        if(levels.length>=1){
            const currentLevel = levels[0];
            let nextLevels = [...levels];
            nextLevels.shift();
            if(!this.menuTree.get(parentButton)){
                this.menuTree.set(parentButton,[])
            }
            const items = new Set(itemsArray.map( q => q[currentLevel] ));
            items.forEach( item => {
                const menuButton = this.createMenuButton(item,`${currentLevel}-level`);
                this.menu.append(menuButton);
                this.menuTree.get(parentButton).push(menuButton)
                const subArray = itemsArray.filter(q => q[currentLevel] === item);
                this.buildMenu(subArray,menuButton,nextLevels)
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
        const brothers = Array.from(this.menuTree.values()).find( childrenSet => childrenSet.includes(clickedButton))
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
        const childButtons = this.menuTree.get(parentButton)
        if (childButtons instanceof Array){
            childButtons.forEach(childButton => {
                if (childButton instanceof Element){
                    childButton.classList.add('active');
                }
            })
        }
    }

    hideChildren(parentButton){
        const childButtons = this.menuTree.get(parentButton)
        if (childButtons instanceof Array){
            childButtons.forEach(childButton => {
                if (childButton instanceof Element){
                    childButton.classList.remove('active','selected');
                }
            })
        }
    }

    generateContent(){
        this.focusItem = undefined
        this.checkSelected(Array.from(this.menuTree.keys()))
        this.wipeContent()
        const focus = this.readFocusItem()
        this.content.innerHTML = focus? `<h4> ... about ${focus.item}</h4>` : `<h4> ... overall</h4>`
        this.ui.ctrl.whenReady(
            () => this.ui.nagger.waitingForAnswers(),
            () => {
                if (focus && focus.depth ==='target'){
                    this.nextQuestion()
                } else {
                    this.showData()
                }
            }
        )     
    }

    readFocusItem(){
        if (this.focusItem){
            return{
                depth: Array.from(this.focusItem.classList).find(c=>c.includes('-level')).replace('-level',''),
                item: this.focusItem.innerHTML
            }
        }
    }

    /** Recursive function, it takes an array, find the selected item in the array, if there are branches related to that item in the this.menuTree it will call itslef recursively
     * At the end undefined is returned but the selected item at the lower possible level can be found at this.focusItem
     * @param {*} currentArray the array to check 
     */
    checkSelected(currentArray){
        if (currentArray){
            const currentLevel = currentArray.filter(el => el instanceof Element ).find( el => el.classList.contains('selected') )
            if (currentLevel) { this.focusItem = currentLevel }
            const nextArray = this.menuTree.get(currentLevel)
            this.checkSelected(nextArray)
        }
    }

    wipeContent(){
        while (this.content.firstChild) {
            this.content.firstChild.remove()
        }
    }

    pickIdq(){
        const focus = this.readFocusItem()
        const today = new Date()
        const cadence = this.ui.nagger.weeksCadence * 1000 * 60 * 60 * 24 * 7 // millisends by seconds by hours by day by week
        const unanswered = this.ui.nagger.checkAnswers(focus).answers.filter( a => (today-a.date) > cadence || typeof a.date === 'undefined')
        const randomQuestion = unanswered[Math.floor(Math.random()*unanswered.length)]
        if(randomQuestion){
            return randomQuestion.idq
        }
    }

    nextQuestion(){
        this.showData(false)
        const question = this.ui.nagger.questions.find( q => q.idq === this.pickIdq() ) 
        if (question){
            this.askQuestion(question)
        }else{
            const message = document.createElement('p')
            message.innerHTML = `Congratulations! You completed the answers for this target!`
            this.content.append(message)
        }
    }

    askQuestion(question){
        const qDiv = document.createElement('div')
        qDiv.classList.add('ask-question')
        qDiv.innerHTML = `<p>${question.question}</p>`
        const answerDiv = document.createElement('div')
        const answers = ['yes','no'].forEach(a=>answerDiv.append(this.createAnswerButton(question.idq,a)) )
        qDiv.append(answerDiv)
        this.content.append(qDiv)
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
        this.content.querySelectorAll('.ask-question').forEach(q=>q.remove())
        this.nextQuestion();
    }

    // whenReady(dependency,callback){
    //     const data = dependency();
    //     if (data.hasOwnProperty('wait')) {
    //         this.ui.ctrl.addPromise(data.wait,callback)
    //     } else {
    //         return callback()
    //     }      
    // }

    showData(tell=true){
        const focus = this.readFocusItem()
        const data = this.ui.nagger.checkAnswers(focus)
        this.showDonut(data)
        if(tell){this.tellData(data)}
    }

    showDonut(data){
        this.donut.refresh(data)
    }

    tellData(data){
        this.content.innerHTML += `<p> I know ${data.quality}% of potential data.
        To increase the percentage, select a specific area and answer the questions.</p>
        <p>Based on what I know, your current score is ${data.score}.</p>`
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
        }
    }
}