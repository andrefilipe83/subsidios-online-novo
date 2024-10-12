import express from 'express';
import Pagamento from '../models/pagamento.js';  // Modelo de Pagamento
import Socio from '../models/socios.js';        // Modelo de S�cio
import { createSepaFile } from '../../utils/sepaGenerator.js';  // Fun��o que cria o ficheiro SEPA

const router = express.Router();

// Rota para gerar o ficheiro SEPA com base nos filtros
// router.get('/generate-sepa', async (req, res) => {
//     try {
//         // Extrair os filtros dos query params
//         const { data_inicio, data_fim, metodo_pagamento = 'SEPA' } = req.query;

//         // Filtrar os pagamentos com base na data e no m�todo de pagamento
//         const filtros = {
//             metodo_pagamento: metodo_pagamento,
//             pago: true,  // Apenas processar os que est�o pagos
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

//         // Coletar os dados dos s�cios e formatar os dados para SEPA
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

//         // Chamar a fun��o para gerar o ficheiro SEPA
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

        // Definir a hora para o in�cio e fim do dia
        dataInicio.setUTCHours(0, 0, 0, 0);
        dataFim.setUTCHours(23, 59, 59, 999);

        console.log('Data In�cio (com hora):', dataInicio);
        console.log('Data Fim (com hora):', dataFim);

        // Filtrar os pagamentos com base na data e no m�todo de pagamento
        const filtros = {
            metodo_pagamento: metodo_pagamento,
            data_pagamento: {
                $gte: dataInicio,  // Comparar a partir da data de in�cio
                $lte: dataFim,  // Comparar at� a data de fim
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

        // Agrupar pagamentos por s�cio
        const pagamentosAgrupadosPorSocio = {};

        for (const pagamento of pagamentos) {
            const socio = await Socio.findOne({ socio_nr: pagamento.socio_nr });

            if (socio && socio.IBAN) {  // Certifique-se de que o s�cio tem IBAN
                const valorTotalReembolso = pagamento.processamentos.reduce((acc, proc) => acc + (proc.valor_reembolso || 0), 0);

                // Verificar se j� existe um registro para este s�cio
                if (pagamentosAgrupadosPorSocio[socio.socio_nr]) {
                    // Somar o valor ao s�cio existente
                    pagamentosAgrupadosPorSocio[socio.socio_nr].valor += valorTotalReembolso;
                } else {
                    // Criar um novo registro para o s�cio
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
            return res.status(404).send('Nenhum s�cio com IBAN v�lido encontrado para os pagamentos filtrados.');
        }

        console.log('Dados agrupados para gerar SEPA:', pagamentosComDadosSocios);

        // Chamar a fun��o para gerar o ficheiro SEPA
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
