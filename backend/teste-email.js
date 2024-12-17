import nodemailer from 'nodemailer';

async function testeEnvioEmail() {
    try {
        console.log("Iniciando teste de envio de email...");

        // Configurar o transporte SMTP
        let transporter = nodemailer.createTransport({
            host: "mail.andrealface.com", // Servidor SMTP fornecido
            port: 465, // Porta SSL/TLS
            secure: true, // true para SSL/TLS
            auth: {
                user: "teste@andrealface.com", // Utilizador SMTP
                pass: "Teste987!12!" // Palavra-passe SMTP
            },
            tls: {
                rejectUnauthorized: false // Ignorar validação de certificado
            }
        });

        // Configurar o email
        let info = await transporter.sendMail({
            from: '"Teste de Email" <teste@andrealface.com>',
            to: "theprodigy83@gmail.com", // Substituir pelo teu email real
            subject: "Teste de Envio de Email",
            html: `
                <h1>Teste de Email</h1>
                <p>Este é um teste simples para verificar o envio de emails usando nodemailer.</p>
            `
        });

        console.log("Email enviado com sucesso! ID:", info.messageId);
    } catch (error) {
        console.error("Erro ao enviar email:", error.message);
    }
}

testeEnvioEmail();
