let dictionary = [];
let dictionary2 = [];
let commonWords = [];




//辞書読み込み
Promise.all([
  fetch("./ejdict_connected_idioms_lower_ver16.json").then(r => r.json()),
  fetch("./ejdict_kaisetunaiidiom.json").then(r => r.json()),
  fetch("./commonwords.json").then(r => r.json())
]).then(([dict1, dict2, dict3]) => {
  dictionary=dict1;
  dictionary2=dict2;
  commonWords=dict3
  //console.log("辞書読み込み完了");
});

const searchInput = document.getElementById("inputText");
const translationText = document.getElementById("translationText");
const translationHistory= document.getElementById("translationHistory");



//function定義　関数
//かっこの外のみ取り出す(あい(う)えお)かきなどに対応。かきのみ出力
function replaceNested(str,pre,post) {
  //console.log(`replaceNestedの入力${str}`)
  const parts1 = [];
  let current = ""; //文字を蓄積
  let depth = 0; //かっこに入っているかいないか　1ならかっこの中
  for (let i = 0; i < str.length; i++) {
    const charactor = str[i]; //現在見ている文字
    if (charactor === pre) {//（など
      if (depth === 0) {//今からかっこの中に入る
        parts1.push(current.trim())
        current = ""
      }
      if (depth >=1){//(あい(う)えお)の二個目の（、"あい"は入ってほしくない
        current = ""
      }
      depth++;
    } else if (charactor === post) {//)など
      if (depth >= 1) {//地の文に戻るとき
        current = ""//リセット
      }
      depth--;
    } else {
      if (depth === 0) {  //地の文
        current += charactor;
      }
    }
  }
  if (current.trim()) parts1.push(current.trim());
  //console.log(`replaceNestedの出力${parts1.filter((x) => x)}`)
  return parts1.filter((x) => x).join("")  
}

//かっこの中のみ取り出す。(あい(う)えお)かきなどに対応。あい(う)えおを出力
function matchNested(str,pre,post) {
  //console.log(`matchNestedの入力${str}`)
  const parts2 = [];
  let current = ""; //文字を蓄積
  let depth = 0; //かっこに入っているかいないか　1ならかっこの中
  let index =-1
  for (let i = 0; i < str.length; i++) {
    const charactor = str[i]; //現在見ている文字
    if (charactor === pre) {//（など
      if (depth === 0) {//かっこに入るとき
        current = "";//何もしない
        index=i
      }
      if (depth  >=1) {  //かっこのなか
        current += charactor;
      }
      depth++;//かっこに入ったよ
    } else if (charactor === post) {//)など
      if (depth === 1) {//一重目のかっこから出るとき
        parts2.push(Object.assign([`${pre}${current.trim()}${post}`,current.trim()],{index:index}));
        current = ""
      }
      if (depth >=2) {  //かっこのなか
        current += charactor;
      }
      depth--;
    } else if (depth  >=1) {  //かっこのなか
      current += charactor;
    }
  }
  if (current.trim()) parts2.push(Object.assign([`${pre}${current.trim()}${post}`,current.trim()],{index:index}));
  //console.log(`matchNestedの出力${parts2.filter((x) => x)}`)
  return parts2.filter((x) => x)
}

