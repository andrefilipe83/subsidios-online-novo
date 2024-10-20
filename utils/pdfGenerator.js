import PDFDocument from 'pdfkit';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import Socio from '../backend/models/socios.js';

// Definir __filename e __dirname para ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Função para formatar valores em euros com separadores de milhar e decimais corretos
function formatarEmEuros(valor) {
    return valor.toLocaleString('pt-PT', { style: 'currency', currency: 'EUR' });
}

// Função para gerar a data e hora atuais no formato correto
function formatarDataHora() {
    return new Date().toLocaleString('pt-PT', { dateStyle: 'short', timeStyle: 'short' });
}

// Função para adicionar o cabeçalho (logo e título)
function adicionarCabecalho(doc, titulo) {
    const fontPath = path.join(__dirname, '../fonts/arial.ttf');
    doc.registerFont('Arial', fontPath);
    doc.font('Arial');

    // Adicionar imagem do logo
    const imagePath = path.join(__dirname, '../img/logo_report.png');
    doc.image(imagePath, 50, 40, { width: 200 })
        .moveDown(4);

    // Adicionar título centralizado
    doc.fontSize(20)
        .text(titulo, { align: 'center' })
        .moveDown(1.5);

    // Adicionar linha horizontal abaixo do cabeçalho
    doc.moveTo(50, doc.y - 5).lineTo(563, doc.y - 5).stroke();
}

// Função para adicionar o cabeçalho da tabela
function adicionarCabecalhoTabela(doc) {
    const yPosition = doc.y;
    doc.fontSize(10)
        .fillColor('black')
        .text('Nr.:', 50, yPosition)
        .text('Nome:', 100, yPosition)
        .text('IBAN', 350, yPosition)
        .text('Valor (€)', 450, yPosition, { align: 'right' })
        .moveDown(0.5);

    // Linha horizontal abaixo do cabeçalho da tabela
    doc.moveTo(50, doc.y).lineTo(563, doc.y).stroke();
}

// Função para adicionar o cabeçalho da tabela
function adicionarCabecalhoTabelaContaCorrente(doc) {
    const yPosition = doc.y;
    doc.fontSize(10)
        .fillColor('black')
        .text('Código', 50, yPosition)
        .text('Data Documento', 150, yPosition)
        .text('Valor Total', 250, yPosition, { align: 'right' })
        .text('Valor Reembolso', 350, yPosition, { align: 'right' })
        .text('Pago', 450, yPosition, { align: 'right' })
        .text('Data de Pagamento', 500, yPosition, { align: 'right' })
        .moveDown(0.5);

    // Linha horizontal abaixo do cabeçalho da tabela
    doc.moveTo(50, doc.y).lineTo(563, doc.y).stroke();
}

// Função para adicionar o rodapé (data/hora e numeração da página)
function adicionarRodape(doc, paginaAtual, totalPaginas) {
    const dataHora = formatarDataHora();
    const rodapeY = doc.page.height - 100;

    // Data/Hora à esquerda
    doc.fontSize(10).fillColor('gray')
        .text(`Data/Hora: ${dataHora}`, 50, rodapeY, { align: 'left' });

    // Número da página à direita
    let paginaTexto = `Pág. ${paginaAtual}`;
    if (totalPaginas) {
        paginaTexto += `/${totalPaginas}`;
    }

    doc.text(paginaTexto, doc.page.width - 100, rodapeY, {
        align: 'right'
    });
}

