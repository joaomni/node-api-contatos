import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import { createClient } from '@libsql/client';
import cors from 'cors';

const app = express()
const PORT = process.env.PORT || 3000
// Middleware para permitir JSON no corpo das requisições e CORS
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(cors())
// Conectar ao Turso
const db = createClient({
	url: process.env.TURSO_DATABASE_URL,
	authToken: process.env.TURSO_AUTH_TOKEN
})
// Criar tabela se não existir
;(async () => {
	try {
		await db.execute(
			`CREATE TABLE IF NOT EXISTS contatos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nome TEXT NOT NULL,
        email TEXT NOT NULL,
        celular TEXT NOT NULL,
        setor TEXT NOT NULL,
        mensagem TEXT NOT NULL,
        arquivo TEXT,
        data_envio TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )`
		)
		console.log("Tabela 'contatos' verificada/criada!")
	} catch (error) {
		console.error('Erro ao criar tabela:', error)
	}
})()
// Criar tabela formulario_cast se não existir
await db.execute(`
  CREATE TABLE IF NOT EXISTS formulario_cast (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nome TEXT,
    email TEXT,
    telefone TEXT,
    como_conheceu TEXT,
    local_obra TEXT,
    tipo_imovel TEXT,
    tamanho_imovel TEXT,
    ambientes TEXT,
    faixa_investimento TEXT,
    tem_arquiteto TEXT,
    tem_experiencia TEXT,
    preferencias TEXT,
    previsao_fechamento TEXT,
    outras_lojas TEXT,
    estilo_decoracao TEXT,
    receber_ofertas TEXT,
    informacoes_adicionais TEXT,
    ambiente_favorito TEXT,
    forma_pagamento TEXT,
    eletros_existentes TEXT,
    granitos_instalados TEXT,
    planta_imovel TEXT,
    referencias TEXT,
    data_envio TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )
`)
app.post('/formulario-cast', async (req, res) => {
	const {
		nome,
		email,
		telefone,
		como_conheceu,
		local_obra,
		tipo_imovel,
		tamanho_imovel,
		ambientes,
		faixa_investimento,
		tem_arquiteto,
		tem_experiencia,
		preferencias,
		previsao_fechamento,
		outras_lojas,
		estilo_decoracao,
		receber_ofertas,
		informacoes_adicionais,
		ambiente_favorito,
		forma_pagamento,
		eletros_existentes,
		granitos_instalados,
		planta_imovel,
		referencias
	} = req.body

	try {
		await db.execute({
			sql: `
        INSERT INTO formulario_cast (
          nome, email, telefone, como_conheceu, local_obra, tipo_imovel,
          tamanho_imovel, ambientes, faixa_investimento, tem_arquiteto, tem_experiencia,
          preferencias, previsao_fechamento, outras_lojas, estilo_decoracao,
          receber_ofertas, informacoes_adicionais, ambiente_favorito,
          forma_pagamento, eletros_existentes, granitos_instalados,
          planta_imovel, referencias
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
			args: [
				nome || '',
				email || '',
				telefone || '',
				como_conheceu || '',
				local_obra || '',
				tipo_imovel || '',
				tamanho_imovel || '',
				JSON.stringify(ambientes || []),
				faixa_investimento || '',
				tem_arquiteto || '',
				tem_experiencia || '',
				preferencias || '',
				previsao_fechamento || '',
				outras_lojas || '',
				estilo_decoracao || '',
				receber_ofertas || '',
				informacoes_adicionais || '',
				ambiente_favorito || '',
				forma_pagamento || '',
				eletros_existentes || '',
				granitos_instalados || '',
				JSON.stringify(planta_imovel || []),
				JSON.stringify(referencias || [])
			]
		})

		res.json({ success: true, message: 'Formulário salvo com sucesso!' })
	} catch (error) {
		console.error('Erro ao salvar formulario_cast:', error)
		res.status(500).json({ error: 'Erro ao salvar formulário' })
	}
})
app.get('/formulario-cast', async (req, res) => {
	try {
		const result = await db.execute('SELECT * FROM formulario_cast ORDER BY data_envio DESC')
		// Parse campos JSON
		const rows = result.rows.map((row) => ({
			...row,
			ambientes: JSON.parse(row.ambientes || '[]'),
			planta_imovel: JSON.parse(row.planta_imovel || '[]'),
			referencias: JSON.parse(row.referencias || '[]')
		}))

		res.json(rows)
	} catch (error) {
		console.error('Erro ao buscar formulário:', error)
		res.status(500).json({ error: 'Erro ao buscar dados' })
	}
})
app.delete('/formulario-cast/:id', async (req, res) => {
	const { id } = req.params

	try {
		const result = await db.execute('DELETE FROM formulario_cast WHERE id = ?', [id])
		if (result.rowsAffected === 0) {
			return res.status(404).json({ message: 'Registro não encontrado' })
		}

		res.json({ message: 'Formulário deletado com sucesso' })
	} catch (error) {
		console.error('Erro ao deletar:', error)
		res.status(500).json({ error: 'Erro ao deletar registro' })
	}
})
// Rota para salvar os dados do formulário
app.post('/contatos', async (req, res) => {
	const { nome, email, celular, setor, mensagem, arquivo } = req.body
	if (!nome || !email || !celular || !setor || !mensagem || !arquivo) {
		return res.status(400).json({ error: 'Preencha todos os campos!' })
	}

	const query = `
  INSERT INTO contatos (nome, email, celular, setor, mensagem, arquivo) 
  VALUES (?, ?, ?, ?, ?, ?)
`

	try {
		const result = await db.execute({
			sql: query,
			args: [nome, email, celular, setor, mensagem, arquivo]
		})

		// Convertendo BigInt para Number
		const insertedId = Number(result.lastInsertRowid)

		res.json({ success: true, id: insertedId })
	} catch (err) {
		console.error('Erro ao salvar no banco:', err.message)
		res.status(500).json({ error: 'Erro ao salvar no banco!' })
	}
})
// Rota para listar os contatos salvos
app.get('/contatos', async (req, res) => {
	try {
		const result = await db.execute('SELECT * FROM contatos ORDER BY data_envio DESC')
		res.json(result.rows)
	} catch (error) {
		res.status(500).json({ error: 'Erro ao buscar os contatos!' })
	}
})
// Rota para deletar um contato pelo ID
app.delete('/contatos/:id', async (req, res) => {
	const { id } = req.params

	try {
		const result = await db.execute('DELETE FROM contatos WHERE id = ?', [id])
		if (result.rowsAffected === 0) {
			return res.status(404).json({ message: 'Contato não encontrado' })
		}
		res.json({ message: 'Contato deletado com sucesso' })
	} catch (error) {
		res.status(500).json({ error: 'Erro ao deletar contato' })
	}
})
// Iniciar o servidor
app.listen(PORT, () => {
	console.log(`Servidor rodando em http://localhost:${PORT}`)
})
