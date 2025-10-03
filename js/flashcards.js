let currentUser = localStorage.getItem("logado");

if (!currentUser) {
  window.location.href = "index.html";
}

// ==================== CRIAR BARALHO AUTOMÁTICO ====================
async function createDefaultDeck() {
  try {
    const res = await fetch("http://localhost:3000/baralho", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        titulo: "Meu Baralho Principal",
        descricao: "Baralho padrão do usuário",
        usuario_id: currentUser
      })
    });
    return await res.json();
  } catch (err) {
    console.error("Erro ao criar baralho:", err);
  }
}

// ==================== CARREGAR FLASHCARDS ====================
async function loadFlashcards() {
  const wrapper = document.getElementById("cards-wrapper");
  wrapper.innerHTML = "";

  try {
    const res = await fetch(`http://localhost:3000/flashcards/${currentUser}`);
    
    if (!res.ok) {
      // Se não encontrar flashcards, cria um baralho padrão
      await createDefaultDeck();
      document.getElementById("msg").innerText = "Baralho criado! Adicione seu primeiro flashcard.";
      return;
    }
    
    const cards = await res.json();

    if (cards.length === 0) {
      wrapper.innerHTML = "<p>Nenhum flashcard encontrado. Adicione o primeiro!</p>";
      return;
    }

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
  } catch (err) {
    console.error("Erro ao carregar flashcards:", err);
    wrapper.innerHTML = "<p>Erro ao carregar flashcards. Verifique o servidor.</p>";
  }
}

// ==================== CRIAR FLASHCARD ====================
document.getElementById("flashcard-form").addEventListener("submit", async e => {
  e.preventDefault();
  const frente = document.getElementById("pergunta").value.trim();
  const verso = document.getElementById("resposta").value.trim();

  if (!frente || !verso) {
    document.getElementById("msg").innerText = "Preencha todos os campos!";
    return;
  }

  try {
    // Primeiro verifica se o usuário tem baralhos
    const baralhosRes = await fetch(`http://localhost:3000/baralhos/${currentUser}`);
    let baralhoId;
    
    if (!baralhosRes.ok || (await baralhosRes.json()).length === 0) {
      // Cria baralho se não existir
      const novoBaralho = await createDefaultDeck();
      baralhoId = novoBaralho.id;
    } else {
      const baralhos = await baralhosRes.json();
      baralhoId = baralhos[0].idbaralho; // Usa o primeiro baralho
    }

    // Cria o flashcard
    const res = await fetch("http://localhost:3000/flashcard", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ 
        baralho_id: baralhoId, 
        frente, 
        verso 
      })
    });

    if (res.ok) {
      document.getElementById("msg").innerText = "Flashcard criado com sucesso!";
      e.target.reset();
      loadFlashcards(); // Recarrega a lista
    } else {
      document.getElementById("msg").innerText = "Erro ao criar flashcard!";
    }
  } catch (err) {
    console.error("Erro:", err);
    document.getElementById("msg").innerText = "Erro de conexão com o servidor!";
  }
});

// ==================== LOGOUT ====================
document.getElementById("logout-btn").addEventListener("click", () => {
  localStorage.removeItem("logado");
  window.location.href = "index.html";
});

// Carrega os flashcards ao abrir a página
loadFlashcards();