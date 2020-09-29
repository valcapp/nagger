class Ctrl{
    constructor(){
        this.promises = new Map()
        this.nagger = new Nagger(this)
        this.ui = new Ui(this)
    }

    whenReady(checkFunc,callback){
        const depenency = checkFunc()
        if (!depenency){
            return callback()
        }else{
            this.addPromise(depenency,callback)
        }
    }

    addPromise(depenency,callback){
        let proms = this.promises;
        if (!proms.has(depenency)){proms.set(depenency,[])}
        proms.set(depenency,[...proms.get(depenency),callback])
    }

    runPromise(prom){
        const callbacks = this.promises.get(prom)
        callbacks.forEach( callback => callback())
        this.promises.delete(prom)
    }
}

const ctrl = new Ctrl()