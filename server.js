require("dotenv").config();
const express = require("express");
const sqlite3 = require("sqlite3").verbose();
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware para permitir JSON no corpo das requisições e CORS
app.use(express.json());
app.use(express.urlencoded({ extended: true })); // Trata caracteres especiais
app.use(cors());

// Conectar ao SQLite (cria o banco se não existir)
const db = new sqlite3.Database("./database.sqlite", (err) => {
    if (err) {
        console.error("Erro ao conectar ao banco de dados:", err.message);
    } else {
        console.log("Conectado ao SQLite!");
        db.run(`CREATE TABLE IF NOT EXISTS contatos (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            nome TEXT NOT NULL,
            email TEXT NOT NULL,
            celular TEXT NOT NULL,
            setor TEXT NOT NULL,
            mensagem TEXT NOT NULL,
            data_envio TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )`);
    }
});

// Rota para salvar os dados do formulário
app.post("/contatos", (req, res) => {
    const { nome, email, celular, setor, mensagem } = req.body;
    if (!nome || !email || !celular || !setor || !mensagem) {
        return res.status(400).json({ error: "Preencha todos os campos!" });
    }

    const stmt = db.prepare("INSERT INTO contatos (nome, email, celular, setor, mensagem) VALUES (?, ?, ?, ?, ?)");
    stmt.run(nome, email, celular, setor, mensagem, function (err) {
        if (err) {
            return res.status(500).json({ error: "Erro ao salvar no banco!" });
        }
        res.json({ success: true, id: this.lastID });
    });
    stmt.finalize();
});

// Rota para listar os contatos salvos
app.get("/contatos", (req, res) => {
    db.all("SELECT * FROM contatos ORDER BY data_envio DESC", (err, rows) => {
        if (err) {
            return res.status(500).json({ error: "Erro ao buscar os contatos!" });
        }
        res.json(rows);
    });
});

// Iniciar o servidor
app.listen(PORT, () => {
    console.log(`Servidor rodando em http://localhost:${PORT}`);
});
