// js/main.js - VERSÃO SIMPLES

const startBtn = document.getElementById("start-btn");
const loginBtn = document.getElementById("login-btn");

// Mostra modal de login
startBtn.addEventListener("click", () => {
    document.getElementById("login-modal").style.display = "flex";
});

loginBtn.addEventListener("click", () => {
    document.getElementById("login-modal").style.display = "flex";
});

// Fechar modal ao clicar fora
document.getElementById('login-modal').addEventListener('click', function(e) {
    if (e.target === this) {
        this.style.display = 'none';
    }
});

// ==================== FUNÇÃO DE CADASTRO ====================
async function registerUser() {
    const nome = document.getElementById("user-login").value.trim();
    const senha = document.getElementById("pass-login").value.trim();
    const email = nome + "@orangocards.com";

    if (!nome || !senha) {
        alert("Preencha todos os campos!");
        return;
    }

    try {
        // 1. Cria o usuário
        const res = await fetch("/usuarios", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ nome, email, senha })
        });
        
        const data = await res.json();
        
        if (res.ok) {
            // 2. Faz login automático
            const loginRes = await fetch("/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, senha })
            });
            
            const loginData = await loginRes.json();
            
            if (loginData.success) {
                //  SALVA O USUÁRIO COMPLETO
                localStorage.setItem("usuarioLogado", JSON.stringify(loginData.user));
                
                // Fecha modal e vai para flashcards
                document.getElementById("login-modal").style.display = "none";
                window.location.href = "flashcards.html";
            } else {
                alert("Conta criada! Faça login manualmente.");
            }
        } else {
            alert("Erro: " + (data.error || "Erro ao criar conta"));
        }
    } catch (err) {
        alert("Erro de conexão com o servidor!");
    }
}

// ==================== FUNÇÃO DE LOGIN ====================
async function loginUser() {
    const nome = document.getElementById("user-login").value.trim();
    const senha = document.getElementById("pass-login").value.trim();
    const email = nome + "@orangocards.com";

    if (!nome || !senha) {
        alert("Preencha todos os campos!");
        return;
    }

    try {
        const res = await fetch("/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, senha })
        });
        
        const data = await res.json();

        if (data.success) {
            //  SALVA O USUÁRIO COMPLETO
            localStorage.setItem("usuarioLogado", JSON.stringify(data.user));
            
            // Fecha modal e vai para flashcards
            document.getElementById("login-modal").style.display = "none";
            window.location.href = "flashcards.html";
        } else {
            alert("Erro: " + data.msg);
        }
    } catch (err) {
        alert("Erro de conexão com o servidor!");
    }
}