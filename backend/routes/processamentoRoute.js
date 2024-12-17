/*import express from 'express';
import Processamento from '../models/processamento.js';
import Pagamento from '../models/pagamento.js';
import Socio from '../models/socios.js';
import CompartSS from '../models/compartSS.js';
import nodemailer from 'nodemailer';

const router = express.Router();

// Criar um novo registro Processamento
router.post('/', async (req, res) => {
    try {
        console.log('Dados recebidos no backend:', req.body); // Verifica o conteúdo completo de req.body

        const { socio_nr, socio_familiar, doc_nr, doc_valortotal, adse_codigo, ss_comp_cod, valor_unit, quantidade, tipo_processamento, login_usuario, data_doc } = req.body;

        console.log('Tipo de processamento recebido:', tipo_processamento); // Verifica se o campo está corretamente populado

        const processamento = new Processamento({
            socio_nr,
            socio_familiar,
            doc_nr,
            doc_valortotal,
            data_doc, // Gravar a data do documento
            tipo_processamento, // Gravar o tipo de processamento
            login_usuario, // Gravar o login do usuário
            linhas: [
                {
                    adse_codigo,
                    ss_comp_cod,
                    valor_unit,
                    quantidade,
                    reembolso: 0 // Inicialmente, o reembolso pode ser calculado mais tarde
                }
            ],
            valor_reembolso: 0, // Inicialmente definido como 0
        });

        await processamento.save();

        // Adicionar estas linhas após salvar o processamento
        console.log("Procurando sócio pelo número:", socio_nr);
        const socio = await Socio.findOne({ socio_nr: socio_nr });
        console.log("Resultado da busca por sócio:", socio); // Log para depurar a consulta
        console.log("Valor bruto do email:", socio.email, "Tipo:", typeof socio.email); // Log para depurar o valor do email


        if (socio && typeof socio.email === 'string' && socio.email.trim() !== '') {
            const emailLimpo = socio.email.trim();
            console.log("E-mail encontrado para o sócio (limpo):", emailLimpo);
            try {
                await enviarEmailPagamento(emailLimpo, processamento);
                console.log('E-mail enviado com sucesso para', emailLimpo);
            } catch (emailError) {
                console.error('Erro ao enviar e-mail:', emailError.message);
                console.error('Detalhes do erro:', emailError);
            }
        } else {
            if (!socio) {
                console.warn(`Nenhum sócio encontrado com socio_nr: ${socio_nr}`);
            } else if (!socio.email || typeof socio.email !== 'string') {
                console.warn(`O campo de e-mail está inválido para o sócio ${socio_nr}:`, socio.email);
            }
        }

        res.status(201).send(processamento);
    } catch (error) {
        console.error('Erro ao criar processamento:', error);
        res.status(400).send(error);
    }
});





// rota para pesquisa de processamentos
router.get('/pesquisa', async (req, res) => {
    try {
        const { proc_cod, data_inicio, data_fim, socio_nr, tipo_processamento } = req.query;

        const filtro = {};

        if (proc_cod) {
            filtro.proc_cod = proc_cod; // Pesquisa por número de processamento
        }

        if (data_inicio && data_fim) {
            const startOfDay = new Date(data_inicio);
            startOfDay.setUTCHours(0, 0, 0, 0); // Começo do dia
        
            const endOfDay = new Date(data_fim);
            endOfDay.setUTCHours(23, 59, 59, 999); // Fim do dia
        
            filtro.createdAt = {
                $gte: startOfDay,  // >= para incluir o início do dia
                $lte: endOfDay     // <= para incluir o final do dia
            };
        }

        if (socio_nr) {
            filtro.socio_nr = socio_nr; // Pesquisa por número de sócio
        }

        if (tipo_processamento) {
            filtro.tipo_processamento = tipo_processamento; // Aplicar o filtro de tipo de processamento
        }

        const processamentos = await Processamento.find(filtro);
        res.status(200).send({ processamentos });
    } catch (error) {
        res.status(500).send({ error: 'Erro ao realizar a pesquisa de processamentos' });
    }
});


// Obter todos os registros Processamento
router.get('/', async (req, res) => {
    try {
        const processamentos = await Processamento.find();
        res.status(200).send({ processamentos });
    } catch (error) {
        res.status(500).send(error);
    }
});

// Obter um registro Processamento por ID
router.get('/:id', async (req, res) => {
    try {
        const processamento = await Processamento.findById(req.params.id);
        if (!processamento) {
            return res.status(404).send();
        }
        res.status(200).send(processamento);
    } catch (error) {
        res.status(500).send(error);
    }
});

// Atualizar um registro Processamento por ID
router.patch('/:id', async (req, res) => {
    try {
        const processamento = await Processamento.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true
        });
        if (!processamento) {
            return res.status(404).send();
        }
        res.status(200).send(processamento);
    } catch (error) {
        res.status(400).send(error);
    }
});

// Eliminar um registro Processamento por ID
router.delete('/:id', async (req, res) => {
    try {
        const processamento = await Processamento.findByIdAndDelete(req.params.id);
        if (!processamento) {
            return res.status(404).send();
        }
        res.status(200).send(processamento);
    } catch (error) {
        res.status(500).send(error);
    }
});


router.patch('/:id/pago', async (req, res) => {
    try {
        console.log(`Iniciando processo de marcação como pago para o processamento ID: ${req.params.id}`);

        // Atualizar o processamento para marcado como pago
        const processamento = await Processamento.findByIdAndUpdate(
            req.params.id,
            { pago: true, data_pagamento: new Date() }, // Definir como pago e registrar a data do pagamento
            { new: true }
        );

        if (!processamento) {
            console.error('Processamento não encontrado');
            return res.status(404).send('Processamento não encontrado');
        }

        console.log('Processamento atualizado:', processamento);

        // Criar um novo pagamento associado ao processamento marcado como pago
        const novoPagamento = new Pagamento({
            pag_cod: await gerarNovoCodPagamento(), // Função que gera um novo código único para o pagamento
            socio_nr: processamento.socio_nr, // Associar ao sócio
            processamentos: [processamento._id], // Associar o ID do processamento
            data_pagamento: processamento.data_pagamento, // Usar a data de pagamento do processamento
            metodo_pagamento: 'SEPA' // Exemplo, pode ser ajustado conforme o método de pagamento usado
        });

        console.log('Criando novo pagamento:', novoPagamento);

        // Salvar o novo pagamento na base de dados
        await novoPagamento.save();

        console.log('Pagamento salvo com sucesso:', novoPagamento);

        // Retornar sucesso com o processamento atualizado e o pagamento criado
        res.status(200).send({ processamento, pagamento: novoPagamento });
    } catch (error) {
        console.error('Erro ao atualizar o processamento e criar o pagamento:', error);
        res.status(500).send('Erro ao atualizar o processamento e criar o pagamento');
    }
});


// Função para gerar um novo código único de pagamento
async function gerarNovoCodPagamento() {
    const lastPagamento = await Pagamento.findOne().sort({ pag_cod: -1 });
    return lastPagamento ? lastPagamento.pag_cod + 1 : 1; // Se houver registros, incrementa o último código, caso contrário começa de 1
}


async function enviarEmailPagamento(email, processamento) {
    console.log("Iniciando envio de email...");
    console.log("Email para:", email);

    // Configurar o transporte para envio real
    let transporter = nodemailer.createTransport({
        host: "mail.andrealface.com", // SMTP host fornecido
        port: 465, // Porta SMTP fornecida
        secure: true, // Utilizar TLS/SSL para conexões seguras
        auth: {
            user: "teste@andrealface.com", // Utilizador fornecido
            pass: "Teste987!12!" // Palavra-passe fornecida
        },
        tls: {
            rejectUnauthorized: false // Ignora a validação do certificado SSL
        }
    });

    try {
        // Testar conexão com o servidor SMTP
        console.log("Testando conexão com o servidor SMTP...");
        await transporter.verify();
        console.log("Conexão com o servidor SMTP estabelecida com sucesso!");

        // Obter dados adicionais necessários
        const socio = await Socio.findOne({ socio_nr: processamento.socio_nr });
        if (!socio) {
            throw new Error(`Sócio não encontrado na BD para socio_nr: ${processamento.socio_nr}`);
        }

        const ssComp = await CompartSS.findOne({ ss_comp_cod: processamento.linhas[0].ss_comp_cod });
        if (!ssComp) {
            throw new Error(`Serviço Social não encontrado na BD para ss_comp_cod: ${processamento.linhas[0].ss_comp_cod}`);
        }

        console.log("Dados do sócio:", socio);
        console.log("Dados do serviço social:", ssComp);

        // Configurar e enviar o e-mail
        let info = await transporter.sendMail({
            from: '"Serviços Sociais" <servicos.sociais@montemornovo.pt>',
            to: email,
            subject: "Informação de Processamento de Reembolso",
            html: `
                <p>Caro Sócio n.º ${processamento.socio_nr || '[número de sócio]'} - ${socio.name || '[nome do sócio]'},</p>
                
                <p>Serve o presente para informar que, quanto à despesa ${ssComp.ss_comp_nome || '[Descrição do código dos Serviços Sociais]'}, 
                no valor de ${processamento.doc_valortotal || '[valor da despesa]'}€, constante do documento n.º ${processamento.doc_nr || '[número da fatura]'}, 
                foi processado o reembolso de ${processamento.valor_reembolso || '[valor do reembolso dos Serviços Sociais]'}€, 
                cujo pagamento por transferência bancária se prevê para os próximos dias.</p>
                
                <p>Com os melhores cumprimentos,</p>
                <p>Os Serviços Sociais dos Trabalhadores do Município de Montemor-o-Novo</p>
            `
        });

        console.log("Email enviado com sucesso: %s", info.messageId);
    } catch (error) {
        console.error("Erro ao enviar email:", error.message);

        // Tratamento de erros específicos
        if (error.message.includes("Sócio não encontrado")) {
            console.error("Verifica se o sócio existe na base de dados.");
        } else if (error.message.includes("Serviço Social não encontrado")) {
            console.error("Verifica se o código dos Serviços Sociais é válido.");
        } else if (error.response) {
            console.error("Resposta do servidor SMTP:", error.response);
        } else {
            console.error("Erro inesperado ao enviar email:", error);
        }
    }
}



export default router;*/

