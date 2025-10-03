const startBtn = document.getElementById("start-btn");
const loginBtn = document.getElementById("login-btn");

// Mostra modal de login ao clicar "Começar" ou botão de login
startBtn.addEventListener("click", () => {
  if (localStorage.getItem("logado")) {
    window.location.href = "flashcards.html";
  } else {
    document.getElementById("login-modal").style.display = "flex";
  }
});

loginBtn.addEventListener("click", () => {
  document.getElementById("login-modal").style.display = "flex";
});

// ==================== REGISTRO ====================
async function registerUser() {
  const nome = document.getElementById("user-login").value.trim();
  const senha = document.getElementById("pass-login").value.trim();
  const email = nome + "@teste.com"; // 👈 pode trocar para pedir email real

  if (!nome || !senha) {
    document.getElementById("login-msg").innerText = "Preencha todos os campos!";
    return;
  }

  try {
    const res = await fetch("http://localhost:3000/usuarios", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nome, email, senha })
    });
    const data = await res.json();
    document.getElementById("login-msg").innerText = data.msg || "Erro!";
  } catch (err) {
    document.getElementById("login-msg").innerText = "Erro de conexão com o servidor!";
  }
}

// ==================== LOGIN ====================
async function loginUser() {
  const nome = document.getElementById("user-login").value.trim();
  const senha = document.getElementById("pass-login").value.trim();
  const email = nome + "@teste.com";

  try {
    const res = await fetch("http://localhost:3000/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, senha })
    });
    const data = await res.json();

    if (data.success) {
      localStorage.setItem("logado", data.user.idusuarios);
      window.location.href = "flashcards.html";
    } else {
      document.getElementById("login-msg").innerText = data.msg;
    }
  } catch (err) {
    document.getElementById("login-msg").innerText = "Erro ao tentar login!";
  }
}
