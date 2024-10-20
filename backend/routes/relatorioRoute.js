import express from 'express';
import fs from 'fs';
import path from 'path';
import { generateSEPAPdfReport } from '../../utils/pdfGenerator.js';  // Importar a fun��o de gera��o de PDF
import { fileURLToPath } from 'url'; // Para obter o caminho correto ao usar ES6 módulos
import Pagamento from '../models/pagamento.js';
import Socio from '../models/socios.js'; // Importar o modelo de sócio

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

// Função para gerar um nome de ficheiro único baseado na data e hora
function gerarNomeFicheiro() {
    const now = new Date();
    const nomeFicheiro = `emails${now.getDate()}${now.getMonth() + 1}${now.getFullYear()}${now.getHours()}${now.getMinutes()}.txt`;
    return nomeFicheiro;
}

// Rota para gerar o ficheiro de emails de sócios ativos
router.get('/generate-email-report', async (req, res) => {
    try {
        // Encontrar sócios com email e status 'Ativo'
        const sociosAtivos = await Socio.find({ email: { $ne: '' }, status: 'Ativo' });

        if (!sociosAtivos.length) {
            return res.status(404).send('Nenhum sócio ativo com email encontrado.');
        }

        // Gerar o conteúdo do ficheiro
        let emailList = sociosAtivos.map(socio => socio.email).join('\n');

        // Gerar o nome do ficheiro
        const fileName = gerarNomeFicheiro();

        // Resolver o caminho corretamente usando `fileURLToPath` e `import.meta.url`
        const __filename = fileURLToPath(import.meta.url);
        const __dirname = path.dirname(__filename);
        const filePath = path.join(__dirname, '../../exports', fileName);

        // Gravar o conteúdo num ficheiro .txt
        fs.writeFile(filePath, emailList, (err) => {
            if (err) {
                console.error('Erro ao gerar o ficheiro:', err);
                return res.status(500).send('Erro ao gerar o ficheiro.');
            }

            // Enviar o ficheiro para download
            res.download(filePath, fileName, (err) => {
                if (err) {
                    console.error('Erro ao enviar o ficheiro:', err);
                    res.status(500).send('Erro ao enviar o ficheiro.');
                }
            });
        });
    } catch (error) {
        console.error('Erro ao gerar o relatório de emails:', error);
        res.status(500).send('Erro ao gerar o relatório de emails.');
    }
});



export default router;