import express from 'express';
import Processamento from '../models/processamento.js';
import Pagamento from '../models/pagamento.js';
import Socio from '../models/socios.js';
import CompartSS from '../models/compartSS.js';
import nodemailer from 'nodemailer';

const router = express.Router();

// Criar um novo registro Processamento
router.post('/', async (req, res) => {
    try {
        console.log('Iniciando criação de novo processamento');
        console.log('Dados recebidos no backend:', req.body);

        const { socio_nr, socio_familiar, doc_nr, doc_valortotal, adse_codigo, ss_comp_cod, valor_unit, quantidade, tipo_processamento, login_usuario, data_doc } = req.body;

        console.log('Tipo de processamento recebido:', tipo_processamento);

        const processamento = new Processamento({
            socio_nr,
            socio_familiar,
            doc_nr,
            doc_valortotal,
            data_doc,
            tipo_processamento,
            login_usuario,
            linhas: [
                {
                    adse_codigo,
                    ss_comp_cod,
                    valor_unit,
                    quantidade,
                    reembolso: 0
                }
            ],
            valor_reembolso: 0,
        });

        // Salvar o processamento primeiro
        const savedProcessamento = await processamento.save();
        console.log("Processamento salvo com sucesso:", savedProcessamento);

        // Buscar o sócio e seus dados
        console.log("Buscando sócio com número:", socio_nr);
        const socio = await Socio.findOne({ socio_nr: socio_nr });
        console.log("Dados do sócio encontrado:", socio);

        // Verificar se o sócio existe e tem email válido
        if (socio && socio.email && typeof socio.email === 'string' && socio.email.trim() !== '') {
            const emailLimpo = socio.email.trim();
            console.log("Email válido encontrado:", emailLimpo);

            try {
                console.log("Iniciando processo de envio de email");
                await enviarEmailPagamento(emailLimpo, savedProcessamento);
                console.log("Email enviado com sucesso para:", emailLimpo);
            } catch (emailError) {
                console.error("Erro no envio do email:", emailError);
                // Log do erro mas continua a execução
            }
        } else {
            console.warn("Email não enviado:", !socio ? "Sócio não encontrado" : "Email inválido ou ausente");
        }

        res.status(201).send(savedProcessamento);
    } catch (error) {
        console.error('Erro ao criar processamento:', error);
        res.status(400).send(error);
    }
});

