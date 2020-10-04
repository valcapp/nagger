/**
 * takes an array of arrays representing a csv file and returns an array of objects.
 * The object keys will be provided by the row of the inputArray 
 * @param {Array} inputArray  array (rows) of arrays (columns) representing a csv file
 */
const headedArray = inputArray => {
    const header = inputArray[0].map( head => head.trim())
    let outputArray = inputArray.slice(1).map( line => {
            let row = new Object()
            header.forEach( (key,i) => {
                row[key] = line[i]
            })
            return row;
        })
    return outputArray.filter( line =>
        Object.values(line).every( cell => typeof cell !== 'undefined')
    )
}

class Nagger{

    constructor(){
        this.weeksCadence = 6
        this.parsedAnswer = new Map([
            ['yes',true],
            ['no',false]
        ])
        this.load()
    }

    loadEtch(){
        this.etch = fetch('/csv-etch')
            .then(response => response.json())
            .then ( etch => {
                this.questions = headedArray(Papa.parse(etch.questions).data)
                this.descriptions = headedArray(Papa.parse(etch.descriptions).data)
                this.depths = this.getDepths(this.questions)
                this.buildTree()
            })
    }

    loadAnswers(){
        this.log = fetch('/answers-csv')
            .then(response => response.json())
            .then( data => {
                // console.log(data)
                const answers = headedArray(Papa.parse(data.answers).data)
                this.answers = this.readLoadedAnswers(answers)
            })
    }

    load(){
        this.loadEtch()
        // this.loadLog()
        this.loadAnswers()
        this.loaded = new Promise( resolve =>{
            this.etch.then(()=>{
                this.log.then(resolve)
            })
        })
        // this.testLoad()
    }

    getDepths(questions){
        let depths = Object.keys(questions[0]).filter( key => !['idq','question','level'].includes(key))
        let sizes = depths.map( depth => { 
            return {
                depth: depth, 
                size: new Set( questions.map( q => q[depth] ) ).size
            }
        })
        const sorted = sizes.sort((a,b)=>a.size-b.size)
        return sorted.map( i => i.depth)
    }

    buildTree(){
        this.tree = new Map()
        this.buildBranch(-1)
    }

    buildBranch(idxDepth,parent){
        const parentDepth = this.depths[idxDepth]
        const childDepth = this.depths[idxDepth+1]
        if (childDepth){
            const children = [...new Set(
                this.questions
                    .filter(q=> parent&&parentDepth? q[parentDepth] === parent : true)
                    .map(q=>q[childDepth])
            )]
            this.tree.set(parent, {depth: childDepth, children })
            children.forEach(child => this.buildBranch(idxDepth+1,child))
        }
    }


    // testLoad(){ 
    //     console.log(this.loaded)
    //     this.loaded.then(()=>{
    //         console.log(this.loaded)
    //     })
    // }

    readLoadedAnswers(answers){
        answers.forEach( ans => {
            ans.answer = ans.answer.toLowerCase() === 'true'? true : false
            ans.date = new Date(ans.date)
        })
        return answers
    }

    answer(idq,answer){
        this.answers.push({
            idq,
            answer: this.parsedAnswer.get(answer),
            date: new Date()
        })
    }
    
    saveAnswers(){
        const data = {answers: Papa.unparse(this.answers)};
        fetch('/answers-csv', {
                method: 'POST',
                headers: {
                        'Content-Type': 'application/json',
                    },
                body: JSON.stringify(data),
            })
            .then(response => response.json())
            .then(data => {
                if (data === 'success'){
                    this.ui.alertUser('save-answers-success')
                } else {
                    this.ui.alertUser('save-answers-failure')
                }
            })
            .catch((error) => {
                this.ui.alertUser('save-answers-failure', error)
                // console.error('Error:', error);
            });
    }

    // checkAnswers(focus){
    //     const query = this.queryAnswers(focus)
    //     return {
    //         answers: query.answers,
    //         levels: query.levels,
    //         quality: this.assessQuality(focus),
    //         score: this.assessScore(focus)
    //     }
    // }

    assessQuality(focus){
        const answers = this.queryAnswers(focus).answers
        const today = new Date(),
            cadence = this.weeksCadence * 1000 * 60 * 60 * 24 * 7 // millisends by seconds by hours by day by week
        const answersQuality = answers.map( 
                a => a.date? 100 / ( 1 + Math.floor( (today-a.date) / cadence ) ) : 0
            )
        return Math.round( answersQuality.reduce( (prev,curr)=> prev + curr ) /answersQuality.length )
    }

    assessScore(focus){
        const branch = this.tree.get(focus?focus.item:focus)
        let subFocuses
        if (branch){
            subFocuses = branch.children.map(child=>{
                return{
                    item: child,
                    depth: branch.depth
                }
            })
            const subScores = subFocuses.map( subFocus => this.assessScore(subFocus))
            return subScores.reduce((acc,curr)=>acc+curr)/subScores.length
        }
        return this.scoreAnswers(focus)
    }

    scoreAnswers(focus){
        const query = this.queryAnswers(focus)
        const answers = query.answers
        const gameLevels = query.levels
        const nLevs = gameLevels.length
        const lastLevAnswers = answers.filter( a => a.level === gameLevels[nLevs-1] )
        const trueCount = lastLevAnswers.filter( a => a.answer ).length
        const lastScoreFrac = Math.floor( 2 * trueCount / lastLevAnswers.length ) /2
        const b4last = Number(gameLevels[nLevs-2]||0),
            last = Number(gameLevels[nLevs-1])
        return  b4last + lastScoreFrac*(last-b4last)
    }

    queryAnswers(focus){
        const questionsArray = this.queryQuestions(focus)
        const lastAnswers = this.lastAnswers(questionsArray)
        const gameLevels = this.gameLevels(lastAnswers)
        const answers = lastAnswers.filter( a => gameLevels.includes( a.level ) )
        return {
            answers: answers,
            levels: gameLevels
        }
    }

    queryQuestions(focus){
        return this.questions.filter( q => focus? q[focus.depth]===focus.item : true )
    }

    lastAnswers(questionsArray){
        let lastAnswers = []
        questionsArray.forEach( question => {
                const lastAnswer = this.answers
                        .filter( ans => ans.idq === question.idq)
                        .sort((a,b)=>b.date - a.date)[0]
                lastAnswers.push({
                    idq : question.idq,
                    answer : lastAnswer?lastAnswer.answer:undefined,
                    level : question.level,
                    date :  lastAnswer?lastAnswer.date:undefined
                })
            }
        )
        return lastAnswers
    }

    gameLevels(answers){
        const levels = [...new Set(answers.map(a=>a.level))].sort()
        for ( let i=0; i < levels.length ;i++){
            if( ! answers.filter( a => a.level === levels[i] ).every( a => a.answer ) ){
                return levels.slice(0,i+1)
            }
        }
        return levels
    }

}


