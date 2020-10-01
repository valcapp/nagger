class seeSection extends Section{
    constructor(ui){
        super(ui,'.see-div')
        this.content = new seeContent(this)
    }
}

class seeContent extends Content{

}