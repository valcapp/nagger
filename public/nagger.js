
const questionsString = `idq,area,target,question,level
sleep-hours,health,sleep,do you sleep enough every day?,1
sleep-deep,health,sleep,do you get enough deep sleep at night?,3
sleep-dreams,health,sleep,is your sleep without nightmares most of the time?,3
sleep-regular,health,sleep,do you sleep with a regular daily pattern?,5
eat-enough,health,eat,do you eat enough food to get the energy you need?,1
eat-less,health,eat,do you avoid to eat more than the necessary amount?,1
eat-veggies,health,eat,do you eat five fruits/vegetables a day?,3
eat-vitamins,health,eat,do you get all the vitamins you need?,3
eat-water,health,eat,do you drink 2 litres of water per day?,1
eat-cook,health,eat,do you enjoy the time in preparing your meal?,5
eat-mindful,health,eat,do you eat mindful of the taste and experience of the food?,5
exercise-steps,health,exercise,do you walk 10'000 steps a day?,3
exercise-light,health,exercise,do you do light physical activity once a week?,1
exercise-medium,health,exercise,do you do medium physical activity once a week?,3
exercise-hard,health,exercise,do you do hight-intensity physical activity once a week?,5
exercise-warmup,health,exercise,do you do warm-up when doing exercise?,5
exercise-pain,health,exercise,are you free from physical pain?,3
exercise-stretch,health,exercise,do you do stretching exercises every day?,5
career-purpose,finance,career,do you feel purpose in your job?,5
career-flow,finance,career,do you experience flow in your job?,1
career-growth,finance,career,do you feel you are growing in your job?,3
career-recognition,finance,career,do you feel your job is being recognized?,1
wealth-essentials,finance,wealth,can you meet your basic needs?,1
wealth-enjoy,finance,wealth,have you got enough money to enjoy life?,3
wealth-planning,finance,wealth,do you feel on track about your future finance?,5
family-talk,relationships,family,do you talk regularly with your family?,1
family-freedom,relationships,family,do you feel children are free to  commit mistakes in your family?,3
family-trust,relationships,family,do you feel trust and respect in your family?,5
family-adult,relationships,family,do you feel there is an adult relationship between parents and chilren?,3
friends-good,relationships,friends,do you feel good about yourselves when with your friends?,1
friends-mutual,relationships,friends,do you feel an equal amount of “give and take” with your friends?,1
friends-safe,relationships,friends,do you feel safe around your friends?,3
friends-trust,relationships,friends,do you trust and respect your friends?,3
friends-want,relationships,friends,do you want to spend time with your friends?,5
friends-yourself,relationships,friends,do you feel you can be yourself with your friends ?,5
partner-care,relationships,partner,do you take care of yourself as well as your partner?,1
partner-indipendence,relationships,partner,"do you do things with other friend, family or on your own?",3
partner-decisions,relationships,partner,do you share in decisions with your partner?,3
partner-privacy,relationships,partner,do you and your partner respect each other's need for privacy?,1
partner-stories,relationships,partner,do you and your partner share histories and life stories with each other?,5
partner-love,relationships,partner,do you and your partner treat each other with love and respect?,1
partner-problems,relationships,partner,do you and your partner talk through problems or get help if you can’t work things out?,5
sport-1-monthly,passions,sport,do you practice at least one sport at least mothly?,1
sport-2-monthly,passions,sport,do you practicemore than one sport at least mothly?,3
sport-1-weekly,passions,sport,do you practice at least one sport weekly?,3
sport-2-weekly,passions,sport,do you practice more than one sport weekly?,5
sport-daily,passions,sport,do you practice a sport daily?,5
art-1-monthly,passions,art,do you practice at least one art at least mothly?,1
art-2-monthly,passions,art,do you practice more than one art at least mothly?,3
art-1-weekly,passions,art,do you practice at least one art weekly?,3
art-2-weekly,passions,art,do you practice more than one art weekly?,5
art-daily,passions,art,do you practice an art daily?,5
skill-1-monthly,passions,skill,do you practice at least one skill at least mothly?,1
skill-2-monthly,passions,skill,do you practice more than one skill at least mothly?,3
skill-1-weekly,passions,skill,do you practice at least one skill weekly?,3
skill-2-weekly,passions,skill,do you practice more than one skill weekly?,5
skill-daily,passions,skill,do you practice a skill daily?,5
culture-1-monthly,passions,culture,do you cultivate at least one culture-form at least mothly?,1
culture-2-monthly,passions,culture,do you cultivate more than one culture-form at least mothly?,3
culture-1-weekly,passions,culture,do you cultivate at least one culture-form weekly?,3
culture-2-weekly,passions,culture,do you cultivate more than one culture-form weekly?,5
culture-daily,passions,culture,do you cultivate a culture-form daily?,5
soul-1-monthly,passions,soul,do you dedicate to your interiority at least mothly?,1
soul-2-monthly,passions,soul,do you dedicate to your interiority at least every two week?,3
soul-2-weekly,passions,soul,do you dedicate to your interiority at least weekly?,3
soul-1-weekly,passions,soul,do you dedicate to your interiority daily?,5`
const descriptionsString = `key,description
health,physical health and wellbeing
finance,"financial health, ownings and career fulfillment"
relationships,"harmony and depth of relationships in our family, friends, contacts and community"
passions,"activities you enjoy, make you passionate, nurture you and give you meaning"
sleep,the level of health in sleeping habits
eat,the level of health in eating habits
exercise,the level of health in exercise habits
career,level of fulfillment around job and career
wealth,income and properties that support life
family,the people connected to you as parents or children
friends,"the connections with which you share time, experiences, interests or any other aspect"
partner,"the level of health and happiness around the romantic, sentimental relationships"
sport,the fulfillment of goals around sporting activities
art,the fulfillment of goals around artistic activities
skill,the fulfillment of goals around learning of new skills
culture,the fulfillment of goals around cultural activities
soul,the level of happiness and value from activities related to the interiority
`


