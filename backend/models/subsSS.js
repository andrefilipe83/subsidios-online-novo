import mongoose from 'mongoose';
const { Schema } = mongoose;

const subsSSSchema = new Schema({
    ss_subs_cod: {
        type: Number,
        required: true,
        unique: true,
    },
    sssub_nome: {
        type: String,
        required: true,
    },
    sssub_val: {
        type: Number,
        required: true,
    },
    sssub_prazo: {
        type: Number,
        required: true,
    },
    sssub_limite: {
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
subsSSSchema.pre('save', function (next) {
    this.updatedAt = Date.now();
    next();
});

const SubsSS = mongoose.model('SubsSS', subsSSSchema);

export default SubsSS;
