class Section{
    constructor(ui,selector=""){
        this.ui = ui
        this.domDiv = document.querySelector(`.section-div${selector}`)
        this.menu = new Menu(this)
    } 
}
    
class Menu{
    constructor(section){
        this.section = section
        this.ui = this.section.ui
        this.domDiv = section.domDiv.querySelector('.menu-div')
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
        menuButton.classList.add('menu-button',...classNames);
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

    getNextDepthItems(focusItem='root'){
        return this.tree.get(focusItem)
    }

}


class Content{
    constructor(section){
        this.section = section
        this.ui = this.section.ui
        this.domDiv = this.section.domDiv
        this.domDiv = this.section.domDiv.querySelector('.content-div')
        this.section.menu.domDiv.addEventListener('click',()=>this.reviewContent());
        // this.reviewContent()
    }

    reviewContent(){
        this.ui.nagger.loaded.then(()=> {
            this.wipeContent()
            this.focus =  this.readFocus()
            this.generateContent()
        })  
    }

    generateContent(){}

    wipeContent(){
        while (this.domDiv.firstChild) {
            this.domDiv.firstChild.remove()
        }
    }

    readFocus(){
        const focusItem = this.section.menu.reviewSelected()      
        return this.parseFocus(focusItem)
    }

    parseFocus(focusItem){
        if (focusItem){
            return {
                depth: Array.from(focusItem.classList).find(c=>c.includes('-depth')).replace('-depth',''),
                item: focusItem.innerHTML
            }
        }
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

    nextDepth(){
        const focusItem = this.section.menu.reviewSelected()
        const nextDepthItems = this.section.menu.getNextDepthItems(focusItem)
        if(nextDepthItems){
            return nextDepthItems.map( item => this.parseFocus(item) )
        }
    }

}


class PlotlyChart{
    constructor(homeDiv, idTag){
        this.homeDiv = homeDiv
        this.idTag = idTag
        this.color = typeof colors === 'undefined'? '#e60073' : colors.radar
    }

    getData(data){}

    getLayout() {}

    refresh(data){
        this.prepareCanvas()
        Plotly.newPlot(this.idTag,this.getData(data),this.getLayout())
    }

    prepareCanvas(){
        let canvas = this.homeDiv.querySelector(`#${this.idTag}`)
        if(!canvas){
            canvas = document.createElement('div')
            canvas.setAttribute("id",`${this.idTag}`)
            this.homeDiv.insertBefore(canvas, this.homeDiv.childNodes[0] || null);
        }
    }
}

class ScoreSvg{
    constructor(homeDiv,radius=40){
        this.homeDiv = homeDiv
        this.radius = radius
        this.ns = "http://www.w3.org/2000/svg"
        this.color = typeof colors === 'undefined'? '#A05' : colors.score
    }

    refresh(data){
        this.text(data)
    }

    svg(){
        let svg
        svg = this.homeDiv.querySelector(`.score-svg`)
        if(!svg){
            svg = document.createElementNS(this.ns, "svg")
            svg.setAttribute("height",`${2*this.radius}`)
            svg.setAttribute("width",`${2*this.radius}`)
            svg.setAttribute("class",`score-svg`)
            let circle = document.createElementNS(this.ns,'circle')
            circle.setAttribute('cx',`${this.radius}`)
            circle.setAttribute('cy',`${this.radius}`)
            circle.setAttribute('r',`${this.radius}`)
            circle.setAttribute('stroke-width',`0`)
            circle.setAttribute('fill',this.color)
            svg.appendChild(circle)
            this.homeDiv.appendChild(svg)
        }
        return svg
    }

    text(data){
        const svg = this.svg()
        let text = svg.querySelector('.score-text')
        if(!text){
            text = document.createElementNS(this.ns,'text')
            text.classList.add('score-text')
            text.setAttribute("x",`50%`)
            text.setAttribute("y",`50%`)
            text.setAttribute("dominant-baseline","middle")
            text.setAttribute("text-anchor","middle")
            text.setAttribute("font-size",`${this.radius}px`)
            text.setAttribute("fill","white")
            svg.appendChild(text)
        }
        text.innerHTML = data.toFixed(1)
    }

}
