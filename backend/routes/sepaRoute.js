import express from 'express';
import Pagamento from '../models/pagamento.js';  // Modelo de Pagamento
import Socio from '../models/socios.js';        // Modelo de Sócio
import { createSepaFile } from '../../utils/sepaGenerator.js';  // Função que cria o ficheiro SEPA

const router = express.Router();

// Rota para gerar o ficheiro SEPA com base nos filtros
// router.get('/generate-sepa', async (req, res) => {
//     try {
//         // Extrair os filtros dos query params
//         const { data_inicio, data_fim, metodo_pagamento = 'SEPA' } = req.query;

//         // Filtrar os pagamentos com base na data e no método de pagamento
//         const filtros = {
//             metodo_pagamento: metodo_pagamento,
//             pago: true,  // Apenas processar os que estão pagos
//             data_pagamento: {
//                 $gte: new Date(data_inicio),
//                 $lte: new Date(data_fim),
//             },
//         };

//         // Buscar os pagamentos que correspondem aos filtros
//         const pagamentos = await Pagamento.find(filtros).populate('processamentos');

//         if (!pagamentos.length) {
//             return res.status(404).send('Nenhum pagamento encontrado para os filtros aplicados.');
//         }

//         // Coletar os dados dos sócios e formatar os dados para SEPA
//         const pagamentosComDadosSocios = [];
//         for (const pagamento of pagamentos) {
//             const socio = await Socio.findOne({ socio_nr: pagamento.socio_nr });

//             if (socio) {
//                 pagamentosComDadosSocios.push({
//                     nome: socio.name,
//                     iban: socio.IBAN,
//                     valor: pagamento.processamentos.reduce((acc, proc) => acc + proc.valor_reembolso, 0), // Somar todos os reembolsos
//                     data_pagamento: pagamento.data_pagamento,
//                 });
//             }
//         }

//         // Chamar a função para gerar o ficheiro SEPA
//         const sepaFile = createSepaFile(pagamentosComDadosSocios);

//         // Enviar o ficheiro SEPA como resposta
//         res.setHeader('Content-Disposition', 'attachment; filename="sepa.xml"');
//         res.setHeader('Content-Type', 'application/xml');
//         res.send(sepaFile);

//     } catch (error) {
//         console.error('Erro ao gerar o ficheiro SEPA:', error);
//         res.status(500).send('Erro ao gerar o ficheiro SEPA.');
//     }
// });



router.get('/generate-sepa', async (req, res) => {
    try {
        // Extrair os filtros dos query params e converter para objetos Date
        const { data_inicio, data_fim, metodo_pagamento = 'SEPA' } = req.query;

        const dataInicio = new Date(data_inicio);
        const dataFim = new Date(data_fim);

        // Definir a hora para o início e fim do dia
        dataInicio.setUTCHours(0, 0, 0, 0);
        dataFim.setUTCHours(23, 59, 59, 999);

        console.log('Data Início (com hora):', dataInicio);
        console.log('Data Fim (com hora):', dataFim);

        // Filtrar os pagamentos com base na data e no método de pagamento
        const filtros = {
            metodo_pagamento: metodo_pagamento,
            data_pagamento: {
                $gte: dataInicio,  // Comparar a partir da data de início
                $lte: dataFim,  // Comparar até a data de fim
            },
        };

        console.log('Filtros aplicados:', filtros);

        // Buscar os pagamentos que correspondem aos filtros
        const pagamentos = await Pagamento.find(filtros).populate('processamentos');

        if (!pagamentos.length) {
            console.log('Nenhum pagamento encontrado para os filtros aplicados.');
            return res.status(404).send('Nenhum pagamento encontrado para os filtros aplicados.');
        }

        console.log('Pagamentos encontrados:', pagamentos);

        // Agrupar pagamentos por sócio
        const pagamentosAgrupadosPorSocio = {};

        for (const pagamento of pagamentos) {
            const socio = await Socio.findOne({ socio_nr: pagamento.socio_nr });

            if (socio && socio.IBAN) {  // Certifique-se de que o sócio tem IBAN
                const valorTotalReembolso = pagamento.processamentos.reduce((acc, proc) => acc + (proc.valor_reembolso || 0), 0);

                // Verificar se já existe um registro para este sócio
                if (pagamentosAgrupadosPorSocio[socio.socio_nr]) {
                    // Somar o valor ao sócio existente
                    pagamentosAgrupadosPorSocio[socio.socio_nr].valor += valorTotalReembolso;
                } else {
                    // Criar um novo registro para o sócio
                    pagamentosAgrupadosPorSocio[socio.socio_nr] = {
                        nome: socio.name,
                        iban: socio.IBAN,
                        valor: valorTotalReembolso,
                        data_pagamento: pagamento.data_pagamento,
                    };
                }
            }
        }

        // Converter os objetos agrupados para um array para gerar o SEPA
        const pagamentosComDadosSocios = Object.values(pagamentosAgrupadosPorSocio);

        if (!pagamentosComDadosSocios.length) {
            return res.status(404).send('Nenhum sócio com IBAN válido encontrado para os pagamentos filtrados.');
        }

        console.log('Dados agrupados para gerar SEPA:', pagamentosComDadosSocios);

        // Chamar a função para gerar o ficheiro SEPA
        const sepaFile = createSepaFile(pagamentosComDadosSocios);

        console.log('Ficheiro SEPA gerado com sucesso');

        // Enviar o ficheiro SEPA como resposta
        res.setHeader('Content-Disposition', 'attachment; filename="sepa.xml"');
        res.setHeader('Content-Type', 'application/xml');
        res.send(sepaFile);

    } catch (error) {
        console.error('Erro ao gerar o ficheiro SEPA:', error);
        res.status(500).send('Erro ao gerar o ficheiro SEPA.');
    }
});


export default router;
