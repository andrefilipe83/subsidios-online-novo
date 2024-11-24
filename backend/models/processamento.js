// CÓDIGO FUNCIONAL A GUARDAR NA BD O ESTADO DE PAGAMENTO DE UM PROCESSAMENTO
import mongoose from 'mongoose';
const { Schema } = mongoose;

const linhasSchema = new Schema({
    adse_codigo: {
        type: Number,
        required: false,
    },
    valor_unit: {
        type: Number,
        required: false,
    },
    quantidade: {
        type: Number,
        required: false,
    },
    reembolso: {
        type: Number,
        required: true,
    },
    ss_comp_cod: {
        type: Number,
        required: false,
    },
    ss_subs_cod: {
        type: Number,
        required: false,
    }
});

const processamentoSchema = new Schema({
    proc_cod: {
        type: Number,
        required: true,
        unique: true,
    },
    socio_nr: {
        type: Number,
        required: true,
    },
    socio_familiar: {
        type: String,
        required: false,
    },
    doc_nr: {
        type: String,
        required: false,
    },
    doc_valortotal: {
        type: Number,
        required: true,
        default: 0,
    },
    data_doc: { // Novo campo para a data do documento
        type: Date,
        required: false,
    },
    tipo_processamento: { // Novo campo para o tipo de processamento
        type: String,
        required: false,
    },
    login_usuario: { // Novo campo para o login do usuário que fez o registo
        type: String,
        required: false, //mudar para true
    },
    linhas: {
        type: [linhasSchema],
        required: false,
    },
    valor_reembolso: {
        type: Number,
        required: true,
    },
    pago: {
        type: Boolean,
        default: false,
    },
    data_pagamento: {
        type: Date,
        required: false,
    },
    pag_cod: {
        type: Number,
        required: false,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
    updatedAt: {
        type: Date,
        default: Date.now,
    }
});

// Middleware para atualizar o campo updatedAt
processamentoSchema.pre('save', function (next) {
    this.updatedAt = Date.now();
    next();
});

const Processamento = mongoose.model('Processamento', processamentoSchema);

export default Processamento;