// Função principal para gerar o relatório em PDF
export async function generateSEPAPdfReport(res, pagamentos) {
    const doc = new PDFDocument({ margin: 50, bufferPages: true });

    doc.on('error', (err) => {
        console.error('Erro ao gerar o PDF:', err);
        res.status(500).send('Erro ao gerar o relatório PDF.');
    });

    res.setHeader('Content-Disposition', 'attachment; filename="relatorio_pagamentos.pdf"');
    res.setHeader('Content-Type', 'application/pdf');
    doc.pipe(res);

    // Adicionar o cabeçalho
    adicionarCabecalho(doc, 'Relatório de Pagamentos SEPA');
    adicionarCabecalhoTabela(doc);

    let totalTransferencias = 0;
    let paginaAtual = 1;


    for (const pagamento of pagamentos) {
        const socio = await Socio.findOne({ socio_nr: pagamento.socio_nr });
        const nomeSocio = socio ? socio.name : 'Nome não encontrado';
        const iban = socio ? socio.IBAN : 'IBAN não encontrado';
        const valorTotal = pagamento.processamentos.reduce((acc, proc) => acc + (proc.valor_reembolso || 0), 0);

        totalTransferencias += valorTotal;

        const isEven = pagamentos.indexOf(pagamento) % 2 === 0;
        if (isEven) {
            doc.rect(50, doc.y, 513, 20).fill('#f0f0f0').stroke();
            doc.fillColor('black');
        }

        const currentY = doc.y + 5;
        doc.text(pagamento.socio_nr, 50, currentY)
            .text(nomeSocio, 100, currentY, { width: 220, ellipsis: true })
            .text(iban, 350, currentY)
            .text(formatarEmEuros(valorTotal), 450, currentY, { align: 'right' });

        doc.moveDown(0.5);

        // Se a próxima linha ultrapassar o limite da página, adicionar rodapé e nova página
        if (doc.y > 650) {
            //adicionarRodape(doc, paginaAtual, null);
            adicionarRodape(doc, paginaAtual, null);
            paginaAtual++;
            doc.addPage();
            adicionarCabecalho(doc, 'Relatório de Pagamentos SEPA'); // Adicionar o cabeçalho da nova página
            adicionarCabecalhoTabela(doc); // Adicionar a linha de cabeçalho da tabela na nova página
        }
    }

    // Adicionar total das transferências
    doc.moveDown(2);
    doc.fontSize(12).fillColor('black')
        .text(`Total das Transferências: ${formatarEmEuros(totalTransferencias)}`, 50, doc.y, { align: 'right' });

    // Adicionar rodapé final apenas uma vez
    const pageRange = doc.bufferedPageRange();
    for (let i = 0; i < pageRange.count; i++) {
        doc.switchToPage(i);
        //adicionarRodape(doc, i + 1, pageRange.count);
    }

    adicionarRodape(doc, pageRange.count, null);

    doc.end();
}

// Função principal para gerar o relatório em PDF de conta corrente
export async function generateContaCorrentePdfReport(res, processamentos, totalPago, totalNaoPago, socio_nr, nome_socio, data_inicio, data_fim) {
    const doc = new PDFDocument({ margin: 50, bufferPages: true });

    doc.on('error', (err) => {
        console.error('Erro ao gerar o PDF:', err);
        res.status(500).send('Erro ao gerar o relatório PDF.');
    });

    res.setHeader('Content-Disposition', 'attachment; filename="relatorio_conta_corrente.pdf"');
    res.setHeader('Content-Type', 'application/pdf');
    doc.pipe(res);

    // Adicionar o cabeçalho
    adicionarCabecalho(doc, 'Relatório de Conta Corrente');

    // Adicionar nome do sócio e período
    doc.fontSize(12).text(`Sócio: ${socio_nr} - ${nome_socio}`, { align: 'left' });
    doc.moveDown();
    doc.text(`Período: ${new Date(data_inicio).toLocaleDateString()} até ${new Date(data_fim).toLocaleDateString()}`, { align: 'left' });
    doc.moveDown(2);

    // Adicionar cabeçalho da tabela
    adicionarCabecalhoTabelaContaCorrente(doc);

    let paginaAtual = 1;

    // Adicionar os processamentos em formato de tabela
    processamentos.forEach((processamento, index) => {
        const currentY = doc.y;
        const dataDocumento = processamento.data_documento ? new Date(processamento.data_documento).toLocaleDateString() : 'N/A';
        const dataPagamento = processamento.pago ? new Date(processamento.data_pagamento).toLocaleDateString() : 'N/A';

        doc.text(processamento.proc_cod, 50, currentY)
            .text(dataDocumento, 100, currentY)
            .text(formatarEmEuros(processamento.doc_valortotal), 150, currentY, { width: 45, align: 'right' })
            .text(formatarEmEuros(processamento.valor_reembolso), 200, currentY, { width: 45, align: 'right' })
            .text(processamento.pago ? 'Sim' : 'Não', 250, currentY, { width: 45, align: 'right' })
            .text(dataPagamento, 300, currentY, { align: 'right' });

        doc.moveDown(0.5);

        // Verificar se ultrapassou a página e adicionar nova página se necessário
        if (doc.y > 650) {
            adicionarRodape(doc, paginaAtual, null);
            paginaAtual++;
            doc.addPage();
            adicionarCabecalho(doc, 'Relatório de Conta Corrente');
            adicionarCabecalhoTabelaContaCorrente(doc);
        }
    });

    // Adicionar totais
    doc.moveDown(2);
    doc.fontSize(12).fillColor('black')
        .text(`Total Pago: ${formatarEmEuros(totalPago)}`, 50, doc.y, { align: 'left' })
        .text(`Total Processado mas por Pagar: ${formatarEmEuros(totalNaoPago)}`, 50, doc.y, { align: 'left' });

    // Adicionar rodapé final em todas as páginas
    const pageRange = doc.bufferedPageRange();
    for (let i = 0; i < pageRange.count; i++) {
        doc.switchToPage(i);
        adicionarRodape(doc, i + 1, pageRange.count);
    }

    doc.end();
}