const express = require("express");
const mysql = require("mysql2");
const cors = require("cors");
const bodyParser = require("body-parser");
const path = require("path");

const app = express();
app.use(cors());
app.use(bodyParser.json());

// 🔹 SERVIR ARQUIVOS ESTÁTICOS CORRETAMENTE
app.use(express.static(__dirname)); // Serve todos os arquivos da pasta raiz

// 🔹 ROTAS PARA AS PÁGINAS HTML
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

app.get("/flashcards.html", (req, res) => {
  res.sendFile(path.join(__dirname, "flashcards.html"));
});

// 🔹 Configuração da conexão MySQL
const dbConfig = {
  host: "localhost",
  user: "root",
  password: "Pedro2109",
  database: "orangobd"
};

let db;

// 🔹 Função para conectar e inicializar o banco
function connectAndInitializeDB() {
  const connection = mysql.createConnection({
    host: dbConfig.host,
    user: dbConfig.user,
    password: dbConfig.password,
    multipleStatements: true
  });

  connection.connect(err => {
    if (err) {
      console.error("❌ Erro ao conectar no MySQL:", err);
      setTimeout(connectAndInitializeDB, 2000);
      return;
    }

    console.log("✅ Conectado ao MySQL");

    connection.query(`CREATE DATABASE IF NOT EXISTS ${dbConfig.database}`, (err) => {
      if (err) {
        console.error("❌ Erro ao criar banco:", err);
        return;
      }

      console.log(`✅ Banco '${dbConfig.database}' verificado/criado`);

      connection.changeUser({ database: dbConfig.database }, (err) => {
        if (err) {
          console.error("❌ Erro ao conectar ao banco:", err);
          return;
        }

        console.log(`✅ Conectado ao banco '${dbConfig.database}'`);
        db = connection;
        checkAndCreateTables();
      });
    });
  });

  connection.on('error', (err) => {
    console.error('❌ Erro de conexão MySQL:', err);
    if (err.code === 'PROTOCOL_CONNECTION_LOST') {
      connectAndInitializeDB();
    }
  });
}

// 🔹 Função para verificar e criar tabelas
function checkAndCreateTables() {
  const createTablesSQL = `
    CREATE TABLE IF NOT EXISTS usuarios (
      idusuarios int NOT NULL AUTO_INCREMENT,
      nome varchar(45) NOT NULL,
      email varchar(45) NOT NULL,
      senha varchar(45) NOT NULL,
      data_criacao timestamp NULL DEFAULT CURRENT_TIMESTAMP,
      salt varbinary(16) DEFAULT NULL,
      ativacao tinyint(1) DEFAULT '1',
      tentativas_falhas int DEFAULT '0',
      ultimo_login_falha timestamp NULL DEFAULT NULL,
      bloqueado_ate timestamp NULL DEFAULT NULL,
      PRIMARY KEY (idusuarios),
      UNIQUE KEY email_UNIQUE (email)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

    CREATE TABLE IF NOT EXISTS baralho (
      idbaralho int NOT NULL AUTO_INCREMENT,
      titulo varchar(100) NOT NULL,
      descricao text NOT NULL,
      data_criacao timestamp NULL DEFAULT CURRENT_TIMESTAMP,
      usuario_id int NOT NULL,
      PRIMARY KEY (idbaralho),
      KEY usuario_id (usuario_id),
      CONSTRAINT usuario_id FOREIGN KEY (usuario_id) REFERENCES usuarios (idusuarios) ON DELETE CASCADE ON UPDATE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

    CREATE TABLE IF NOT EXISTS flashcards (
      idflashcards int NOT NULL AUTO_INCREMENT,
      baralho_id int NOT NULL,
      frente text NOT NULL,
      verso text NOT NULL,
      data_criacao timestamp NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (idflashcards),
      KEY baralho_id (baralho_id),
      CONSTRAINT baralho_id FOREIGN KEY (baralho_id) REFERENCES baralho (idbaralho) ON DELETE CASCADE ON UPDATE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
  `;

  db.query(createTablesSQL, (err) => {
    if (err) {
      console.error("❌ Erro ao criar tabelas:", err);
    } else {
      console.log("✅ Tabelas verificadas/criadas com sucesso!");
    }
  });
}

// ================= ROTAS DA API =================

// 🔹 Criar usuário
app.post("/usuarios", (req, res) => {
  const { nome, email, senha } = req.body;
  db.query(
    "INSERT INTO usuarios (nome, email, senha) VALUES (?, ?, ?)",
    [nome, email, senha],
    (err, result) => {
      if (err) {
        if (err.code === 'ER_DUP_ENTRY') {
          return res.status(400).json({ error: "Email já cadastrado!" });
        }
        return res.status(500).json({ error: err.message });
      }
      res.json({ msg: "Usuário cadastrado!", id: result.insertId });
    }
  );
});

// 🔹 Login
app.post("/login", (req, res) => {
  const { email, senha } = req.body;
  
  db.query(
    "SELECT * FROM usuarios WHERE email = ? AND senha = ?",
    [email, senha],
    (err, results) => {
      if (err) return res.status(500).json({ error: err.message });
      
      if (results.length > 0) {
        res.json({ 
          success: true, 
          user: results[0],
          msg: "Login realizado com sucesso!"
        });
      } else {
        res.json({ 
          success: false, 
          msg: "Email ou senha incorretos!" 
        });
      }
    }
  );
});

// 🔹 Criar baralho
app.post("/baralho", (req, res) => {
  const { titulo, descricao, usuario_id } = req.body;
  
  db.query(
    "INSERT INTO baralho (titulo, descricao, usuario_id) VALUES (?, ?, ?)",
    [titulo, descricao, usuario_id],
    (err, result) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ msg: "Baralho criado!", id: result.insertId });
    }
  );
});

// 🔹 Criar flashcard
app.post("/flashcard", (req, res) => {
  const { baralho_id, frente, verso } = req.body;
  
  db.query(
    "INSERT INTO flashcards (baralho_id, frente, verso) VALUES (?, ?, ?)",
    [baralho_id, frente, verso],
    (err, result) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ msg: "Flashcard criado!", id: result.insertId });
    }
  );
});

// 🔹 Buscar flashcards por usuário
app.get("/flashcards/:usuario_id", (req, res) => {
  const usuario_id = req.params.usuario_id;
  
  db.query(
    `SELECT f.* FROM flashcards f 
     INNER JOIN baralho b ON f.baralho_id = b.idbaralho 
     WHERE b.usuario_id = ?`,
    [usuario_id],
    (err, results) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(results);
    }
  );
});

// 🔹 Buscar baralhos por usuário
app.get("/baralhos/:usuario_id", (req, res) => {
  const usuario_id = req.params.usuario_id;
  
  db.query(
    "SELECT * FROM baralho WHERE usuario_id = ?",
    [usuario_id],
    (err, results) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(results);
    }
  );
});

// ================= INICIALIZAÇÃO =================
connectAndInitializeDB();

const PORT = 3000;
app.listen(PORT, () => console.log(`🚀 Servidor rodando em http://localhost:${PORT}`));