import express from 'express';
import Socio from '../models/socios.js';
const router = express.Router();

// Função para remover acentos de uma string
function removeAcentos(text) {
    return text.normalize('NFD').replace(/\p{Diacritic}/gu, '');
}

// Criar um novo sócio
router.post('/', async (req, res) => {
    try {
        const socio = new Socio(req.body);
        console.log('Dados recebidos para criação:', socio);
        await socio.save();
        res.status(201).send(socio);
    } catch (error) {
        console.error('Erro ao criar sócio:', error);
        res.status(400).send(error);
    }
});

// Obter todos os sócios
router.get('/', async (req, res) => {
    try {
        const socios = await Socio.find();
        res.status(200).send({ socios });
    } catch (error) {
        console.error('Erro ao obter sócios:', error);
        res.status(500).send(error);
    }
});

// Obter o número de sócio mais alto
router.get('/highest-number', async (req, res) => {
    try {
        const socios = await Socio.find();
        const highestSocioNr = socios.reduce((max, socio) => {
            const socioNr = parseInt(socio.socio_nr, 10);
            return socioNr > max ? socioNr : max;
        }, 0);
        res.status(200).send({ highestSocioNr });
    } catch (error) {
        console.error('Erro ao obter número de sócio mais alto:', error);
        res.status(500).send(error);
    }
});

// Nova rota para pesquisar sócios com filtros (número e nome)
router.get('/search', async (req, res) => {
    try {
        const { socio_nr, name } = req.query;
        let query = {};

        // Adicionar filtro por número de sócio (números que começam com o valor inserido)
        if (socio_nr) {
            query.socio_nr = { $regex: '^' + socio_nr }; // Busca todos os números que começam com "socio_nr"
        }

        // Adicionar filtro por nome (case-insensitive e ignorando acentos)
        if (name) {
            const normalizedQueryName = removeAcentos(name);
            query.name = { $regex: new RegExp(removeAcentos(normalizedQueryName), 'i') }; // Ignora maiúsculas, minúsculas e acentos
        }

        // Buscar sócios de acordo com os filtros
        const socios = await Socio.find(query);
        
        // Retornar os resultados
        res.status(200).send({ socios });
    } catch (error) {
        console.error('Erro ao pesquisar sócios:', error);
        res.status(500).send(error);
    }
});

// Obter um sócio por socio_nr
router.get('/:socio_nr', async (req, res) => {
    try {
        const socio = await Socio.findOne({ socio_nr: req.params.socio_nr });
        if (!socio) {
            return res.status(404).send();
        }
        res.status(200).send(socio);
    } catch (error) {
        console.error('Erro ao obter sócio:', error);
        res.status(500).send(error);
    }
});

// Atualizar um sócio por ID
router.patch('/:id', async (req, res) => {
    try {
        const socio = await Socio.findByIdAndUpdate(req.params.id, req.body, {
            //new: true, //teste para a atualização
            runValidators: true
        });
        console.log('socio capturado:', socio);
        if (!socio) {
            console.log('socio a atualizar:', socio);
            return res.status(404).send();
        }
        res.status(200).send(socio);
    } catch (error) {
        console.error('Erro ao atualizar sócio:', error);
        res.status(400).send(error);
    }
});

// Eliminar um sócio por ID
router.delete('/:id', async (req, res) => {
    try {
        const socio = await Socio.findByIdAndDelete(req.params.id);
        if (!socio) {
            return res.status(404).send();
        }
        res.status(200).send(socio);
    } catch (error) {
        console.error('Erro ao eliminar sócio:', error);
        res.status(500).send(error);
    }
});



export default router;
