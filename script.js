import { GoogleGenerativeAI } from "https://esm.run/@google/generative-ai";
const API_KEY = "AIzaSyChbTSxUwc_95mRTEefPsrCDhm8lukU4vk";
const genAI = new GoogleGenerativeAI(API_KEY);
const model = genAI.getGenerativeModel({
  model: "gemini-1.5-flash",
  generationConfig: {
    response_mime_type: "application/json", 
  },
});
let searchResultsEl = document.getElementById("searchResults");
let myFormEl = document.getElementById("myForm");
let errMsgEl = document.getElementById('errorMsg');
let spinner = document.getElementById("spinner");
let aiResultContainerEl = document.getElementById('aiResultContainer');
let aiSpinner = document.getElementById("aiSpinner");




function fetchWordDataAndAddResult(searchInput){
    let url = `https://api.dictionaryapi.dev/api/v2/entries/en/${searchInput}`;
    let options= {
        method: "GET"
    };
    fetch(url, options)
    .then((res)=>{
        if (!res.ok){
            spinner.classList.toggle("d-none");
            let heading =document.createElement('h1');
            heading.innerHTML = "Word Not Found";
            heading.classList.add("word");
            heading.style.textAlign = "center";
            searchResultsEl.appendChild(heading);
            let line = document.createElement('hr');
            line.classList.add("line");
            searchResultsEl.appendChild(line);
            return null;

        }
        else{
            searchResultsEl.innerHTML = "";
            return res.json();
        }  
    })
    .then((wordData)=>{
        wordData !== null?createAndAddResult(wordData[0]):0;
    });
}


function createAndAddResult(data){
    console.log(data);
    spinner.classList.toggle('d-none');

    let wordEl = document.createElement("h1");
    wordEl.classList.add("word");
    wordEl.textContent = `${data.word}`;


    let audioUrl = null;
    for(let i of data.phonetics){
        if(i.audio !== ""){
            audioUrl = i.audio;
        }
    }
    if (audioUrl !== null){
        let speakerIcon = document.createElement('i');
        speakerIcon.classList.add("bi", "bi-volume-down-fill", "speaker-icon");
        wordEl.appendChild(speakerIcon);
        let audioEl = document.createElement("audio");
        audioEl.src = audioUrl;
        audioEl.id="audioEl";
        speakerIcon.onclick = ()=>{
            audioEl.play();
        }
    }

    
    searchResultsEl.appendChild(wordEl);
    let adj = "";
    for(let i of data.meanings){
        adj += i.partOfSpeech + ` | `;
    }

    let adjAndPhoneticEl = document.createElement("p");
    adjAndPhoneticEl.classList.add("adj-phon","mb-2");
    adjAndPhoneticEl.innerHTML = `${adj.slice(0,adj.length - 2)} <span>${data.phonetic !== undefined?data.phonetic:"Not Found"}</span>`;
    searchResultsEl.appendChild(adjAndPhoneticEl);

    

    let exampleEl = document.createElement('p');
    let meaningEl = document.createElement('p');
    let example = null;
    let def = null;
    for(let meaning of data.meanings){
        for(let definition of meaning.definitions){
            if (definition.example !== undefined){
                example = definition.example;
                def = definition.definition;
            }
        }
    }
    
    if ((example !== undefined && example !== null) || (def !== undefined && def !== null)){
        exampleEl.innerHTML = `<strong>Example: </strong> ${example}`;
        meaningEl.innerHTML = `<strong>Meaning: </strong> ${def}`;
    }
    else{
        exampleEl.innerHTML = `<strong>Example: </strong> Not Found`;
        meaningEl.innerHTML = `<strong>Meaning: </strong> Not Found`;

    }

    
    meaningEl.classList.add("meaning");
    searchResultsEl.appendChild(meaningEl);

    exampleEl.classList.add("meaning");
    searchResultsEl.appendChild(exampleEl);

    let line = document.createElement('hr');
    line.classList.add("line");
    searchResultsEl.appendChild(line);

    

}

function addAIMeaningAndExample(aiData){
    aiSpinner.classList.toggle("d-none");
    let aiHeading = document.createElement('h1');
    aiHeading.innerHTML = "AI";
    aiHeading.classList.add("meaning");
    let aiIcon = document.createElement("i");
    aiIcon.classList.add("bi", "bi-robot","ai-icon");
    aiHeading.appendChild(aiIcon);
    aiResultContainerEl.appendChild(aiHeading);
    let aiExampleEl = document.createElement('p');
    let aiMeaningEl = document.createElement('p');
    aiExampleEl.innerHTML = `<strong>AI Example: </strong> ${aiData.example}`;
    aiMeaningEl.innerHTML = `<strong>AI Meaning: </strong> ${aiData.meaning}`;

    aiMeaningEl.classList.add("meaning");
    aiResultContainerEl.appendChild(aiMeaningEl);

    aiExampleEl.classList.add("meaning");
    aiResultContainerEl.appendChild(aiExampleEl);


    
}


function fetchAIMeaningAndExample(searchInput){
    const prompt = `You are a helpful language assistant. Explain the word "${searchInput}" in a simple, friendly way — like how someone from Andhra Pradesh would explain it to a friend.
        Use easy English. Keep it conversational.

        The JSON object must have two keys:
        1. "meaning": A string containing a short, clear, one-sentence definition.
        2. "example": A string containing a single, natural-sounding example sentence.

        Here is the required format:
        {
          "meaning": "...",
          "example": "..."
        }`;


        model.generateContent(prompt)
        .then(result => {
            return result.response;
        })
        .then(response => {
            return response.text();

            
        })
        .then(text => {
            try{
                addAIMeaningAndExample(JSON.parse(text));
            }
            catch(parseError){
                console.error("Failed to parse AI response as JSON:", parseError);
                aiResultContainerEl.innerHTML = `<p class="meaning">Sorry, the AI returned an unexpected format.</p>`;
            }
        })
        .catch(error=>{
            console.log(`API Error`, error);
            aiResultContainerEl.innerHTML = '';
            let aiLimitMsg =document.createElement('p');
            aiLimitMsg.innerHTML = "Currently AI is Overloaded with users, Try after 3 min.";
            aiLimitMsg.classList.add("word","m-2");
            aiLimitMsg.style.textAlign = "center";
            aiResultContainerEl.appendChild(aiLimitMsg);

        })
        
}


    



myFormEl.addEventListener("submit", (e)=>{
    e.preventDefault();
    if(myFormEl[0].value !== ""){
        searchResultsEl.innerHTML = "";
        aiResultContainerEl.innerHTML = "";
        spinner.classList.toggle("d-none");
        fetchWordDataAndAddResult(myFormEl[0].value);   
        aiSpinner.classList.toggle("d-none");     
        fetchAIMeaningAndExample(myFormEl[0].value);
        errMsgEl.innerHTML = "";
        
    }
    else{
        searchResultsEl.innerHTML = "";
        aiResultContainerEl.innerHTML = "";
        errMsgEl.innerHTML = "Search box is<span>lonely</span>, give it some<span>love!</span>";
    }
});