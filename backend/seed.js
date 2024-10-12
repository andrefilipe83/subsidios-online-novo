import mongoose from 'mongoose';
import Socio from './models/socios.js'; // Certifica-te de que o caminho está correto

// Conectar à base de dados MongoDB
const MONGO_URI = 'mongodb+srv://andrefilipe83:ACBIm325lA1PXvWf@projeto.imes1yp.mongodb.net/?retryWrites=true&w=majority&appName=projeto';

mongoose.connect(MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
}).then(() => {
    console.log('Conectado à base de dados MongoDB');
}).catch((error) => {
    console.error('Erro ao conectar à base de dados MongoDB:', error);
});

// Array de sócios fictícios
const sociosFicticios = [
    {
        name: 'Ana Silva',
        email: 'ana.silva@example.com',
        birthday: new Date('1993-10-10'),
        type: 'Trabalhador',
        status: 'Ativo'
    },
    {
        name: 'João Santos',
        email: 'joao.santos@example.com',
        birthday: new Date('1988-09-09'),
        type: 'Trabalhador',
        status: 'Ativo'
    },
    {
        name: 'Maria Oliveira',
        email: 'maria.oliveira@example.com',
        birthday: new Date('1982-08-08'),
        type: 'Trabalhador',
        status: 'Ativo'
    },
    {
        name: 'Pedro Costa',
        email: 'pedro.costa@example.com',
        birthday: new Date('1975-07-07'),
        type: 'Trabalhador',
        status: 'Ativo'
    },
    {
        name: 'Rita Pereira',
        email: 'rita.pereira@example.com',
        birthday: new Date('2005-06-06'),
        type: 'Descendente',
        status: 'Ativo'
    },
    {
        name: 'Tiago Almeida',
        email: 'tiago.almeida@example.com',
        birthday: new Date('2000-05-05'),
        type: 'Cônjuge',
        status: 'Ativo'
    },
    {
        name: 'Beatriz Rodrigues',
        email: 'beatriz.rodrigues@example.com',
        birthday: new Date('1995-04-04'),
        type: 'Trabalhador',
        status: 'Ativo'
    },
    {
        name: 'Carlos Fernandes',
        email: 'carlos.fernandes@example.com',
        birthday: new Date('1990-03-03'),
        type: 'Trabalhador',
        status: 'Ativo'
    },
    {
        name: 'Sofia Martins',
        email: 'sofia.martins@example.com',
        birthday: new Date('1985-02-02'),
        type: 'Trabalhador',
        status: 'Ativo'
    },
    {
        name: 'Ricardo Lopes',
        email: 'ricardo.lopes@example.com',
        birthday: new Date('1980-01-01'),
        type: 'Trabalhador',
        status: 'Ativo'
    }
];

// Função para inserir os sócios na base de dados
const seedDatabase = async () => {
    try {
        // Limpar a coleção de sócios
        await Socio.deleteMany({});
        console.log('Coleção de sócios limpa');

        // Inserir sócios trabalhadores
        const trabalhadores = sociosFicticios.filter(socio => socio.type === 'Trabalhador');
        const insertedTrabalhadores = await Socio.insertMany(trabalhadores);
        console.log('Sócios trabalhadores inseridos:', insertedTrabalhadores);

        // Obter um sócio trabalhador para usar como effectiveMemberId
        const effectiveMemberId = insertedTrabalhadores[0]._id;

        // Inserir sócios cônjuges e descendentes
        const familiares = sociosFicticios.filter(socio => socio.type !== 'Trabalhador')
                                           .map(socio => ({ ...socio, effectiveMemberId }));

        const insertedFamiliares = await Socio.insertMany(familiares);
        console.log('Sócios familiares inseridos:', insertedFamiliares);

        console.log('Todos os sócios inseridos com sucesso.');
    } catch (error) {
        console.error('Erro ao inserir sócios fictícios:', error);
    } finally {
        mongoose.connection.close();
    }
};

// Executar a função de seed
seedDatabase();
