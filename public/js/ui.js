class Ui{

    constructor(nagger){
        this.nagger = nagger;
        nagger.ui = this;
        this.head = new nagHead(this);
        this.nagger.etch.then(()=>{
            this.section = {
                see: new seeSection(this),
                tell: new tellSection(this)
            }
        })
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
                this.switchBrother(targetDiv,'.section-div')
            });
        });
    }

}

