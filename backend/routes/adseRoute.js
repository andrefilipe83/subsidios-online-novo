// routes/adseRoute.js
import express from 'express';
import ADSE from '../models/adse.js';
import Processamento from '../models/processamento.js';
import CompartSS from '../models/compartSS.js';
import { calcularReembolso } from '../routes/compartSSRoute.js';

const router = express.Router();

// Criar um novo registro ADSE
router.post('/', async (req, res) => {
    try {
        const adse = new ADSE(req.body);
        await adse.save();
        res.status(201).send(adse);
    } catch (error) {
        res.status(400).send(error);
    }
});

// Obter todos os registros ADSE
router.get('/', async (req, res) => {
    try {
        const adses = await ADSE.find();
        res.status(200).send({ adses });
    } catch (error) {
        res.status(500).send(error);
    }
});

// Obter um registro ADSE por ID
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

// Atualizar um registro ADSE por ID
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

// Eliminar um registro ADSE por ID
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

// Obter a descrição do código ADSE
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

// Obter a descrição do código de comparticipação dos serviços sociais
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

// Processamento ADSE
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

    console.log('Dados recebidos para processamento:', req.body);

    let proc_code = 0;
    const lastProcessamento = await Processamento.findOne().sort({ proc_cod: -1 });
    if (lastProcessamento) {
        proc_code = lastProcessamento.proc_cod;
    }
    console.log('último proc_code registrado:', proc_code);
    console.log('adse_codigo no processamento:', adse_codigo);

    try {
        const valor_reembolso_adse = await calcularReembolsoADSE(adse_codigo, valor_unit, quantidade);
        //let valor_pre_reembolso = valor_unit * quantidade - valor_reembolso_adse; //teste de correção de bug
        let valor_pre_reembolso = valor_unit - valor_reembolso_adse;
        console.log('valor_reembolso_adse:', valor_reembolso_adse);
        console.log('valor_pre_reembolso:', valor_pre_reembolso);
        console.log('valor do sscomp_cod antes de chamar função: ', sscomp_cod);
        const valor_reembolso_ss = await calcularReembolso(sscomp_cod, valor_pre_reembolso, quantidade);

        console.log('valor_reembolso_ss:', valor_reembolso_ss);

        const processamento = new Processamento({
            proc_cod: proc_code + 1,
            socio_nr: socio_nr,
            socio_familiar: socio_familiar || null,
            doc_nr: doc_nr,
            doc_data: doc_data,
            doc_valortotal: doc_valortotal,
            tipo_processamento: tipo_processamento,
            login_usuario: login_usuario,
            valor_reembolso: valor_reembolso_ss,
            linhas: [{
                ss_comp_cod: sscomp_cod,
                valor_unit: valor_unit,
                quantidade: quantidade,
                reembolso: valor_reembolso_ss
            }]
        });

        await processamento.save();
        res.status(201).send({ valor_reembolso: valor_reembolso_ss });
    } catch (error) {
        console.error('Erro ao calcular reembolso ADSE:', error);
        res.status(400).send(error);
    }
});

const calcularReembolsoADSE = async (adse_codigo, valor_unit, quantidade) => {
    const adse = await ADSE.findOne({ adse_codigo: adse_codigo });

    if (!adse) {
        throw new Error(`Não foi encontrado nenhum registro ADSE com adse_codigo ${adse_codigo}`);
    }

    let percentagem_adse = adse.adse_percentagem;
    let valor_maximo_adse = adse.adse_val_maximo;

    //let reembolso_adse = valor_unit * quantidade * percentagem_adse; //teste de correção de bug
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
