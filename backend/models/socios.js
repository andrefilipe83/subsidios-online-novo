import mongoose from 'mongoose';
const { Schema } = mongoose;

const socioSchema = new Schema({
    name: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
    },
    birthday: {
        type: Date,
        required: true,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
    updatedAt: {
        type: Date,
        default: Date.now,
    },
    status: {
        type: String,
        enum: ['Ativo', 'Não Ativo'],
        default: 'Ativo',
    },
    type: {
        type: String,
        enum: ['Trabalhador', 'Cônjuge', 'Descendente'],
        required: true,
    },
    // effectiveMemberId: { 
    //     type: mongoose.Schema.Types.ObjectId,
    //     default: () => new mongoose.Types.ObjectId() 
    // },
    socio_nr: { 
        type: String,
        required: true,
        unique: true,
    },
    morada1: { 
        type: String,
        required: false,
    },
    morada2: { 
        type: String,
        required: false,
    },
    CP: { 
        type: String,
        required: false,
    },
    localidade: { 
        type: String,
        required: false,
    },
    inscription_date: { 
        type: Date,
        required: false,
    },
    telefone: { 
        type: String,
        required: false,
    },
    contribuinte: { 
        type: String,
        required: false,
    },
    IBAN: { 
        type: String,
        required: false,
    },
    health_system: { 
        type: String,
        enum: ['ADSE', 'Seg. Social'],
        default: 'Seg. Social',
        required: false,
    },
    conta_SNC: { 
        type: String,
        required: false,
    },
});

// Middleware to update the updatedAt field
socioSchema.pre('save', function (next) {
    this.updatedAt = Date.now();
    next();
});

const Socio = mongoose.model('Socio', socioSchema);
export default Socio;