// Função para enviar email
async function enviarEmailPagamento(email, processamento) {
    if (!email) {
        throw new Error('Email não fornecido');
    }

    console.log("Iniciando configuração do transport para email:", email);
    
    const transporter = nodemailer.createTransport({
        host: "mail.andrealface.com",
        port: 465,
        secure: true,
        auth: {
            user: "teste@andrealface.com",
            pass: "Teste987!12!"
        },
        tls: {
            rejectUnauthorized: false
        },
        debug: true,
        logger: true // Habilita logging detalhado
    });

    try {
        // Verificar conexão
        console.log("Verificando conexão SMTP...");
        await transporter.verify();
        console.log("Conexão SMTP verificada com sucesso");

        // Buscar dados necessários de forma paralela
        console.log("Buscando dados complementares...");
        const [socio, ssComp] = await Promise.all([
            Socio.findOne({ socio_nr: processamento.socio_nr }),
            CompartSS.findOne({ ss_comp_cod: processamento.linhas[0].ss_comp_cod })
        ]);

        if (!socio) throw new Error(`Sócio não encontrado: ${processamento.socio_nr}`);
        if (!ssComp) throw new Error(`Compartimento SS não encontrado: ${processamento.linhas[0].ss_comp_cod}`);

        console.log("Dados complementares encontrados:", { socio: socio._id, ssComp: ssComp.ss_comp_cod });

        // Preparar e enviar o email
        const mailOptions = {
            from: '"Serviços Sociais" <servicos.sociais@montemornovo.pt>',
            to: email,
            subject: "Informação de Processamento de Reembolso",
            html: `
                <p>Caro Sócio n.º ${processamento.socio_nr} - ${socio.name},</p>
                
                <p>Serve o presente para informar que, quanto à despesa ${ssComp.ss_comp_nome}, 
                no valor de ${processamento.doc_valortotal}€, constante do documento n.º ${processamento.doc_nr}, 
                foi processado o reembolso de ${processamento.valor_reembolso}€, 
                cujo pagamento por transferência bancária se prevê para os próximos dias.</p>
                
                <p>Com os melhores cumprimentos,</p>
                <p>Os Serviços Sociais dos Trabalhadores do Município de Montemor-o-Novo</p>
            `
        };

        console.log("Enviando email com as opções:", { to: mailOptions.to, subject: mailOptions.subject });
        const info = await transporter.sendMail(mailOptions);
        console.log("Email enviado com sucesso. ID:", info.messageId);
        
        return info;
    } catch (error) {
        console.error("Erro durante o processo de envio de email:", error);
        throw error; // Re-throw para tratamento adequado no caller
    }
}

