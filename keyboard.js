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

    init(){//keybordとkeysを作る
        this.elements.main=document.createElement("div")
        this.elements.keysContainer=document.createElement("div")

        this.elements.main.classList.add("keyboard","1keyborad--hidden")
        this.elements.keysContainer.classList.add("keyboard__keys")

        this.elements.main.appendChild(this.elements.keysContainer)//keysContainer を main の子要素に追加。
        document.body.appendChild(this.elements.main)//完成したキーボードをbodyへ追加。
    },

    _createKeys(){//_は外部から呼ばないprivateなものという意味。人間向けの説明で、機能的には何も変わらない。
        const fragment=document.createDocumentFragment();
        const keyLayout =[
            "q","w","e","r","t","y","u","i","o","p","backspace",
            "a","s","d","f","g","h","j","k","l",
            "z","x","c","v","b","n","m","enter",
            "space","←","→",
        ];

        const createIconHTML =(icon_name)=>{
            return <i class="material-icons">${icon_name}</i>
        }

        keyLayout_forEach(key=>{
            const keyElement=document.createElement("button")
            const insertLineBreak=["backspace","l","enter"].indexOf(key)!==-1
            
            keyElement.setAttribute("type","button")
            keyElement.classList.add("keyboard__key")

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
                    keyElement.classList.add("keyboard__key--wide")
                    keyElement.innerHTML=createIconHTML("keyboard_return")
                    keyElement.addEventListener("click",()=>{
                        this.properties.value+="\n"
                        this._triggerEvent("oninput")
                    })
                    break
                case "enter":
                    keyElement.classList.add("keyboard__key-extra-wide")
                    keyElement.innerHTML=createIconHTML("space_bar")
                    keyElement.addEventListener("click",()=>{
                        this.properties.value+=" "
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
        })
    },

    _triggerEvent(handlerName){
        console.log("Event triggered"+handlerName)
    },

    open(initialValue,oninput,onclose){

    },

    close(){

    }
}

window.addEventListener("DOMContentLoaded",function(){
    Keyboard.init();
})