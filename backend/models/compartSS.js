import mongoose from 'mongoose';
const { Schema } = mongoose;

const compartSSSchema = new Schema({
    ss_comp_cod: {
        type: Number,
        required: true,
        unique: true,
    },
    sscomp_nome: {
        type: String,
        required: true,
    },
    sscomp_percentagem: {
        type: Number,
        required: true,
    },
    sscomp_val_maximo: {
        type: Number,
        required: true,
    },
    sscomp_prazo: {
        type: Number,
        required: true,
    },
    sscomp_limite: {
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
compartSSSchema.pre('save', function (next) {
    this.updatedAt = Date.now();
    next();
});

const CompartSS = mongoose.model('CompartSS', compartSSSchema);

export default CompartSS;
