const messageInput = document.querySelector(".footer .msgInput");
const chatBody = document.querySelector(".body");
const sedMessageButton = document.querySelector(".footer .inputs .sendMsg");
const fileInput = document.getElementById("fill-input");
const fileUpload = document.getElementById("fill-upload");
const fileUploadWrapper = document.querySelector(".footer .fill-upload-wrapper");
const fileCancelButton = document.querySelector(".footer .fill-upload-wrapper .close");
const chatbotToggler = document.querySelector(".touggleBtn");
const closeChatbot = document.querySelector(".hidder #close-chatbot"); 
const clearChatBtn = document.getElementById("clear-chat");

const data = JSON.parse(localStorage.getItem("chatData")) || [];

clearChatBtn.addEventListener("click", () => {
    localStorage.removeItem("chatData");
    location.reload();
});

// const chatDataExisting = JSON.parse(localStorage.getItem("chatDataSaved")) || [];
// const chatDataStored = JSON.parse(localStorage.getItem("chatDataSaved")) || [];

// api step
const API_KEY = "AIzaSyAPlTbvPhMB4Flydoz_KgrZvNkXGNuz1LI";
const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${API_KEY}`;

const  userData = {
    message: null,
    file: {
        data: null,
        mime_type: null
    }
}

const chatHistory = [];

const initialInputHeight = messageInput.scrollHeight;
console.log(initialInputHeight)

// creat message element with dynamic classes and return it:
const creatMeassageElement = (content, classes) => {
    const div = document.createElement("div");
    div.classList.add(classes);
    div.innerHTML = content;
    return div;
}

// gemerate bot response using API
const generateBotResponse = async (incomingMessageDiv) => {
    const messageElement = incomingMessageDiv.querySelector(".body .botMsg .textBot"); 

    const currentData = [];
    currentData.push({
        type: "user",
        text: userData.message,
        file: userData.file.data ? [userData.file] : []
    });
    

    // add user message to chat hostory
    chatHistory.push({
        role: "user",
        parts: [{ text: userData.message }, ...(userData.file.data ? [{ inline_data: userData.file }] : [])]
    });


    // API request options 
    const requestOptions = {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            contents: chatHistory
        })
    }

    try{
        const response = await fetch(API_URL, requestOptions);
        const data = await response.json();
        if (!response.ok) throw new Error(data.error.message);

        const apiResponseText = data.candidates[0].content.parts[0].text.replace(/\*\*(.*?)\*\*/g, '$1').replace(/\*/g, '•').replace(/\n/g, '\n');
        const messageBotText = document.createElement("p");
        messageBotText.innerText = apiResponseText;
        messageElement.appendChild(messageBotText);

        currentData.push({
            type: "bot",
            content: apiResponseText
        });
        
        // add bot response to chat history
        chatHistory.push({
            role: "model",
            parts: [{ text: apiResponseText }]
        });
    
    } catch (error) {
        messageElement.innerHTML = error.message;
        messageElement.style.color = "#ff0000";
        console.log(error);
    } finally {
        // rest users file data, removing thinking indicator, and scroll chat to bottom smoothly
        userData.file = {};
        messageElement.classList.remove("waiting");
        chatBody.scrollTo({top: chatBody.scrollHeight, behavior: "smooth"});

        data.push(currentData);
        localStorage.setItem("chatData", JSON.stringify(data));
    }
    
}

const handleOutgoingMessage = (e) => {
    e.preventDefault();


    messageInput.style.height = `${initialInputHeight}px`;
    
    userData.message = messageInput.value.trim();
    messageInput.value = "";
    fileUploadWrapper.querySelector("img").src = "";
    // fileUploadWrapper.querySelector("img").style.display = "none";
    fileUploadWrapper.classList.remove("file-uploaded");
    messageInput.dispatchEvent(new Event("input"));

    // creat and display user message
    const messageContent = `<p>${userData.message}</p>
    ${userData.file.data ? `<img src="data:${userData.file.mime_type};base64,${userData.file.data}" class="attachment" />` : ""}`;
    // `${userData.file.data ? `<img src="data:${userData.file.mime_type};base64,${userData.file.data}" class="attachment"/>` : ""}`

    const outgoingMessageDiv = creatMeassageElement(messageContent, "userMsg");
    // outgoingMessageDiv.textContent = userData.message; eroor
    chatBody.appendChild(outgoingMessageDiv);
    chatBody.scrollTo({top: chatBody.scrollHeight, behavior: "smooth"});

    setTimeout( () => {
        const messageContentBot = `<i class="fa-solid fa-robot"></i>
                <div class="textBot waiting">
                    <div class="dot"></div>
                    <div class="dot"></div>
                    <div class="dot"></div>
                </div>`;
        
        const incomingMessageDiv = creatMeassageElement(messageContentBot, "botMsg");        
        chatBody.appendChild(incomingMessageDiv); 
        chatBody.scrollTo({top: chatBody.scrollHeight, behavior: "smooth"});

        generateBotResponse(incomingMessageDiv);
            
    }, 600);

}

// handle enter key press for sending message
messageInput.addEventListener("keydown", (e) => {
    const  userMessage = e.target.value.trim();
    if (e.key === "Enter" && userMessage && !e.shiftkey && window.innerWidth > 768){
        handleOutgoingMessage(e);
    }
});

// adjust input field hieght dynamically
messageInput.addEventListener("input", () => {
    messageInput.style.height = `${initialInputHeight}px`;
    messageInput.style.height = `${messageInput.scrollHeight}px`;
    document.querySelector(".inputs").style.borderRadius = messageInput.scrollHeight > initialInputHeight ? "15px" : "50px"
});

sedMessageButton.addEventListener("click", (e) => handleOutgoingMessage(e));

// handle file input change
fileInput.addEventListener("change", () => {
    const file = fileInput.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
        const base64String = e.target.result.split(",")[1];
        fileUploadWrapper.querySelector("img").src = e.target.result;
        fileUploadWrapper.classList.add("file-uploaded");
        
        
        // store file data in userData
        userData.file = {
            data: base64String,
            mime_type: file.type
        }

        fileInput.value = "";
    }

    reader.readAsDataURL(file);
});

// calcel file upload
fileCancelButton.addEventListener("click", () => {
    userData.file = {};
    fileUploadWrapper.classList.remove("file-uploaded");
});

// initialise imoji picker and handle emoji selection
const picker = new EmojiMart.Picker({
    theme: "light",
    skinTonePosition: "none",
    previewPosition: "none",
    onEmojiSelect: (emoji) => {
        const { selectionStart: start, selectionEnd: end } = messageInput;
        messageInput.setRangeText(emoji.native, start, end, "end");
        messageInput.focus();
    },
    onClickOutside: (e) => {
        if(e.target.id  === "select-imojies") {
            document.body.classList.toggle("show-emoji-picker");
        } else {
            document.body.classList.remove("show-emoji-picker");
        }
    }
});

// document.querySelector(".footer .select-imojies")
document.querySelector(".footer").appendChild(picker);


fileUpload.addEventListener("click", () => {
    fileInput.click();
});

chatbotToggler.addEventListener("click", () => {
    document.body.classList.toggle("show-chatbot")
    localStorage.setItem("popupStutus", document.body.classList);
});
if (localStorage.getItem("popupStutus")) {
    document.body.classList.toggle("show-chatbot")
} else {
    closeChatbot.addEventListener("click", () => document.body.classList.remove("show-chatbot"));
}
closeChatbot.addEventListener("click", () => {
    document.body.classList.remove("show-chatbot");
    localStorage.removeItem("popupStutus");
});

// get data in local storage
window.onload = (e) => {
    for (let i = 0; i < data.length; i++){
        for (let e = 0; e < data[0].length; e++) {
            if (data[i][e].type === "user") {
                let userContent = `<p>${data[i][e].text}</p>
    ${data[i][e].file[0] ? `<img src="data:${data[i][e].file[0].mime_type};base64,${data[i][e].file[0].data}" class="attachment" />` : ""}`
                let outgoingMessageDiv = creatMeassageElement(userContent, "userMsg")
                chatBody.appendChild(outgoingMessageDiv);
            } else if (data[i][e].type === "bot") {
                let messageContentBot = `<i class="fa-solid fa-robot"></i>
                    <div class="textBot">
                        <p>${data[i][e].content}</p>
                    </div>`;
                const incomingMessageDiv = creatMeassageElement(messageContentBot, "botMsg");    
                chatBody.appendChild(incomingMessageDiv);
            }
        }   
    }
}