//m語の長さの語句検索
function lookupwords(words, m) {
  let phrase = "";
  let visited = new Set();
  phrase = words.slice(0, m).join(" ");
  if (dictionary[phrase]) {
    let meaning1 = dictionary[phrase];
    let accumulatedMeaning = meaning1; //amir=emirなどほかに飛ばされるときの処理
    visited.add(phrase);
    while (meaning1.startsWith("=")) {
      
      //let phrase2 = meaning1.replace(/^\s*=\s*/, "");
      let phrase2 = meaning1.replace(/^=([a-zA-Z]+).*/, "$1");//=wonderful / はなはだ,著しくでwonderfulを残す
      //console.log("lookupwords_meaning1=",meaning1)
      //console.log("lookupwords_phrase2=",phrase2)

      if (visited.has(phrase2)) {
        break;
      }
      visited.add(phrase2);
      meaning1 = dictionary[phrase2] || "参照先の訳が見つかりません";
      shortedMeaning1 = getShortMeaning(meaning1)
      if (commonWords.includes(phrase2)){
        shortedMeaning1=getveryShortMeaning(meaning1)
      }
      accumulatedMeaning = accumulatedMeaning+ "  ※" + phrase2 + "→" +  shortedMeaning1;
      //accumulatedMeaning = shortedMeaning1 + accumulatedMeaning.replace("="+phrase2,"") 
    }
    let key = words.slice(0, 1).join(); //配列から文字列にしている
    return {
      key: key,
      phrase: phrase,
      meaning: accumulatedMeaning,
      length_m: phrase.split(" ").length,
    };
  }
}
//イディオム検索
function lookupIdiom(words) {
  for (let m = 3; m >= 1; m = m - 1) {
    //for(初期条件;条件;更新){繰り返す処理}
    phrase = words.slice(0, m).join(" ");
    if (words.length >= m) {
      let res = lookupwords(words, m);
      if (res) return res;
      if (m === 1 && phrase.endsWith("s")) {
        //三単現、複数形のs消去
        let original = phrase.replace(/s$/, "");
        res = lookupwords([original], 1);
        if (res) {
          return res;
        }
        if (phrase.endsWith("ies")) {
          original = phrase.replace(/(ies)$/, "y");
        }
        if (/(oes|ses|ches|shes|xes|zes)$/.test(phrase)) {
          original = phrase.replace(/(es)$/, "");
        }
        res = lookupwords([original], 1);
        if (res) {
          return res;
        }
      }
      if (m === 1 && phrase.endsWith("ed")) {
        //過去形のed消去
        let original2 = phrase.replace(/ed$/, "");
        res = lookupwords([original2], 1);
        if (res) {
          return res;
        }
        if (phrase.endsWith("ied")) {
          original2 = phrase.replace(/(ied)$/, "y");
        }
        if (phrase.endsWith("cked")) {
          original2 = phrase.replace(/(ked)$/, "");
        }
        if (phrase.endsWith("pped")) {
          original2 = phrase.replace(/(ped)$/, "");
        }
        if (phrase.endsWith("rred")) {
          original2 = phrase.replace(/(red)$/, "");
        }
        if (phrase.endsWith("tted")) {
          original2 = phrase.replace(/(ted)$/, "");
        }
        res = lookupwords([original2], 1);
        if (res) {
          return res;
        }
        original2 = phrase.replace(/d$/, "");//generated
        res = lookupwords([original2], 1);
        if (res) {
          return res;
        }
      }
      if (m === 1 && phrase.endsWith("ing")) {
        //ing消去
        let original3 = phrase.replace(/ing$/, "");
        res = lookupwords([original3], 1);
        if (res) {
          return res;
        }
        if (phrase.endsWith("ying")) {
          original3 = phrase.replace(/(ying)$/, "ie");
        }
        if (/([bcdfghjklmnpqrstvwxyz])\1ing$/.test(phrase)) {
          original3 = phrase.replace(/([bcdfghjklmnpqrstvwxyz])\1ing$/, "$1");
        }
        res = lookupwords([original3], 1);
        if (res) {
          return res;
        }
        original3 = phrase.replace(/(ing)$/, "e");
        res = lookupwords([original3], 1);
        if (res) {
          return res;
        }
      }
    }
  }
  return {
    key: phrase,
    phrase: phrase,
    meaning: "訳が見つかりません",
    length_m: 1,
  };
}

//イディオム検索２（長文を上記のイディオム検索に渡す）
function lookupIdiom2(words) {
  let translation = [];
  let i = 0;
  let result1;
  while (i < words.length) {
    let takenwords = words.slice(i, i + 3);
    result1 = lookupIdiom(takenwords);
    //translation.push(`${result1.phrase}→${result1.meaning}`);
    translation.push({
      key: result1.key,
      phrase: result1.phrase,
      meaning: result1.meaning,
    });
    i = i + result1.length_m;
  }
  //console.log("lookupIdiom2_translation=", translation);
  return translation;
}