// Rota de teste de email
router.post('/teste-email', async (req, res) => {
    try {
        console.log("Iniciando teste de envio de email");
        const resultado = await enviarEmailPagamento(
            "theprodigy83@gmail.com", // Email de teste
            {
                socio_nr: "1",
                doc_nr: "TESTE-001",
                doc_valortotal: 100,
                valor_reembolso: 50,
                linhas: [{ ss_comp_cod: "0101" }]
            }
        );
        console.log("Teste de email concluído com sucesso");
        res.json({ success: true, messageId: resultado.messageId });
    } catch (error) {
        console.error("Erro no teste de email:", error);
        res.status(500).json({ error: error.message });
    }
});

// [Resto do código existente permanece igual...]
router.get('/pesquisa', async (req, res) => {
    try {
        const { proc_cod, data_inicio, data_fim, socio_nr, tipo_processamento } = req.query;

        const filtro = {};

        if (proc_cod) {
            filtro.proc_cod = proc_cod;
        }

        if (data_inicio && data_fim) {
            const startOfDay = new Date(data_inicio);
            startOfDay.setUTCHours(0, 0, 0, 0);
        
            const endOfDay = new Date(data_fim);
            endOfDay.setUTCHours(23, 59, 59, 999);
        
            filtro.createdAt = {
                $gte: startOfDay,
                $lte: endOfDay
            };
        }

        if (socio_nr) {
            filtro.socio_nr = socio_nr;
        }

        if (tipo_processamento) {
            filtro.tipo_processamento = tipo_processamento;
        }

        const processamentos = await Processamento.find(filtro);
        res.status(200).send({ processamentos });
    } catch (error) {
        res.status(500).send({ error: 'Erro ao realizar a pesquisa de processamentos' });
    }
});

