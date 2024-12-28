import express from 'express';
import Processamento from '../models/processamento.js';
import Pagamento from '../models/pagamento.js';
import Socio from '../models/socios.js';
import CompartSS from '../models/compartSS.js';
import nodemailer from 'nodemailer';

const router = express.Router();

// ============================================================================
// Função auxiliar para envio de email (ajustada para ter a mesma lógica do adseRoute.js)
// ============================================================================
async function enviarEmailPagamento(email, processamento) {
    console.log('=== INÍCIO ENVIO EMAIL ===');
    console.log('Email para:', email);
    console.log('Dados do processamento:', processamento);

    if (!email) {
        throw new Error('Email não fornecido');
    }

    // Transporter com as mesmas credenciais (ou variáveis de ambiente)
    // Aqui estou a colocar literal, tal como no adseRoute.js
    const transporter = nodemailer.createTransport({
        host: "mail.andrealface.com",
        port: 465,
        secure: true, // SSL/TLS
        auth: {
            user: "teste@andrealface.com",
            pass: "Teste987!12!"
        },
        tls: {
            rejectUnauthorized: false
        },
        debug: true,
        logger: true
    });

    try {
        // Verificar conexão (igual ao adseRoute.js)
        console.log('Verificando conexão SMTP...');
        await transporter.verify();
        console.log('Conexão SMTP verificada');

        // Buscar dados complementares (sócio e compartSS), tal como no adseRoute.js
        console.log('Buscando dados do sócio e compartimento...');
        const [socio, ssComp] = await Promise.all([
            Socio.findOne({ socio_nr: processamento.socio_nr }),
            CompartSS.findOne({ ss_comp_cod: processamento.linhas[0].ss_comp_cod })
        ]);

        if (!socio || !ssComp) {
            throw new Error('Dados complementares não encontrados');
        }

        // Montar o e-mail com as mesmas tags que usas no adseRoute
        const mailOptions = {
            from: '"Serviços Sociais" <teste@andrealface.com>',
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

        console.log('Enviando email...');
        const info = await transporter.sendMail(mailOptions);
        console.log('Email enviado com sucesso. ID:', info.messageId);
        console.log('=== FIM ENVIO EMAIL ===');

        return info;
    } catch (error) {
        console.error('Erro no envio do email:', error);
        throw error;
    }
}

// ============================================================================
// Criar um novo registro Processamento (POST)
// ============================================================================
router.post('/', async (req, res) => {
    try {
        console.log('Dados recebidos no backend:', req.body);

        const {
            socio_nr,
            socio_familiar,
            doc_nr,
            doc_valortotal,
            adse_codigo,
            ss_comp_cod,
            valor_unit,
            quantidade,
            tipo_processamento,
            login_usuario,
            data_doc
        } = req.body;

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
                    reembolso: 0 // Inicialmente 0
                }
            ],
            valor_reembolso: 0, // Inicialmente 0
        });

        await processamento.save();
        console.log('Novo processamento criado e salvo:', processamento);

        // Tentar enviar email se o sócio existir e tiver email
        const socio = await Socio.findOne({ socio_nr: socio_nr });
        if (socio && socio.email && typeof socio.email === 'string' && socio.email.trim() !== '') {
            try {
                await enviarEmailPagamento(socio.email.trim(), processamento);
                console.log('E-mail enviado com sucesso para', socio.email);
            } catch (emailError) {
                console.error('Erro ao enviar e-mail:', emailError);
            }
        } else {
            console.log('Email não enviado: sócio inexistente ou email inválido.');
        }

        res.status(201).send(processamento);
    } catch (error) {
        console.error('Erro ao criar processamento:', error);
        res.status(400).send(error);
    }
});

// ============================================================================
// Rota para pesquisa de processamentos
// ============================================================================
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
        console.error('Erro ao realizar a pesquisa de processamentos:', error);
        res.status(500).send({ error: 'Erro ao realizar a pesquisa de processamentos' });
    }
});

// ============================================================================
// Obter todos os registros Processamento
// ============================================================================
router.get('/', async (req, res) => {
    try {
        const processamentos = await Processamento.find();
        res.status(200).send({ processamentos });
    } catch (error) {
        res.status(500).send(error);
    }
});

// ============================================================================
// Obter um registro Processamento por ID
// ============================================================================
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

// ============================================================================
// Atualizar um registro Processamento por ID
// ============================================================================
router.patch('/:id', async (req, res) => {
    try {
        const processamento = await Processamento.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );
        if (!processamento) {
            return res.status(404).send();
        }
        res.status(200).send(processamento);
    } catch (error) {
        res.status(400).send(error);
    }
});

// ============================================================================
// Eliminar um registro Processamento por ID
// ============================================================================
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

// ============================================================================
// Marcar como pago e criar um Pagamento
// ============================================================================
router.patch('/:id/pago', async (req, res) => {
    try {
        console.log(`Iniciando processo de marcação como pago para o processamento ID: ${req.params.id}`);

        // Atualizar o processamento para marcado como pago
        const processamento = await Processamento.findByIdAndUpdate(
            req.params.id,
            { pago: true, data_pagamento: new Date() }, // Definir como pago e data
            { new: true }
        );

        if (!processamento) {
            console.error('Processamento não encontrado');
            return res.status(404).send('Processamento não encontrado');
        }

        console.log('Processamento atualizado:', processamento);

        // Criar um novo pagamento
        const novoPagamento = new Pagamento({
            pag_cod: await gerarNovoCodPagamento(),
            socio_nr: processamento.socio_nr,
            processamentos: [processamento._id],
            data_pagamento: processamento.data_pagamento,
            metodo_pagamento: 'SEPA' // Exemplo
        });

        console.log('Criando novo pagamento:', novoPagamento);

        await novoPagamento.save();
        console.log('Pagamento salvo com sucesso:', novoPagamento);

        // Enviar email (se sócio existir e tiver email)
        const socio = await Socio.findOne({ socio_nr: processamento.socio_nr });
        if (socio && socio.email && typeof socio.email === 'string' && socio.email.trim() !== '') {
            try {
                await enviarEmailPagamento(socio.email.trim(), processamento);
                console.log('E-mail enviado com sucesso para:', socio.email);
            } catch (emailError) {
                console.error('Erro ao enviar e-mail:', emailError.message);
                console.error('Detalhes do erro:', emailError);
            }
        } else {
            console.warn(`Sócio não encontrado ou sem email válido: socio_nr ${processamento.socio_nr}`);
        }

        // Retornar sucesso
        res.status(200).send({ processamento, pagamento: novoPagamento });
    } catch (error) {
        console.error('Erro ao atualizar o processamento e criar o pagamento:', error);
        res.status(500).send('Erro ao atualizar o processamento e criar o pagamento');
    }
});

// ============================================================================
// Função para gerar um novo código único de pagamento
// ============================================================================
async function gerarNovoCodPagamento() {
    const lastPagamento = await Pagamento.findOne().sort({ pag_cod: -1 });
    return lastPagamento ? lastPagamento.pag_cod + 1 : 1;
}

export default router;
