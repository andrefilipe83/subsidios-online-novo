import express from 'express';
import { generateSEPAPdfReport } from '../../utils/pdfGenerator.js';  // Importar a fun��o de gera��o de PDF
import Pagamento from '../models/pagamento.js';

const router = express.Router();

router.get('/generate-SEPA-pdf-report', async (req, res) => {
    try {
        // Filtragem de dados de pagamento (igual ao exemplo anterior)
        const { data_inicio, data_fim, metodo_pagamento = 'SEPA' } = req.query;

        const dataInicio = new Date(data_inicio);
        const dataFim = new Date(data_fim);

        dataInicio.setUTCHours(0, 0, 0, 0);
        dataFim.setUTCHours(23, 59, 59, 999);

        const filtros = {
            metodo_pagamento: metodo_pagamento,
            data_pagamento: {
                $gte: dataInicio,
                $lte: dataFim,
            },
        };

        const pagamentos = await Pagamento.find(filtros).populate('processamentos');

        if (!pagamentos.length) {
            return res.status(404).send('Nenhum pagamento encontrado para os filtros aplicados.');
        }

        // Chamar a fun��o que gera o PDF e envia a resposta
        generateSEPAPdfReport(res, pagamentos);

    } catch (error) {
        console.error('Erro ao gerar o relatório PDF:', error);
        res.status(500).send('Erro ao gerar o relatório PDF.');
    }
});

export default router;
