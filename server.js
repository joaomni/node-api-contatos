require("dotenv").config();
const express = require("express");
const { createClient } = require("@libsql/client");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware para permitir JSON no corpo das requisições e CORS
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());

// Conectar ao Turso
const db = createClient({
  url: process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

// Criar tabela se não existir
(async () => {
  try {
    await db.execute(
      `CREATE TABLE IF NOT EXISTS contatos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nome TEXT NOT NULL,
        email TEXT NOT NULL,
        celular TEXT NOT NULL,
        setor TEXT NOT NULL,
        mensagem TEXT NOT NULL,
        data_envio TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )`
    );
    console.log("Tabela 'contatos' verificada/criada!");
  } catch (error) {
    console.error("Erro ao criar tabela:", error);
  }
})();

// Rota para salvar os dados do formulário
app.post("/contatos", async (req, res) => {
  const { nome, email, celular, setor, mensagem } = req.body;
  if (!nome || !email || !celular || !setor || !mensagem) {
    return res.status(400).json({ error: "Preencha todos os campos!" });
  }

  const query = `
  INSERT INTO contatos (nome, email, celular, setor, mensagem) 
  VALUES (?, ?, ?, ?, ?)
`;

  try {
    const result = await db.execute({
      sql: query,
      args: [nome, email, celular, setor, mensagem],
    });

    // Convertendo BigInt para Number
    const insertedId = Number(result.lastInsertRowid);

    res.json({ success: true, id: insertedId });
  } catch (err) {
    console.error("Erro ao salvar no banco:", err.message);
    res.status(500).json({ error: "Erro ao salvar no banco!" });
  }
});

// Rota para listar os contatos salvos
app.get("/contatos", async (req, res) => {
  try {
    const result = await db.execute(
      "SELECT * FROM contatos ORDER BY data_envio DESC"
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: "Erro ao buscar os contatos!" });
  }
});

// Rota para deletar um contato pelo ID
app.delete("/contatos/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const result = await db.execute("DELETE FROM contatos WHERE id = ?", [id]);
    if (result.rowsAffected === 0) {
      return res.status(404).json({ message: "Contato não encontrado" });
    }
    res.json({ message: "Contato deletado com sucesso" });
  } catch (error) {
    res.status(500).json({ error: "Erro ao deletar contato" });
  }
});

// Iniciar o servidor
app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});
