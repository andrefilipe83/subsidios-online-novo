import express from 'express';
import Processamento from '../models/processamento.js';
import Pagamento from '../models/pagamento.js';
import Socio from '../models/socios.js';
import CompartSS from '../models/compartSS.js';
import nodemailer from 'nodemailer';

const router = express.Router();

// Função para enviar email
async function enviarEmailPagamento(email, processamento) {
    let transporter = nodemailer.createTransport({
        host: "mail.andrealface.com",
        port: 465,
        secure: true, // SSL/TLS
        auth: {
            user: "teste@andrealface.com",
            pass: "Teste987!12!"
        },
        tls: {
            rejectUnauthorized: false // Ignora problemas de SSL
        }
    });

    try {
        const socio = await Socio.findOne({ socio_nr: processamento.socio_nr });
        const ssComp = await CompartSS.findOne({ ss_comp_cod: processamento.linhas[0].ss_comp_cod });

        let info = await transporter.sendMail({
            from: '"Serviços Sociais" <servicos.sociais@montemornovo.pt>',
            to: email,
            subject: "Informação de Processamento de Reembolso",
            html: `
                <p>Caro Sócio n.º ${processamento.socio_nr || '[número de sócio]'} - ${socio ? socio.name : '[nome do sócio]'},</p>
                <p>Quanto à despesa ${ssComp ? ssComp.ss_comp_nome : '[Descrição do código dos Serviços Sociais]'}, 
                no valor de ${processamento.doc_valortotal || '[valor da despesa]'}€, documento n.º ${processamento.doc_nr || '[número da fatura]'}, 
                informamos que foi processado o reembolso de ${processamento.valor_reembolso || '[valor do reembolso]'}€.</p>
                <p>O pagamento será efetuado nos próximos dias.</p>
                <p>Com os melhores cumprimentos,</p>
                <p>Os Serviços Sociais dos Trabalhadores do Município de Montemor-o-Novo</p>
            `
        });

        console.log("Email enviado com sucesso: %s", info.messageId);
    } catch (error) {
        console.error("Erro ao enviar email:", error.message);
        throw error; // Repassa o erro para ser tratado no chamador
    }
}

// Rota para criar um novo registro Processamento
router.post('/', async (req, res) => {
    try {
        console.log('Dados recebidos no backend:', req.body);

        const { socio_nr, socio_familiar, doc_nr, doc_valortotal, adse_codigo, ss_comp_cod, valor_unit, quantidade, tipo_processamento, login_usuario, data_doc } = req.body;

        // Validação dos campos obrigatórios
        if (!socio_nr || !doc_nr || !doc_valortotal || !data_doc) {
            return res.status(400).send({ error: 'Campos obrigatórios em falta: socio_nr, doc_nr, doc_valortotal, data_doc' });
        }

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
            valor_reembolso: 0
        });

        await processamento.save();

        const socio = await Socio.findOne({ socio_nr });
        if (socio && socio.email) {
            try {
                await enviarEmailPagamento(socio.email, processamento);
                console.log('E-mail enviado com sucesso para', socio.email);
            } catch (emailError) {
                console.error('Erro ao enviar e-mail:', emailError.message);
            }
        }

        res.status(201).send(processamento);
    } catch (error) {
        console.error('Erro ao criar processamento:', error.message);
        res.status(500).send({ error: 'Erro ao criar processamento.' });
    }
});

// Rota para pesquisa de processamentos
router.get('/pesquisa', async (req, res) => {
    try {
        const { proc_cod, data_inicio, data_fim, socio_nr, tipo_processamento } = req.query;
        const filtro = {};

        if (proc_cod) filtro.proc_cod = proc_cod;
        if (data_inicio && data_fim) {
            filtro.createdAt = {
                $gte: new Date(data_inicio),
                $lte: new Date(data_fim)
            };
        }
        if (socio_nr) filtro.socio_nr = socio_nr;
        if (tipo_processamento) filtro.tipo_processamento = tipo_processamento;

        const processamentos = await Processamento.find(filtro);
        res.status(200).send({ processamentos });
    } catch (error) {
        console.error('Erro ao realizar a pesquisa:', error.message);
        res.status(500).send({ error: 'Erro ao realizar a pesquisa de processamentos.' });
    }
});

// Rota para obter um registro por ID
router.get('/:id', async (req, res) => {
    try {
        const processamento = await Processamento.findById(req.params.id);
        if (!processamento) return res.status(404).send({ error: 'Registro não encontrado' });
        res.status(200).send(processamento);
    } catch (error) {
        console.error('Erro ao buscar registro:', error.message);
        res.status(500).send({ error: 'Erro ao buscar processamento' });
    }
});

// Atualizar um registro Processamento
router.patch('/:id', async (req, res) => {
    try {
        const processamento = await Processamento.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
        if (!processamento) return res.status(404).send({ error: 'Registro não encontrado' });
        res.status(200).send(processamento);
    } catch (error) {
        console.error('Erro ao atualizar registro:', error.message);
        res.status(400).send({ error: 'Erro ao atualizar processamento.' });
    }
});

// Eliminar um registro Processamento
router.delete('/:id', async (req, res) => {
    try {
        const processamento = await Processamento.findByIdAndDelete(req.params.id);
        if (!processamento) return res.status(404).send({ error: 'Registro não encontrado' });
        res.status(200).send(processamento);
    } catch (error) {
        console.error('Erro ao eliminar registro:', error.message);
        res.status(500).send({ error: 'Erro ao eliminar processamento' });
    }
});

// Gerar um novo código de pagamento
async function gerarNovoCodPagamento() {
    const lastPagamento = await Pagamento.findOne().sort({ pag_cod: -1 });
    return lastPagamento ? lastPagamento.pag_cod + 1 : 1;
}

export default router;
