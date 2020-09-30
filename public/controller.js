class Ctrl{
    constructor(){
        this.nagger = new Nagger(this)
        this.ui = new Ui(this)
    }
}

const ctrl = new Ctrl()