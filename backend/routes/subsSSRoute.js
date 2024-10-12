import express from 'express';
import SubsSS from '../models/subsSS.js';
import Processamento from '../models/processamento.js';

const router = express.Router();

// Criar um novo registro SubsSS
router.post('/', async (req, res) => {
    try {
        const subsSS = new SubsSS(req.body);
        await subsSS.save();
        res.status(201).send(subsSS);
    } catch (error) {
        res.status(400).send(error);
    }
});

// ***** C�DIGO NOVO PARA OS C�LCULOS DE SUBS�DIOS *****
// ajustar o frontend para s� aceitar o processamento de um subs�dio de cada vez
// verificar se para as comparticipa��es n�o far� sentido fazer o mesmo
router.post('/calcular', async (req, res) => {
    try {
        const { socio_nr, subsidy_code, unit_value, quantity, tipo_processamento, login_usuario, doc_valortotal } = req.body;

        // Encontrar o subs�dio na base de dados
        const subsidy = await SubsSS.findOne({ ss_subs_cod: subsidy_code });

        // Verificar se o subs�dio existe
        if (!subsidy) {
            return res.status(404).send('O subs�dio n�o foi encontrado.');
        }

        console.log(`unit_value: ${unit_value}, quantity: ${quantity}, sssub_val: ${subsidy.sssub_val}`);

        let valor_reembolso; // Declarar a vari�vel fora dos blocos if/else
        let proc_code = 0;
        //let proc_code_temp = 0;

        // atribuir a proc_code_temp o �ltimo valor de proc_code mas caso n�o exista nenhum valor atribuir 0
        const lastProcessamento = await Processamento.findOne().sort({ proc_cod: -1 });
        if (lastProcessamento) {
            proc_code = lastProcessamento.proc_cod;
        }
        console.log('ultimo proc_code registado:', proc_code);
        // Se valor unit�rio e quantidade n�o forem fornecidos, retornar o valor em sssub_val
        if (!unit_value && !quantity) {
            valor_reembolso = subsidy.sssub_val;
        } else if (unit_value && !quantity) {
            if (unit_value <= subsidy.sssub_val) {
                valor_reembolso = unit_value;
            } else {
                valor_reembolso = subsidy.sssub_val;
            }
        } else if (unit_value && quantity) {
            if (unit_value <= subsidy.sssub_val) {
                valor_reembolso = unit_value * quantity;
            } else {
                valor_reembolso = subsidy.sssub_val * quantity;
            }
        } else if (!unit_value && quantity) {
            valor_reembolso = subsidy.sssub_val * quantity;
        }
        
        
        
        console.log(`O valor do reembolso para o socio ${socio_nr} e ${valor_reembolso}`);
        //proc_code += 1;
        // Registar o c�lculo do subs�dio na base de dados
        const processamento = new Processamento({
            proc_cod: proc_code+1,
            socio_nr,
            tipo_processamento,
            login_usuario,
            doc_valortotal,
            valor_reembolso: valor_reembolso, //linha adicionada
            linhas : {
                adse_codigo: subsidy.adse_codigo,
                valor_unit: unit_value,
                quantidade: quantity,
                reembolso: valor_reembolso,
                ss_comp_cod: subsidy.ss_comp_cod,
                ss_subs_cod: subsidy.ss_subs_cod,
                //ss_comp_cod: subsidy.ss_subs_cod, //guarda no mesmo campo da cole��o que as comparticipa�oes
            },
            //valor_reembolso,
            //subsidy_code,
            //unit_value,
            //quantity,            
        });
        //console.log('Before save:', processamento);
        try {
            await processamento.save();
        } catch (error) {
            console.error('Error during save:', error);
        }
        //console.log('After save:', processamento);

        //console.log(`O valor do reembolso para o s�cio ${socio_nr} � ${reimbursement_value}`);
        res.status(200).send({ valor_reembolso });
    } catch (error) {
        res.status(500).send(error);
    }
});


// ***** FIM DO C�DIGO NOVO PARA OS C�LCULOS DE SUBS�DIOS *****

// Obter todos os registros SubsSS
router.get('/', async (req, res) => {
    try {
        const subsSSes = await SubsSS.find();
        res.status(200).send({ subsSSes });
    } catch (error) {
        res.status(500).send(error);
    }
});

// Obter um registro SubsSS por ID
router.get('/:id', async (req, res) => {
    try {
        const subsSS = await SubsSS.findById(req.params.id);
        if (!subsSS) {
            return res.status(404).send();
        }
        res.status(200).send(subsSS);
    } catch (error) {
        res.status(500).send(error);
    }
});

// Atualizar um registro SubsSS por ID
router.patch('/:id', async (req, res) => {
    try {
        const subsSS = await SubsSS.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true
        });
        if (!subsSS) {
            return res.status(404).send();
        }
        res.status(200).send(subsSS);
    } catch (error) {
        res.status(400).send(error);
    }
});

// Eliminar um registro SubsSS por ID
router.delete('/:id', async (req, res) => {
    try {
        const subsSS = await SubsSS.findByIdAndDelete(req.params.id);
        if (!subsSS) {
            return res.status(404).send();
        }
        res.status(200).send(subsSS);
    } catch (error) {
        res.status(500).send(error);
    }
});

router.get('/codigo/:code', async (req, res) => {
    try {
        const subsSS = await SubsSS.findOne({ ss_subs_cod: req.params.code });
        if (!subsSS) {
            return res.status(404).send();
        }
        res.status(200).send(subsSS);
    } catch (error) {
        res.status(500).send(error);
    }
});


export default router;
