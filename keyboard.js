console.log("hello")
const Keyboard={
    elements:{
        main: null,
        keysContainer: null,
        keys:[]
    },

    eventHandlers:{
        oninput:null,
        onclose:null
    },

    properties:{
        value:""
    },

    init(){//keyboardとkeysを作る
        this.elements.main=document.createElement("div")
        this.elements.keysContainer=document.createElement("div")

        this.elements.main.classList.add("keyboard","keyboard--hidden")
        this.elements.keysContainer.classList.add("keyboard__keys")
        this.elements.keysContainer.appendChild(this._createKeys())

        this.elements.main.appendChild(this.elements.keysContainer)//keysContainer を main の子要素に追加。
        document.body.appendChild(this.elements.main)//完成したキーボードをbodyへ追加。
        document.query
        console.log("init")
        document.dispatchEvent(
            new Event("keyboardInitFinished")
        )
    },

    _createKeys(){//_は外部から呼ばないprivateなものという意味。人間向けの説明で、機能的には何も変わらない。
        const fragment=document.createDocumentFragment();
        const keyLayout =[
            "q","w","e","r","t","y","u","i","o","p","backspace",
            "_halfblank","a","s","d","f","g","h","j","k","l","enter",
            "_fullblank","z","x","c","v","b","n","m",
            "space","←","→"
        ];

        const createIconHTML =(icon_name)=>{
            return `<i class="material-icons">${icon_name}</i>`
        }

        keyLayout.forEach(key=>{
            const keyElement=document.createElement("button")
            //const insertLineBreak=["backspace","enter","m"].indexOf(key)!==-1
            
            keyElement.setAttribute("type","button")
            keyElement.classList.add("keyboard__key")
            if (key==="_halfblank"){
                const spacer1=document.createElement("div")
                spacer1.style.gridColumn="span 1"
                fragment.appendChild(spacer1)
                return
            }
            if(key=== "_fullblank"){
                const spacer2=document.createElement("div")
                spacer2.style.gridColumn="span 2"
                fragment.appendChild(spacer2)
                return
            }
            switch(key){

                case "backspace":
                    keyElement.classList.add("keyboard__key--wide")
                    keyElement.innerHTML=createIconHTML("backspace")
                    keyElement.addEventListener("click",()=>{
                        this.properties.value=this.properties.value.substring(0,this.properties.value.length-1)
                        this._triggerEvent("oninput")
                    })
                    break
                case "enter":
                    keyElement.classList.add("keyboard__key--mid--wide","keyboard__key--tall")
                    keyElement.innerHTML=createIconHTML("keyboard_return")
                    keyElement.addEventListener("click",()=>{
                        document.dispatchEvent(                            
                            new Event("enterClicked")
                        )
                    })
                    break
                case "space":
                    keyElement.classList.add("keyboard__key--extra-wide")
                    keyElement.innerHTML=createIconHTML("space_bar")
                    keyElement.addEventListener("click",()=>{
                        this.properties.value+=" "
                        this._triggerEvent("oninput")
                    })
                    break
                case "←":
                    keyElement.classList.add("keyboard__key--wide")
                    keyElement.innerHTML=createIconHTML("keyboard_arrow_left")
                    keyElement.addEventListener("click",()=>{
                        document.dispatchEvent(                            
                            new Event("ArrowLeftClicked")
                        )
                        this._triggerEvent("oninput")
                    })
                    break
                case "→":
                    keyElement.classList.add("keyboard__key--wide")
                    keyElement.innerHTML=createIconHTML("keyboard_arrow_right")
                    keyElement.addEventListener("click",()=>{
                        document.dispatchEvent(                            
                            new Event("ArrowRightClicked")
                        )
                        this._triggerEvent("oninput")
                    })
                    break
                default:
                    keyElement.textContent=key
                    keyElement.addEventListener("click",()=>{
                        this.properties.value+=key
                        this._triggerEvent("oninput")
                    })
                    break
            }
            fragment.appendChild(keyElement)
            //if(insertLineBreak){
                //fragment.appendChild(document.createElement("br"))
            //}
        })
        return fragment
    },

    _triggerEvent(handlerName){
        console.log("Event triggered"+handlerName)
        if(typeof this.eventHandlers[handlerName]=="function"){
            this.eventHandlers[handlerName](this.properties.value)//保持した入力内容を渡す
        }
    },

    open(initialValue,oninput,onclose){
        this.properties.value=initialValue||"";
        this.eventHandlers.oninput=oninput;
        this.eventHandlers.onclose=onclose;
        this.elements.main.classList.remove("keyboard--hidden")
    },

    close(){
        this.properties.value="";
        this.eventHandlers.oninput=oninput;
        this.eventHandlers.onclose=onclose;
        this.elements.main.classList.add("keyboard--hidden")        
    }
}

window.addEventListener("DOMContentLoaded",function(){
    Keyboard.init();
    /*
    Keyboard.open("decode",function(currentValue){
        console.log(currentValue);
    },function(currentValue){
        console.log("keyboard closed!"+currentValue)
    })*/
})

/*前のキーボード設定
keys
                text-align: center;
key
                width:6%;
                max-width: 90px;
                vertical-align: top;
key--wide
                width: 12%;
key--extra--wide
                width: 70%;
                max-width: 500px;
key--tall
                height: 104px;


*/