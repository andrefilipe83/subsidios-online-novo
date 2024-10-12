import mongoose from 'mongoose';
const { Schema } = mongoose;

const adseSchema = new Schema({
    adse_codigo: {
        type: Number,
        required: true,
        unique: true,
    },
    adse_nome: {
        type: String,
        required: true,
    },
    adse_percentagem: {
        type: Number,
        required: true,
    },
    adse_val_maximo: {
        type: Number,
        required: true,
    },
    adse_prazo: {
        type: Number,
        required: true,
    },
    adse_limite: {
        type: Number,
        required: true,
    },
    adse_ss_comp: {
        type: Number,
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
adseSchema.pre('save', function (next) {
    this.updatedAt = Date.now();
    next();
});

const ADSE = mongoose.model('ADSE', adseSchema);

export default ADSE;
