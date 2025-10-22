//  verificacao de usuario logado 
let currentUser = null;

// recupera o usuário completo do localStorage
try {
    const usuarioLogado = localStorage.getItem("usuarioLogado");
    if (usuarioLogado) {
        currentUser = JSON.parse(usuarioLogado);
        console.log("👤 Usuário logado:", currentUser);
    } else {
        window.location.href = "index.html";
    }
} catch (error) {
    console.error("Erro ao carregar usuário:", error);
    window.location.href = "index.html";
}

// cria o baralho automatico 
async function createDefaultDeck() {
    try {
        console.log("📚 Criando baralho padrão para usuário:", currentUser.idusuarios);
        
        const res = await fetch("/baralho", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                titulo: "Meu Baralho Principal",
                descricao: "Baralho padrão do usuário",
                usuario_id: currentUser.idusuarios
            })
        });
        
        const result = await res.json();
        
        if (!res.ok) {
            throw new Error(result.error || "Erro ao criar baralho");
        }
        
        return result;
    } catch (err) {
        console.error("❌ Erro ao criar baralho:", err);
        throw err;
    }
}

//  obter ou criar baralho
async function getOrCreateDeck() {
    try {
        const baralhosRes = await fetch(`/baralhos/${currentUser.idusuarios}`);
        
        if (!baralhosRes.ok) {
            const error = await baralhosRes.json();
            throw new Error(error.error || "Erro ao buscar baralhos");
        }
        
        const baralhos = await baralhosRes.json();
        
        if (baralhos.length === 0) {
            const novoBaralho = await createDefaultDeck();
            return novoBaralho.id;
        }
        
        return baralhos[0].idbaralho;
        
    } catch (err) {
        console.error("❌ Erro ao obter/criar baralho:", err);
        throw err;
    }
}

//  contar flashcards 
async function countFlashcards() {
    try {
        const res = await fetch(`/flashcards/${currentUser.idusuarios}`);
        
        if (!res.ok) {
            const error = await res.json();
            throw new Error(error.error || "Erro ao contar flashcards");
        }
        
        const cards = await res.json();
        return cards.length;
        
    } catch (err) {
        console.error("❌ Erro ao contar flashcards:", err);
        return 0;
    }
}

//  carrega os flashcards
async function loadFlashcards() {
    const wrapper = document.getElementById("cards-wrapper");
    const msgElement = document.getElementById("msg");

    try {
        const res = await fetch(`/flashcards/${currentUser.idusuarios}`);
        
        if (!res.ok) {
            const error = await res.json();
            throw new Error(error.error || "Erro ao carregar flashcards");
        }
        
        const cards = await res.json();

        wrapper.innerHTML = "";

        if (cards.length === 0) {
            wrapper.innerHTML = "<p>Nenhum flashcard encontrado. Adicione o primeiro!</p>";
            return;
        }

        // layout
        cards.forEach(c => {
            const carta = document.createElement("div");
            carta.classList.add("carta");
            carta.innerHTML = `
                <div class="frente">${c.frente}</div>
                <div class="verso">${c.verso}</div>
            `;
            carta.addEventListener("click", () => carta.classList.toggle("virada"));
            wrapper.appendChild(carta);
        });
        
        // atualiza contador
        msgElement.innerText = `${cards.length}/20 flashcards criados`;
        
    } catch (err) {
        console.error("❌ Erro ao carregar flashcards:", err);
        wrapper.innerHTML = "<p>Erro ao carregar flashcards.</p>";
    }
}

//  cria o flashcard 
document.getElementById("flashcard-form").addEventListener("submit", async e => {
    e.preventDefault();
    
    const frente = document.getElementById("pergunta").value.trim();
    const verso = document.getElementById("resposta").value.trim();
    const msgElement = document.getElementById("msg");

    if (!frente || !verso) {
        msgElement.innerText = "Preencha todos os campos!";
        msgElement.style.color = "red";
        return;
    }

    try {
        // verifica se tem mais de 20 flashcards
        const totalFlashcards = await countFlashcards();
        if (totalFlashcards >= 20) {
            msgElement.innerText = "❌ Limite de 20 flashcards atingido!";
            msgElement.style.color = "red";
            return;
        }

        const baralhoId = await getOrCreateDeck();
        
        const res = await fetch("/flashcard", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ 
                baralho_id: baralhoId, 
                frente, 
                verso 
            })
        });

        const result = await res.json();

        if (!res.ok) {
            throw new Error(result.error || "Erro ao criar flashcard");
        }

        msgElement.innerText = `✅ Flashcard criado! (${totalFlashcards + 1}/20)`;
        msgElement.style.color = "green";
        e.target.reset();
        
        // Recarrega a lista
        loadFlashcards();
        
    } catch (err) {
        console.error("❌ Erro ao criar flashcard:", err);
        msgElement.innerText = "Erro ao criar flashcard!";
        msgElement.style.color = "red";
    }
});

//  logout
document.getElementById("logout-btn").addEventListener("click", () => {
    localStorage.removeItem("usuarioLogado");
    window.location.href = "index.html";
});

//  INICIALIZAÇÃO 
loadFlashcards();