//意味短縮
function getShortMeaning(fullMeaning) {
  let shortMeaning = fullMeaning;
  //let shortMeaning = fullMeaning.replace(/《.*?》/g, "");
  //if ((fullMeaning.match(/\//g) || []).length <= 2) {
    //return shortMeaning;
  //}
  let idiomMatches = [];
  let fullMeaningMatchAll=matchNested(fullMeaning, "《", "》")
  for (const m of fullMeaningMatchAll){
  //for (const m of fullMeaning.matchAll(/《([^》]*)》/g)) {
    //《》で囲まれた部分を全部抜き出す。idiomMatchesに入れる。
    //m[0]=《文字》m[1]=文字 m.index=《が文章の何文字目か
    if (m[1]) {
      idiomMatches.push({
        idiom: m[1].trim(),
        nextIndex: m.index + m[0].length,
        firstIndex: m.index,
      });
    }
  }
  
  for (let n = 0; n < idiomMatches.length; n++) {
    //配列idiomMatchesの中身を順に全部処理する
    let idiomMatchesmoji = idiomMatches[n].idiom;
    if (idiomMatchesmoji) {
      if (!/[^A-Za-z .『』]/.test(idiomMatchesmoji)) {
        // 英字・スペース・ピリオド『』だけで構成されている
        let meaningAfter1 = fullMeaning.slice(idiomMatches[n].nextIndex);
        let nextSlash1 = meaningAfter1.indexOf("/");
        if (nextSlash1 !== -1) {
          shortMeaning = shortMeaning.replace(
            meaningAfter1.slice(0, nextSlash1),
            "",
          );
        }
        let meaningBefore1 = fullMeaning.slice(0, idiomMatches[n].firstIndex);
        let beforeSlash1 = meaningBefore1.lastIndexOf("/");
        if (beforeSlash1 !== -1) {
          shortMeaning = shortMeaning.replace(
            meaningBefore1.slice(beforeSlash1 + 1),
            "",
          );
        }
      }
     //  shortMeaning = shortMeaning.replace(/《.*?》/g, "");
      shortMeaning = replaceNested(shortMeaning,"《","》");
    }
  }
  //console.log("getShortMeaning_1:", shortMeaning);
  if (shortMeaning.includes("『")) {//wise→『賢い』,賢明な,思慮分別のある / 『博識な』...などをwise→賢い/博識なにする
    let matches=matchNested(shortMeaning,"『","』").map(m=>m[1]).filter(m => /[ぁ-んァ-ヶ一-龠々ー]/.test(m))
    if (matches.length >0){
      shortMeaning = matches.join("/");
    }
  }
  const brackets = [
    ["(", ")"],
    ["<", ">"],
    ["〈", "〉"],
    ["[", "]"]
  ];
  for (const [pre, post] of brackets) {
    shortMeaning = replaceNested(shortMeaning, pre, post);
  }
  shortMeaning = shortMeaning
    //.replace(/\(.*?\)/g, "")
    //.replace(/<.*?>/g, "")
    //.replace(/〈.*?〉/g, "")
    //.replace(/\[.*?\]/g, "")
    .replace(/[…\.‘']/g, "")//…とピリオドを削除。ピリオドは特殊文字なので\でエスケープ
    .replace(/(,\/)/g, "/")
    .replace(/(;\/)/g, "/")
  let shortMeaningDividedBySlash=shortMeaning.split("/")
  let filtered1 = shortMeaningDividedBySlash.filter(m => /[ぁ-んァ-ヶ一-龠々ーa-zA-Z ]/.test(m));
    //console.log("getShortMeaning_1:", filtered1);
  shortMeaning=filtered1.join("/")
  return shortMeaning;
}

//意味短縮２　より短く
function getveryShortMeaning(fullMeaning){
  let veryShortMeaning =fullMeaning
  if (veryShortMeaning.includes("『")) {
    let matches = 
    //veryShortMeaning.match(/『(.*?)』/g);
    matchNested(veryShortMeaning,"『","』").map(m=>m[0])
    veryShortMeaning = matches.map((s) => s.replace(/[『』]/g, "")).join("/");
  }else{
    veryShortMeaning = fullMeaning.split(/[\/]/)[0];
  }
  //let shortMeaning = fullMeaning.replace(/《.*?》/g, "");
  //console.log("getveryShortMeaning_fullMeaning1:", fullMeaning,"veryShortMeaning:",veryShortMeaning);
  if (/^《[^》]*?》$/.test(veryShortMeaning)){//do→《疑問文・否定文を作る》 / 《否定命令文を作る》
    //veryshortMeaning=veryshortMeaning.matchAll(/《([^》]*)》/g)[0][1]
    veryShortMeaning=matchNested(veryShortMeaning,"《","》")[0][1]
    return veryShortMeaning
  }
  let idiomMatches = [];
  //for (const m of veryshortMeaning.matchAll(/《([^》]*)》/g)) {
  let veryShortMeaningMatchAll=matchNested(veryShortMeaning, "《", "》")
  for (const m of veryShortMeaningMatchAll){
    //《》で囲まれた部分を全部抜き出す。idiomMatchesに入れる。
    //m[0]=《文字》m[1]=文字 m.index=《が文章の何文字目か
    if (m[1]) {
      idiomMatches.push({
        idiom: m[1].trim(),
        nextIndex: m.index + m[0].length,
        firstIndex: m.index,
      });
    }
  }
  for (let n = 0; n < idiomMatches.length; n++) {
    //配列idiomMatchesの中身を順に全部処理する
    let idiomMatchesmoji = idiomMatches[n].idiom;
    if (idiomMatchesmoji) {
      if (!/[^A-Za-z .『』]/.test(idiomMatchesmoji)) {
        // 英字・スペース・ピリオド『』だけで構成されている
        let meaningAfter2 = veryShortMeaning.slice(idiomMatches[n].nextIndex);
        let nextSlash2 = meaningAfter2.indexOf("/");
        if (nextSlash2 !== -1) {//スラッシュが見つかったら
          veryShortMeaning = veryShortMeaning.replace(
            meaningAfter2.slice(0, nextSlash2),
            "",
          );
        }
        let meaningBefore2 = veryShortMeaning.slice(0, idiomMatches[n].firstIndex);
        let beforeSlash2 = meaningBefore2.lastIndexOf("/");
        if (beforeSlash2 !== -1) {
          veryShortMeaning = veryShortMeaning.replace(
            meaningBefore2.slice(beforeSlash2 + 1),
            "",
          );
        }
      }
      //veryShortMeaning = veryShortMeaning.replace(/《.*?》/g, "");
      veryShortMeaning = replaceNested(veryShortMeaning,"《","》");
    }
  }
  const brackets = [
    ["(", ")"],
    ["<", ">"],
    ["〈", "〉"],
    ["[", "]"]
  ];
  for (const [pre, post] of brackets) {
    veryShortMeaning = replaceNested(veryShortMeaning, pre, post);
  }
  veryShortMeaning=veryShortMeaning
  .replace(/[…\.]/g, "")
  .replace(/(,\/)/g, "/")
  .replace(/(;\/)/g, "/")
  let veryShortMeaningDividedBySlash=veryShortMeaning.split("/")
  let filtered2 = veryShortMeaningDividedBySlash.filter(m => /[ぁ-んァ-ヶ一-龠々ー]/.test(m));
  if(filtered2){
    veryShortMeaning=filtered2[0]
  }
  //console.log("getveryShortMeaning_veryShortMeaning2=",veryShortMeaning)
  return veryShortMeaning;
}

//辞書２での検索
function lookupIdiom3(words) {
  let translation3 = [];
  for (let p = 0; p < words.length; p++) {
    let key = words[p];
    if (dictionary2[key]) {
      let chancedIdioms = dictionary2[key];
      for (let y = 0; y < chancedIdioms.length; y++) {
        let chancedIdiom = chancedIdioms[y];
        let nextWordDistance = chancedIdiom.at(-1);
        let nextWord = chancedIdiom[1 + nextWordDistance]
          .replace(/[^a-z]/gi, "")
          .toLowerCase();
        // console.log(
        //   `lookupIdiom3_key=${key},nextWord=${nextWord},nextWordDistance=${nextWordDistance}`,
        // );
        for (let f = 1; p + f < words.length; f++) {
          if (
            words[p + f] &&
            nextWord === words[p + f].replace(/[^a-z]/gi, "").toLowerCase()
          ) {
            //nextwordの位置に語が存在するかつ一致する
            translation3.push(chancedIdiom);
          }
        }
      }
    }
  }
 // console.log("lookupIdiom3_translation3=", translation3);
  let newTranslation3 = [];
  for (let i = 0; i < translation3.length; i++) {
    let meaningA = translation3[i].at(-2);
    for (let j = i + 1; j < translation3.length; j++) {
      let meaningB = translation3[j].at(-2);
      if (meaningA === meaningB) {
        let newIdiom = [];
        for (
          let k = 0;
          k < Math.min(translation3[i].length - 2, translation3[j].length - 2);
          k++
        ) {
          if (translation3[i][k] === translation3[j][k]) {
            newIdiom.push(`${translation3[i][k]}`);
          } else {
            newIdiom.push(`${translation3[i][k]}(${translation3[j][k]})`);
          }
        }
        newIdiom = newIdiom
          .join(" ") //配列を空白で結合して文字列にする
          .replace(/[『』]/g, "")
          .replace(/[^\w\s'ぁ-んァ-ヶ一-龠々ー()]/g, " ")
          .replace(/[-]/g, " ")
          .toLowerCase()
          .replace(/\s+/g, " "); //連続する空白文字を半角スペース1つに置き換える
        newTranslation3.push({
          key: String(translation3[i][0]),
          phrase: newIdiom,
          meaning: meaningA,
        });
      }
    }
    //console.log("lookupIdiom3_newTranslation3", newTranslation3);
  }
  translation3 = translation3.map((a) => ({
    key: String(a[0]),
    phrase: a
      .slice(0, -2)
      .join(" ") //配列を空白で結合して文字列にする
      .replace(/[『』]/g, "")
      .replace(/[^\w\s'ぁ-んァ-ヶ一-龠々ー]/g, " ")
      .replace(/[-]/g, " ")
      .toLowerCase()
      .replace(/\s+/g, " "),
    meaning: a[a.length-2],
  }));
  if (newTranslation3.length > 0) {
    return newTranslation3;
  }
  return translation3;
  //return newTranslation3 && newTranslation3.length > 0
    //? newTranslation3
    //: translation3; 
}



//読み込み時フォーカス
searchInput.focus()
//キーを押したときフォーカス
document.addEventListener("keydown",(e)=>{
  if(document.activeElement!==searchInput){
    if(e.ctrlKey) {
      return
    }
    searchInput.focus()
  }
})
document.addEventListener("keyup",(e)=>{
  if (e.ctrlKey){
    searchInput.focus();
  }
})
//クリックしたときフォーカス
document.addEventListener("click",()=>{
  const selection=window.getSelection()
  if(!selection||selection.toString().length===0){
  searchInput.focus()
  }
})

//検索欄_入力
let resultArray=[];
searchInput.addEventListener("input", () => {
    if (!dictionary || !dictionary2) {
      //console.log("辞書がまだロードされていません");
      return;
    }
    let words = searchInput.value 
      .replace(/[^\w\s']/g, " ")
      .replace(/[-]/g, " ")
      .toLowerCase()
      .replace(/\s+/g, " ") //連続する空白文字を半角スペース1つに置き換える
      .trim()
      .split(" "); //配列に戻す

    let result2 = lookupIdiom2(words);
    resultArray = result2.map((result2Item) => {
      let [key, phrase, meaning] = [
        result2Item.key,
        result2Item.phrase,
        result2Item.meaning,
      ];
      let shortMeaning = getShortMeaning(meaning);
      let veryShortMeaning=""
      if (commonWords.includes(result2Item.phrase)){
        veryShortMeaning=getveryShortMeaning(meaning)
      }
      return {
        key: key,
        phrase: phrase,
        veryShortMeaning:veryShortMeaning,
        shortMeaning: shortMeaning,
        fullMeaning: meaning,
      };
    });
    //console.log("searchInput_resultArray=", structuredClone(resultArray));

    let result3 = lookupIdiom3(words);
    resultArray = resultArray.map((i) => {
      let newMeaning = i.shortMeaning || "";
      let VeryShortMeaningAdd=""
      for (let q = 0; q < result3.length; q++) {
        const key1 = i.key;
        const key2 = result3[q].key;
        let extraMeaning = "";
        if (key1 === key2) {
          extraMeaning = "《" + result3[q].phrase + "》" + result3[q].meaning; // 追加の意味
          if (extraMeaning) {//extraMeaningがあれば足す
            if (newMeaning === "訳が見つかりません" || newMeaning === "") {
              newMeaning = extraMeaning;
            } else {
              newMeaning = newMeaning + "<br>" + extraMeaning;
              VeryShortMeaningAdd =VeryShortMeaningAdd+ "<br>" + extraMeaning;
            }
          }
        }
      }
      i.shortMeaning = newMeaning;
      i.veryShortMeaningAdd=VeryShortMeaningAdd
      return i;
    });
    //console.log("searchInput_resultArrayAfterResult3=", resultArray);
    //translationContainer.style.display = "flex";
    let translatedHTML=resultArray.map((i,index) => {
    const phrase=i.phrase
    const short = i.veryShortMeaning ? i.veryShortMeaning + i.veryShortMeaningAdd : i.shortMeaning;
    const full = i.fullMeaning;
    return `
      <div class="word-block">
        <details>
          <summary>
            ${phrase}→${short}
            <button class="saveBtn" data-index="${index}" data-phrase="${phrase}" data-short="${short}" data-full="${full}">保存</button> 
          </summary>
          <div>${full}</div>
        </details>
      </div>
    `;
    })
    .join("");
    translationText.innerHTML=translatedHTML;
    //console.log("searchInput_translationText.innerHTML",translationText.innerHTML)

  }
);

//検索欄_Enter
searchInput.addEventListener("keydown", (e) => {
  if(e.key!=="Enter") return;
  e.preventDefault();//Enter押しても改行しないようにする
  if(searchInput.value.trim()==="")return;//入力欄に何もなければ何もしない
  translationHistory.insertAdjacentHTML(
    "afterbegin",`<div class=history-block>${translationText.innerHTML}</div>`
  )
  searchInput.value = ""
  translationText.innerHTML=""
})

//以下保存機能追加用
let savedWords=[];
const translationContainer = document.getElementById("translationContainer");
const container = document.getElementById("savedWords");
const exportBtn = document.getElementById("exportBtn");
exportBtn.addEventListener("click", exportToExcel);

//保存機能function
//保存
function save(phrase,short,full){
  const exsisting=savedWords.find(item => item.phrase === phrase)
  if(exsisting){
    exsisting.count++;
  }else{
    const count=1
    savedWords.push({phrase,short,full,count})
  }
  localStorage.setItem("savedWords", JSON.stringify(savedWords));
  renderSavedWords()
}


//削除
function remove(phrase){
  savedWords=savedWords.filter(item=>item.phrase!==phrase);
  localStorage.setItem("savedWords", JSON.stringify(savedWords));
  renderSavedWords()
}


//表示
function renderSavedWords() {
  //const container = document.getElementById("savedWords");//外に書いた
  container.innerHTML = savedWords.map(item =>`
    <div class="word-block">
      <details>
        <summary>
          ${item.phrase}→${item.short}
          <button class="removeBtn" data-phrase="${item.phrase}">×</button>
        </summary>
       <div>${item.full}</div>
      </details>
    </div>
  `).join("");
}

//Excelファイルに保存
function exportToExcel(){
  if (savedWords.length===0){
    alert("保存された単語がありません")
    return
  }
  const wsData=savedWords.map(item=>({
    phrase:item.phrase,
    short:item.short,
    full:item.full,
    count:item.count
  }))
  const ws=XLSX.utils.json_to_sheet(wsData)
  const wb=XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb,ws,"SavedWords")
  XLSX.writeFile(wb,"saved_words.xlsx")
}

//保存機能クリック
//保存ボタンクリック
document.body.addEventListener("click", (e) => {
  if(!e.target.classList.contains("saveBtn"))return;
  const phrase=e.target.dataset.phrase
  const short=e.target.dataset.short
  const full=e.target.dataset.full
  //console.log(`document.body_phrase=${phrase},short=${short},full=${full}`);
  save(phrase, short, full)
})

//×ボタンクリック
container.addEventListener("click", (e) => {
if(!e.target.classList.contains("removeBtn"))return;
const phrase=e.target.dataset.phrase
remove(phrase);
})
