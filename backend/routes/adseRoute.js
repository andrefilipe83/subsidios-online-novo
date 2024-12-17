// routes/adseRoute.js
import express from 'express';
import ADSE from '../models/adse.js';
import Processamento from '../models/processamento.js';
import CompartSS from '../models/compartSS.js';
import { calcularReembolso } from '../routes/compartSSRoute.js';
import nodemailer from 'nodemailer';
import Socio from '../models/socios.js';

const router = express.Router();

// Função para envio de email
async function enviarEmailPagamento(email, processamento) {
    console.log('=== INÍCIO ENVIO EMAIL ===');
    console.log('Email para:', email);
    console.log('Dados do processamento:', processamento);

    if (!email) {
        throw new Error('Email não fornecido');
    }

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
        logger: true
    });

    try {
        // Verificar conexão
        console.log('Verificando conexão SMTP...');
        await transporter.verify();
        console.log('Conexão SMTP verificada');

        // Buscar dados complementares
        console.log('Buscando dados do sócio e compartimento...');
        const [socio, ssComp] = await Promise.all([
            Socio.findOne({ socio_nr: processamento.socio_nr }),
            CompartSS.findOne({ ss_comp_cod: processamento.linhas[0].ss_comp_cod })
        ]);

        if (!socio || !ssComp) {
            throw new Error('Dados complementares não encontrados');
        }

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

// [Rotas existentes permanecem iguais]
router.post('/', async (req, res) => {
    try {
        const adse = new ADSE(req.body);
        await adse.save();
        res.status(201).send(adse);
    } catch (error) {
        res.status(400).send(error);
    }
});

router.get('/', async (req, res) => {
    try {
        const adses = await ADSE.find();
        res.status(200).send({ adses });
    } catch (error) {
        res.status(500).send(error);
    }
});

router.get('/:id', async (req, res) => {
    try {
        const adse = await ADSE.findById(req.params.id);
        if (!adse) {
            return res.status(404).send();
        }
        res.status(200).send(adse);
    } catch (error) {
        res.status(500).send(error);
    }
});

router.patch('/:id', async (req, res) => {
    try {
        const adse = await ADSE.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true
        });
        if (!adse) {
            return res.status(404).send();
        }
        res.status(200).send(adse);
    } catch (error) {
        res.status(400).send(error);
    }
});

router.delete('/:id', async (req, res) => {
    try {
        const adse = await ADSE.findByIdAndDelete(req.params.id);
        if (!adse) {
            return res.status(404).send();
        }
        res.status(200).send(adse);
    } catch (error) {
        res.status(500).send(error);
    }
});

router.get('/codigo/:adse_codigo', async (req, res) => {
    try {
        const { adse_codigo } = req.params;
        const adse = await ADSE.findOne({ adse_codigo: adse_codigo });
        if (!adse) {
            return res.status(404).send({ message: 'Código ADSE não encontrado' });
        }
        res.status(200).send(adse);
    } catch (error) {
        res.status(500).send(error);
    }
});

router.get('/compartss/:sscomp_cod', async (req, res) => {
    try {
        const { sscomp_cod } = req.params;
        const compartSS = await CompartSS.findOne({ ss_comp_cod: sscomp_cod });
        if (!compartSS) {
            return res.status(404).send({ message: 'Código de comparticipação dos serviços sociais não encontrado' });
        }
        res.status(200).send(compartSS);
    } catch (error) {
        res.status(500).send(error);
    }
});

// Rota de processamento ADSE atualizada com envio de email
router.post('/processamento', async (req, res) => {
    let {
        socio_nr,
        socio_familiar,
        doc_nr,
        doc_data,
        doc_valortotal,
        adse_codigo,
        sscomp_cod,
        valor_unit,
        tipo_processamento,
        login_usuario,
        quantidade
    } = req.body;

    console.log('=== INÍCIO PROCESSAMENTO ADSE ===');
    console.log('Dados recebidos para processamento:', req.body);

    try {
        // Obter último código de processamento
        let proc_code = 0;
        const lastProcessamento = await Processamento.findOne().sort({ proc_cod: -1 });
        if (lastProcessamento) {
            proc_code = lastProcessamento.proc_cod;
        }
        console.log('Último proc_code registrado:', proc_code);

        // Calcular reembolsos
        const valor_reembolso_adse = await calcularReembolsoADSE(adse_codigo, valor_unit, quantidade);
        let valor_pre_reembolso = valor_unit - valor_reembolso_adse;
        const valor_reembolso_ss = await calcularReembolso(sscomp_cod, valor_pre_reembolso, quantidade);

        console.log('Valores calculados:', {
            reembolso_adse: valor_reembolso_adse,
            valor_pre_reembolso,
            reembolso_ss: valor_reembolso_ss
        });

        // Criar novo processamento
        const processamento = new Processamento({
            proc_cod: proc_code + 1,
            socio_nr,
            socio_familiar: socio_familiar || null,
            doc_nr,
            doc_data,
            doc_valortotal,
            tipo_processamento,
            login_usuario,
            valor_reembolso: valor_reembolso_ss,
            linhas: [{
                ss_comp_cod: sscomp_cod,
                valor_unit,
                quantidade,
                reembolso: valor_reembolso_ss
            }]
        });

        // Salvar processamento
        const savedProcessamento = await processamento.save();
        console.log('Processamento salvo com sucesso');

        // Buscar sócio para email
        console.log('Buscando dados do sócio para email');
        const socio = await Socio.findOne({ socio_nr: socio_nr });

        if (socio && socio.email && typeof socio.email === 'string' && socio.email.trim() !== '') {
            try {
                await enviarEmailPagamento(socio.email.trim(), savedProcessamento);
                console.log('Email enviado com sucesso');
            } catch (emailError) {
                console.error('Erro no envio do email:', emailError);
                // Continua o processamento mesmo se o email falhar
            }
        } else {
            console.log('Email não enviado:', !socio ? 'Sócio não encontrado' : 'Email inválido');
        }

        console.log('=== FIM PROCESSAMENTO ADSE ===');
        res.status(201).send({ valor_reembolso: valor_reembolso_ss });
    } catch (error) {
        console.error('Erro no processamento ADSE:', error);
        res.status(400).send(error);
    }
});

// Função auxiliar para cálculo do reembolso ADSE
const calcularReembolsoADSE = async (adse_codigo, valor_unit, quantidade) => {
    const adse = await ADSE.findOne({ adse_codigo: adse_codigo });

    if (!adse) {
        throw new Error(`Não foi encontrado nenhum registro ADSE com adse_codigo ${adse_codigo}`);
    }

    let percentagem_adse = adse.adse_percentagem;
    let valor_maximo_adse = adse.adse_val_maximo;

    console.log('valor_unitário antes do cálculo da adse:', valor_unit);
    let reembolso_adse = valor_unit * percentagem_adse / 100;
    console.log('reembolso_adse antes do cálculo do valor total:', reembolso_adse);

    if (reembolso_adse > valor_maximo_adse) {
        reembolso_adse = valor_maximo_adse;
    }
    console.log('reembolso_adse calculado:', reembolso_adse);

    return reembolso_adse;
}

export default router;