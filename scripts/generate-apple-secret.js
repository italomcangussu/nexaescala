import jwt from 'jsonwebtoken';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// --- CONFIGURAÇÃO ---
// Preencha estas informações ou passe como variáveis de ambiente
const TEAM_ID = process.env.APPLE_TEAM_ID || 'SEU_TEAM_ID';
const KEY_ID = process.env.APPLE_KEY_ID || 'C33388Y2SR'; // ID extraído do nome do arquivo
const CLIENT_ID = process.env.APPLE_CLIENT_ID || 'com.nexaescala.app';
const KEY_FILE_PATH = process.env.APPLE_KEY_PATH || './AuthKey_C33388Y2SR.p8'; // Nome do arquivo inferido

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const generateSecret = () => {
    try {
        // Resolve o caminho do arquivo de chave
        const keyPath = path.resolve(process.cwd(), KEY_FILE_PATH);

        if (!fs.existsSync(keyPath) && !process.env.APPLE_PRIVATE_KEY) {
            console.error(`\u001b[31mErro: Arquivo de chave não encontrado em: ${keyPath}\u001b[0m`);
            console.log('Certifique-se de baixar o arquivo .p8 do Apple Developer Console e colocá-lo na raiz do projeto ou ajustar o caminho.');
            process.exit(1);
        }

        const privateKey = process.env.APPLE_PRIVATE_KEY
            ? process.env.APPLE_PRIVATE_KEY.replace(/\\n/g, '\n')
            : fs.readFileSync(keyPath, 'utf8');

        const headers = {
            alg: 'ES256',
            kid: KEY_ID,
            typ: undefined // Explicitly undefined as per Apple docs sometimes, but defaults usually work. 'JWT' is standard.
        };

        const claims = {
            iss: TEAM_ID,
            iat: Math.floor(Date.now() / 1000),
            exp: Math.floor(Date.now() / 1000) + (86400 * 180), // 180 dias (6 meses) - Máximo permitido pela Apple
            aud: 'https://appleid.apple.com',
            sub: CLIENT_ID,
        };

        const token = jwt.sign(claims, privateKey, {
            algorithm: 'ES256',
            header: headers,
        });

        console.log('\n\u001b[32m✅ Apple Client Secret Gerado com Sucesso!\u001b[0m');
        console.log('---------------------------------------------------');
        console.log(token);
        console.log('---------------------------------------------------');
        console.log('\u001b[33mEste token é válido por 6 meses (180 dias).\u001b[0m');
        console.log('Copie e cole este token no campo "Secret Key" no painel do Supabase -> Authentication -> Providers -> Apple.');

    } catch (error) {
        console.error('\n\u001b[31mErro ao gerar o secret:\u001b[0m', error.message);
    }
};

generateSecret();