router.get('/', async (req, res) => {
    try {
        const processamentos = await Processamento.find();
        res.status(200).send({ processamentos });
    } catch (error) {
        res.status(500).send(error);
    }
});

router.get('/:id', async (req, res) => {
    try {
        const processamento = await Processamento.findById(req.params.id);
        if (!processamento) {
            return res.status(404).send();
        }
        res.status(200).send(processamento);
    } catch (error) {
        res.status(500).send(error);
    }
});

router.patch('/:id', async (req, res) => {
    try {
        const processamento = await Processamento.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true
        });
        if (!processamento) {
            return res.status(404).send();
        }
        res.status(200).send(processamento);
    } catch (error) {
        res.status(400).send(error);
    }
});

router.delete('/:id', async (req, res) => {
    try {
        const processamento = await Processamento.findByIdAndDelete(req.params.id);
        if (!processamento) {
            return res.status(404).send();
        }
        res.status(200).send(processamento);
    } catch (error) {
        res.status(500).send(error);
    }
});

router.patch('/:id/pago', async (req, res) => {
    try {
        console.log(`Iniciando processo de marcação como pago para o processamento ID: ${req.params.id}`);

        const processamento = await Processamento.findByIdAndUpdate(
            req.params.id,
            { pago: true, data_pagamento: new Date() },
            { new: true }
        );

        if (!processamento) {
            console.error('Processamento não encontrado');
            return res.status(404).send('Processamento não encontrado');
        }

        console.log('Processamento atualizado:', processamento);

        const novoPagamento = new Pagamento({
            pag_cod: await gerarNovoCodPagamento(),
            socio_nr: processamento.socio_nr,
            processamentos: [processamento._id],
            data_pagamento: processamento.data_pagamento,
            metodo_pagamento: 'SEPA'
        });

        console.log('Criando novo pagamento:', novoPagamento);

        await novoPagamento.save();

        console.log('Pagamento salvo com sucesso:', novoPagamento);

        res.status(200).send({ processamento, pagamento: novoPagamento });
    } catch (error) {
        console.error('Erro ao atualizar o processamento e criar o pagamento:', error);
        res.status(500).send('Erro ao atualizar o processamento e criar o pagamento');
    }
});

async function gerarNovoCodPagamento() {
    const lastPagamento = await Pagamento.findOne().sort({ pag_cod: -1 });
    return lastPagamento ? lastPagamento.pag_cod + 1 : 1;
}

export default router;