/**
 * takes an array of arrays representing a csv file and returns an array of objects.
 * The object keys will be provided by the row of the inputArray 
 * @param {Array} inputArray  array (rows) of arrays (columns) representing a csv file
 */
const headedArray = inputArray => {
    const header = inputArray[0];
    let outputArray = inputArray.map( (line) => {
        let row = {}
        header.map( (key,i) => row[key] = line[i] )
        return row;
    })
    outputArray.shift()
    return outputArray
}

class Nagger{

    constructor(ctrl){
        this.ctrl = ctrl
        this.questions = headedArray(Papa.parse(questionsString).data)
        this.descriptions = headedArray(Papa.parse(descriptionsString).data)
        this.weeksCadence = 6
        this.parsedAnswer = new Map([
            ['yes',true],
            ['no',false]
        ])
        this.loadAnswers()
    }

    loadAnswers(){
       const answersPath = './data/json/answers.json' 
       fetch(answersPath)
       .then(response => response.json())
       .then( data => {
           this.answers = data
           this.convertDates()
           this.ctrl.runPromise('wait-answers')
        })
    }

    convertDates(){
        this.answers.forEach( ans => ans.date = new Date(ans.date))
    }

    answer(idq,answer){
        this.answers.push({
            idq,
            answer: this.parsedAnswer.get(answer),
            date: new Date()
        })
    }

    saveAnswers(){
        const data = this.answers;
        fetch('/answers', {
            method: 'POST', 
            headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data),
            })
            .then(response => response.json())
            .then(data => {
                if (data === 'success'){
                    this.ctrl.ui.alertUser('save-answers-success')
                } else {
                    this.ctrl.ui.alertUser('save-answers-failure')
                }
            })
            .catch((error) => {
                this.ctrl.ui.alertUser('save-answers-failure', error)
                // console.error('Error:', error);
            });
    }

    waitingForAnswers(){
        if (!this.answers){
            return 'wait-answers'
        }
    }

    checkAnswers(focus){
        if (this.answers){
            const questionsArray = this.queryQuestions(focus)
            const lastAnswers = this.lastAnswers(questionsArray)
            const gameLevels = this.gameLevels(lastAnswers)
            const answers = lastAnswers.filter( a => gameLevels.includes( a.level ) )
            return {
                answers: answers,
                levels: gameLevels,
                quality: this.checkQuality(answers),
                score: this.checkScore(answers,gameLevels)
            }
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


    checkQuality(answers){
        const today = new Date(),
            cadence = this.weeksCadence * 1000 * 60 * 60 * 24 * 7 // millisends by seconds by hours by day by week
        const answersQuality = answers.map( 
                a => a.date? 100 / ( 1 + Math.floor( (today-a.date) / cadence ) ) : 0
            )
        return Math.round( answersQuality.reduce( (prev,curr)=> prev + curr ) /answersQuality.length )
    }

    checkScore(answers, gameLevels){
        const nLevs = gameLevels.length
        const lastLevAnswers = answers.filter( a => a.level === gameLevels[nLevs-1] )
        const trueCount = lastLevAnswers.filter( a => a.answer ).length
        const lastScoreFrac = Math.floor( 2 * trueCount / lastLevAnswers.length ) /2
        const b4last = Number(gameLevels[nLevs-2]||0),
            last = Number(gameLevels[nLevs-1])
        return  b4last + lastScoreFrac*(last-b4last)
    }

    

}


