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
const socio = await Socio.findOne({ socio_nr: socio_nr });
console.log("Resultado da busca por sócio:", socio); // Log para depurar a consulta

if (socio && socio.email) {
    console.log("E-mail encontrado para o sócio:", socio.email);
    try {
        await enviarEmailPagamento(socio.email, processamento);
        console.log('E-mail enviado com sucesso para', socio.email);
    } catch (emailError) {
        console.error('Erro ao enviar e-mail:', emailError.message);
        console.error('Detalhes do erro:', emailError);
    }
} else {
    if (!socio) {
        console.warn(`Nenhum sócio encontrado com socio_nr: ${socio_nr}`);
    } else if (!socio.email) {
        console.warn(`O campo de e-mail está vazio para o sócio ${socio_nr}`);
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



/*
async function enviarEmailPagamento(email, processamento) {
    // Configurar o transporte para envio real
    let transporter = nodemailer.createTransport({
        host: "mail.andrealface.com", // SMTP host fornecido
        port: 465, // Porta SMTP fornecida
        secure: true, // Utilizar TLS/SSL para conexões seguras
        auth: {
            user: "teste@andrealface.com", // Utilizador fornecido
            pass: "Teste987!12!" // Palavra-passe fornecida
        },
    });

    // Obter dados adicionais necessários
    const socio = await Socio.findOne({ socio_nr: processamento.socio_nr });
    const ssComp = await CompartSS.findOne({ ss_comp_cod: processamento.linhas[0].ss_comp_cod });

    // Configurar o e-mail
    let info = await transporter.sendMail({
        from: '"Serviços Sociais" <servicos.sociais@montemornovo.pt>',
        to: email,
        subject: "Informação de Processamento de Reembolso",
        html: `
            <p>Caro Sócio n.º ${processamento.socio_nr || '[número de sócio]'} - ${socio ? socio.name : '[nome do sócio]'},</p>
            
            <p>Serve o presente para informar que, quanto à despesa ${ssComp ? ssComp.ss_comp_nome : '[Descrição do código dos Serviços Sociais]'}, 
            no valor de ${processamento.doc_valortotal || '[valor da despesa]'}€, constante do documento n.º ${processamento.doc_nr || '[número da fatura]'} 
            e valor de ${processamento.doc_valortotal || '[valor da despesa]'}€, foi processado o reembolso de ${processamento.valor_reembolso || '[valor do reembolso dos Serviços Sociais]'}€, 
            cujo pagamento por transferência bancária se prevê para os próximos dias.</p>
            
            <p>Com os melhores cumprimentos,</p>
            <p>Os Serviços Sociais dos Trabalhadores do Município de Montemor-o-Novo</p>
        `
    });

    console.log("Email enviado: %s", info.messageId);
    console.log("URL de visualização: %s", nodemailer.getTestMessageUrl(info));

}*/

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



export default router;