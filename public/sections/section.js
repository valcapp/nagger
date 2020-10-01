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

}


class Content{
    constructor(section){
        this.section = section
        this.ui = this.section.ui
        this.domDiv = this.section.domDiv.querySelector('.content-div')
        this.section.menu.domDiv.addEventListener('click',()=>this.reviewContent());
        // this.reviewContent()
    }

    reviewContent(){
        this.ui.nagger.loaded.then(()=> {
            this.wipeContent()
            this.focus = focus = this.readFocus()
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

}

