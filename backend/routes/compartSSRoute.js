import express from 'express';
import CompartSS from '../models/compartSS.js';
import Processamento from '../models/processamento.js';

const router = express.Router();

// Criar um novo registro CompartSS
router.post('/', async (req, res) => {
    try {
        const compartSS = new CompartSS(req.body);
        await compartSS.save();
        res.status(201).send(compartSS);
    } catch (error) {
        res.status(400).send(error);
    }
});

// Obter todos os registros CompartSS
router.get('/', async (req, res) => {
    try {
        const compartSSes = await CompartSS.find();
        res.status(200).send({ compartSSes });
    } catch (error) {
        res.status(500).send(error);
    }
});

// Obter um registro CompartSS por ID
router.get('/:id', async (req, res) => {
    try {
        const compartSS = await CompartSS.findById(req.params.id);
        if (!compartSS) {
            return res.status(404).send();
        }
        res.status(200).send(compartSS);
    } catch (error) {
        res.status(500).send(error);
    }
});

// Atualizar um registro CompartSS por ID
router.patch('/:id', async (req, res) => {
    try {
        const compartSS = await CompartSS.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true
        });
        if (!compartSS) {
            return res.status(404).send();
        }
        res.status(200).send(compartSS);
    } catch (error) {
        res.status(400).send(error);
    }
});

// Eliminar um registro CompartSS por ID
router.delete('/:id', async (req, res) => {
    try {
        const compartSS = await CompartSS.findByIdAndDelete(req.params.id);
        if (!compartSS) {
            return res.status(404).send();
        }
        res.status(200).send(compartSS);
    } catch (error) {
        res.status(500).send(error);
    }
});

router.get('/codigo/:sscomp_cod', async (req, res) => {
    try {
        const { sscomp_cod } = req.params;
        const compartSS = await CompartSS.findOne({ ss_comp_cod: sscomp_cod });
        if (!compartSS) {
            return res.status(404).send({ message: 'C?digo SS Comp n?o encontrado' });
        }
        console.log('compartSS encontrado:', compartSS); // Log para depura??o
        res.status(200).send(compartSS);
    } catch (error) {
        res.status(500).send(error);
    }
});

// Fun??o para criar um novo Processamento
router.post('/processamento', async (req, res) => {
    let { socio_nr, socio_familiar, doc_nr, doc_data, doc_valortotal, sscomp_cod, valor_unit, quantidade, tipo_processamento, login_usuario } = req.body;

    let proc_code = 0;
    const lastProcessamento = await Processamento.findOne().sort({ proc_cod: -1 });
    if (lastProcessamento) {
        proc_code = lastProcessamento.proc_cod;
    }

    const valor_reembolso = await calcularReembolso(sscomp_cod, valor_unit, quantidade);

    const processamento = new Processamento({
        proc_cod: proc_code + 1,
        socio_nr: socio_nr,
        socio_familiar: socio_familiar || null,
        doc_nr: doc_nr,
        doc_data: doc_data,
        doc_valortotal: doc_valortotal,
        tipo_processamento: tipo_processamento,
        login_usuario: login_usuario,
        valor_reembolso: valor_reembolso,
        linhas: [{
            ss_comp_cod: sscomp_cod,
            valor_unit: valor_unit,
            quantidade: quantidade,
            reembolso: valor_reembolso
        }]
    });

    try {
        await processamento.save();
        res.status(201).send({ valor_reembolso: valor_reembolso });
    } catch (error) {
        res.status(400).send(error);
    }
});

export async function calcularReembolso(sscomp_cod, valor_unit, quantidade) {
    const compartSS = await CompartSS.findOne({ ss_comp_cod: sscomp_cod });

    if (!compartSS) {
        throw new Error(`Não foi encontrado nenhum registro CompartSS com ss_comp_cod ${sscomp_cod}`);
    }

    console.log('compartSS:', compartSS);
    console.log('valor_unit:', valor_unit);
    console.log('quantidade:', quantidade);

    let percentagem = compartSS.sscomp_percentagem;
    let val_maximo = compartSS.sscomp_val_maximo;

    //let reembolso = valor_unit * percentagem * quantidade; // Alterado para calcular o reembolso unitário
    let reembolso = valor_unit * percentagem; // Alterado para calcular o reembolso unitário

    if (reembolso > val_maximo) {
        reembolso = val_maximo;
    }
    console.log('reembolso calculado:', reembolso);
    console.log('quantidade:', quantidade);
    console.log('reembolso final após quantidade:', reembolso * quantidade);
    return reembolso*quantidade; // Alterado para retornar o valor total do reembolso
}

export default router;
