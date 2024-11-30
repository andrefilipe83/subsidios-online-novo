import mongoose from 'mongoose';
const { Schema } = mongoose;

const agregadoSchema = new Schema({
    name: {
        type: String,
        required: true,
    },
    birthday: {
        type: Date,
        required: true,
    },
    status: {
        type: String,
        enum: ['Ativo', 'Não Ativo'],
        default: 'Ativo',
    },
    type: {
        type: String,
        enum: ['Cônjuge', 'Descendente'],
        required: true,
    },
    contribuinte: { 
        type: String,
        required: false,
    },
    health_system: { 
        type: String,
        enum: ['ADSE', 'Seg. Social'],
        default: 'Seg. Social',
        required: false,
    },
});

const socioSchema = new Schema({
    name: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: false, //não pode ser obrigatório porque há sócios que não têm
        unique: false, //o mesmo email pode servir para mais do que um sócio
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
    entidade: {
        type: String,
        enum: ['Câmara Municipal', 'JF Cabrela', 'JF Ciborro', 'JF Cortiçadas de Lavre e Lavre', 'JF Foros de Vale de Figueira', 'JF NS Vila, NS Bispo e Silveiras', 'JF Santiago do Escoural', 'JF São Cristóvão', 'Serviços Sociais'],
        default: 'Câmara Municipal',
        required: false, //depois temos de tornar obrigatório mais para a frente
    },
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
    agregado: {
        type: [agregadoSchema],
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
