class seeSection extends Section{
    constructor(ui){
        super(ui,'.see-div')
        this.content = new seeContent(this)
    }
}

class seeContent extends Content{
    constructor(section){
        super(section)
        this.section.domDiv.querySelector('div.save-answers button').addEventListener('click',()=>{
            document.querySelector('.sections-menu .tell-mi').click()
        })
        this.reviewContent()
    }

    generateContent(){
        this.textArea().innerHTML = this.focus? `<h3>${this.focus.item}</h3>` : `<h3>Overall</h3>`
        this.showData()
    }

    showData(tell=true){
        const focus = this.focus
        const score = this.ui.nagger.assessScore(focus)
        const accuracy = this.ui.nagger.assessQuality(focus)
        const childrenScores = this.nextDepth().map( i => {
            return{
                name: i.item,
                score: this.ui.nagger.assessScore(i)
            } 
        })
        this.showScore(score)
        this.showRadar(childrenScores)
        if(tell){this.tellData(score,accuracy)}
    }

    showScore(data){
        this.score = new ScoreSvg(this.textArea(),50)
        this.score.refresh(data)
    }

    showRadar(data){
        if (!this.radar){
            this.radar = new PlotlyRadar(this.domDiv,'ply-radar-canvas')
        }
        this.radar.refresh(this.parseRadarData(data))
    }

    parseRadarData(data){
        return {
            r: data.map( d => d.score ),
            theta: data.map( d => d.name)
        } 
    }

    tellData(score,accuracy){
        this.textArea().innerHTML += 
        `<p>Your current score is ${score.toFixed(1)}.</p>
        <p> I know ${accuracy}% of potential data.
        To increase the percentage, click on the button below.</p>
        `
    }
}

class PlotlyRadar extends PlotlyChart{

    getLayout(){
        return {
            polar: {
                radialaxis: {
                    visible: true,
                    range: [0, 5]
                }
            }
        }
    }

    getData(data){
        return [{
            type: 'scatterpolar',
            r: data.r,
            theta: data.theta,
            fill: 'toself',
            marker: {
                color: '#e60073'
            }
        }]
    }

}