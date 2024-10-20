import express from 'express';
import fs from 'fs';
import path from 'path';
import { generateSEPAPdfReport } from '../../utils/pdfGenerator.js';  // Importar a fun��o de gera��o de PDF
import { generateContaCorrentePdfReport } from '../../utils/pdfGenerator.js';  // Função para gerar o PDF
import { fileURLToPath } from 'url'; // Para obter o caminho correto ao usar ES6 módulos
import Pagamento from '../models/pagamento.js';
import Socio from '../models/socios.js'; // Importar o modelo de sócio
import Processamento from '../models/processamento.js';

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
    const nomeFicheiro = `emails${now.getFullYear()}${(now.getMonth() + 1).toString().padStart(2, '0')}${now.getDate().toString().padStart(2, '0')}${now.getHours().toString().padStart(2, '0')}${now.getMinutes().toString().padStart(2, '0')}.txt`;
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
        const exportDir = path.join(__dirname, '../../exports');

        // Verificar se o diretório 'exports' existe, caso contrário criá-lo
        if (!fs.existsSync(exportDir)) {
            fs.mkdirSync(exportDir, { recursive: true });
        }

        const filePath = path.join(exportDir, fileName);

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

// Função para gerar o relatório de conta corrente de sócios
router.get('/generate-conta-corrente-report', async (req, res) => {
    try {
        const { socio_nr, data_inicio, data_fim } = req.query;

        if (!socio_nr) {
            return res.status(400).send('O número de sócio é obrigatório.');
        }

        // Busca o nome do sócio na base de dados
        const socio = await Socio.findOne({ socio_nr });
        const nome_socio = socio ? socio.name : 'Nome não encontrado';

        const filtros = {
            socio_nr: socio_nr,
            createdAt: {
                $gte: new Date(data_inicio),
                $lte: new Date(data_fim),
            }
        };

        // Encontrar os processamentos de acordo com os filtros
        const processamentos = await Processamento.find(filtros);

        if (!processamentos.length) {
            return res.status(404).send('Nenhum processamento encontrado para o sócio e período selecionados.');
        }

        // Calcular os totais de processamentos pagos e não pagos
        let totalPago = 0;
        let totalNaoPago = 0;

        processamentos.forEach(processamento => {
            if (processamento.pago) {
                totalPago += processamento.valor_reembolso;
            } else {
                totalNaoPago += processamento.valor_reembolso;
            }
        });

        // obter o nome do sócio para passar para o pdf

        // Gerar o relatório PDF (usando a função geradora de PDF)
        //generateContaCorrentePdfReport(res, processamentos, totalPago, totalNaoPago, socio_nr); //versão com falta de parâmetros
        await generateContaCorrentePdfReport(res, processamentos, totalPago, totalNaoPago, socio_nr, nome_socio, data_inicio, data_fim); 

    } catch (error) {
        console.error('Erro ao gerar o relatório de conta corrente:', error);
        res.status(500).send('Erro ao gerar o relatório de conta corrente.');
    }
});

export default router;
