import mongoose from 'mongoose';
const { Schema, Types } = mongoose;

const pagamentoSchema = new Schema({
    pag_cod: {
        type: Number,
        required: true,
        unique: true,
    },
    socio_nr: {
        type: Number,
        required: true,
    },
    processamentos: [{
        type: Types.ObjectId, // Mudança aqui para aceitar ObjectId
        ref: 'Processamento'
    }],
    data_pagamento: {
        type: Date,
        required: true,
    },
    metodo_pagamento: {
        type: String,
        required: true,
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

// Middleware to update the updatedAt field
pagamentoSchema.pre('save', function (next) {
    this.updatedAt = Date.now();
    next();
});

const Pagamento = mongoose.model('Pagamento', pagamentoSchema);

export default Pagamento;
