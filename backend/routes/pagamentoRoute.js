import express from 'express';
import Pagamento from '../models/pagamento.js';

const router = express.Router();

// Criar um novo registro Pagamento
router.post('/', async (req, res) => {
    try {
        const pagamento = new Pagamento(req.body);
        await pagamento.save();
        res.status(201).send(pagamento);
    } catch (error) {
        res.status(400).send(error);
    }
});

// Obter todos os registros Pagamento
router.get('/', async (req, res) => {
    try {
        const pagamentos = await Pagamento.find();
        res.status(200).send({ pagamentos });
    } catch (error) {
        res.status(500).send(error);
    }
});

// Obter um registro Pagamento por ID
router.get('/:id', async (req, res) => {
    try {
        const pagamento = await Pagamento.findById(req.params.id);
        if (!pagamento) {
            return res.status(404).send();
        }
        res.status(200).send(pagamento);
    } catch (error) {
        res.status(500).send(error);
    }
});

// Atualizar um registro Pagamento por ID
router.patch('/:id', async (req, res) => {
    try {
        const pagamento = await Pagamento.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true
        });
        if (!pagamento) {
            return res.status(404).send();
        }
        res.status(200).send(pagamento);
    } catch (error) {
        res.status(400).send(error);
    }
});

// Eliminar um registro Pagamento por ID
router.delete('/:id', async (req, res) => {
    try {
        const pagamento = await Pagamento.findByIdAndDelete(req.params.id);
        if (!pagamento) {
            return res.status(404).send();
        }
        res.status(200).send(pagamento);
    } catch (error) {
        res.status(500).send(error);
    }
});

export default router;