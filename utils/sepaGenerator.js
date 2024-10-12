import xmlbuilder from 'xmlbuilder';  // Dependência para gerar XML

export function createSepaFile(pagamentos) {
    // Criação do documento XML SEPA
    const doc = xmlbuilder.create('Document', { version: '1.0', encoding: 'UTF-8' })
        .att('xmlns', 'urn:iso:std:iso:20022:tech:xsd:pain.001.001.03')
        .ele('CstmrCdtTrfInitn')
        .ele('GrpHdr')
            .ele('MsgId', 'Ficheiro_SEPA_' + new Date().toISOString()).up()
            .ele('CreDtTm', new Date().toISOString()).up()
            .ele('NbOfTxs', pagamentos.length).up()
            .ele('CtrlSum', pagamentos.reduce((acc, p) => acc + p.valor, 0).toFixed(2)).up()
            .ele('InitgPty')
                .ele('Nm', 'Nome da Empresa ou Organização').up()
            .up()
        .up();

    const pmtInf = doc.ele('PmtInf')
        .ele('PmtInfId', 'Pagamento_SEPA_' + new Date().toISOString()).up()
        .ele('PmtMtd', 'TRF').up();

    // Iterar sobre os pagamentos para adicionar as transferências individuais
    pagamentos.forEach((p, index) => {
        const cdtTrfTxInf = pmtInf.ele('CdtTrfTxInf')
            .ele('PmtId')
                .ele('EndToEndId', 'Pagamento_' + (index + 1)).up()
            .up()
            .ele('Amt')
                .ele('InstdAmt', p.valor.toFixed(2), { Ccy: 'EUR' }).up()
            .up()
            .ele('CdtrAgt')
                .ele('FinInstnId')
                    .ele('BIC', 'BIC_CODE_DO_BANCO').up()
                .up()
            .up()
            .ele('Cdtr')
                .ele('Nm', p.nome).up()
            .up()
            .ele('CdtrAcct')
                .ele('Id')
                    .ele('IBAN', p.iban).up()
                .up()
            .up();
    });

    return doc.end({ pretty: true });
}
