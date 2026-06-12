import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

async function main() {
    try {
        console.log('Reading SQL file...');
        const sql = fs.readFileSync(path.join(__dirname, 'gst_recon.sql'), 'utf-8');
        
        console.log('Executing Raw SQL...');
        // Execute multiple statements
        const statements = sql.split(';').filter(s => s.trim().length > 0);
        for (const statement of statements) {
            console.log('Executing:', statement.substring(0, 50) + '...');
            await prisma.$executeRawUnsafe(statement + ';');
        }
        
        console.log('Migration completed successfully.');
    } catch (e) {
        console.error('Migration failed:', e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
