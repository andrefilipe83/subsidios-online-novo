import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
// Importações de rotas (mantenha as mesmas)
import sociosRoute from './routes/sociosRoute.js';
import adseRoute from './routes/adseRoute.js';
import compartSSRoute from './routes/compartSSRoute.js';
import subsSSRoute from './routes/subsSSRoute.js';
import processamentoRoute from './routes/processamentoRoute.js';
import pagamentoRoute from './routes/pagamentoRoute.js';
import sepaRoute from './routes/sepaRoute.js';
import relatorioRoute from './routes/relatorioRoute.js';

// Configurações
const app = express();
const PORT = process.env.PORT || 5555;
const MONGO_URI = process.env.MONGO_URI || 'mongodb+srv://andrefilipe83:ACBIm325lA1PXvWf@projeto.imes1yp.mongodb.net/?retryWrites=true&w=majority&appName=projeto';

// Middleware
app.use(express.json());

// Configuração do CORS
app.use(cors({
  origin: 'https://dev.andrealface.com',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Rota raiz
app.get('/', (request, response) => {
    return response.status(200).send('Hello World');
});

// Rotas (mantenha as mesmas)
app.use('/socios', sociosRoute);
app.use('/adse', adseRoute);
app.use('/compartss', compartSSRoute);
app.use('/subsss', subsSSRoute);
app.use('/processamento', processamentoRoute);
app.use('/pagamento', pagamentoRoute);
app.use('/', sepaRoute);
app.use('/relatorio', relatorioRoute);

// Conexão com o banco de dados e inicialização do servidor
mongoose
    .connect(MONGO_URI)
    .then(() => {
        console.log('Database connected');
        app.listen(PORT, () => {
            console.log(`Server is running on port ${PORT}`);
        });
    })
    .catch((error) => {
        console.log('Error connecting to database:', error.message);
    });

export default app;