import express from 'express';
import { PORT, MONGO_URI } from './config.js';
import mongoose from 'mongoose';
import sociosRoute from './routes/sociosRoute.js';
import adseRoute from './routes/adseRoute.js';
import compartSSRoute from './routes/compartSSRoute.js';
import subsSSRoute from './routes/subsSSRoute.js';
import processamentoRoute from './routes/processamentoRoute.js';
import pagamentoRoute from './routes/pagamentoRoute.js';
import sepaRoute from './routes/sepaRoute.js';
import relatorioRoute from './routes/relatorioRoute.js';
import cors from 'cors';

const app = express();

// Middleware para análise de corpos de requisição
app.use(express.json());

// Middleware para permitir CORS
app.use(cors());

app.get('/', (request, response) => {
    return response.status(200).send('Hello World');
});

// Usar a rota para /socios
app.use('/socios', sociosRoute);

// Nova rota específica para pesquisa de sócios com filtros
//app.use('/socios/search', sociosRoute); // Adiciona a nova rota para a pesquisa

// Usar a rota para /adse
app.use('/adse', adseRoute);

// Usar a rota para /compartss
app.use('/compartss', compartSSRoute); 

// Usar a rota para /subsss
app.use('/subsss', subsSSRoute); 

// Usar a rota para /processamento
app.use('/processamento', processamentoRoute);

// Usar a rota para /pagamento
app.use('/pagamento', pagamentoRoute);

// Usar a rota para /sepa
app.use('/', sepaRoute);

// Usar a rota para /relatorio
//app.use('/', relatorioRoute);
app.use('/relatorio', relatorioRoute);

mongoose
    .connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => {
        console.log('Database connected');
        app.listen(PORT, () => {
            console.log(`Server is running on ${PORT}`);
        });
    })
    .catch((error) => {
        console.log('Error connecting to database', error.message);
    });




