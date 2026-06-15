import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
    const roles = [
        { name: 'oficina', description: 'Oficina autorizada a registar serviços' },
        { name: 'comprador', description: 'Utilizador que consulta histórico de viaturas' },
        { name: 'admin', description: 'Administrador com acesso total ao sistema' },
    ];

    for (const role of roles) {
        await prisma.role.upsert({
            where: { name: role.name },
            update: {},
            create: role,
        });
    }

    console.log('Roles criadas: oficina, comprador, admin');
}

main()
    .catch((e) => { console.error(e); process.exit(1); })
    .finally(() => prisma.$disconnect());
