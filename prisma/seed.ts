import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import * as bcrypt from 'bcrypt';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
    const roles = [
        { name: 'oficina', description: 'Oficina autorizada a registar serviços' },
        { name: 'comprador', description: 'Utilizador que consulta histórico de viaturas' },
        { name: 'admin', description: 'Administrador com acesso total ao sistema' },
        { name: 'mecanico', description: 'Mecânico da oficina autorizado a registar serviços' },
    ];

    const db = prisma as any;
    const roleIds: Record<string, number> = {};
    for (const role of roles) {
        const result = await db.role.upsert({
            where: { name: role.name },
            update: {},
            create: role,
        });
        roleIds[role.name] = result.id;
    }

    console.log('Roles criadas: oficina, comprador, admin, mecanico');

    const adminEmail = process.env.ADMIN_EMAIL ?? 'admin@mozcarhistory.co.mz';
    const adminPassword = process.env.ADMIN_PASSWORD ?? 'Admin@1234';

    await prisma.user.upsert({
        where: { email: adminEmail },
        update: {},
        create: {
            email: adminEmail,
            name: 'Administrador',
            password: await bcrypt.hash(adminPassword, 10),
            roleId: roleIds['admin'],
        },
    });

    console.log(`Admin criado: ${adminEmail}`);
}

main()
    .catch((e) => { console.error(e); process.exit(1); })
    .finally(() => prisma.$disconnect());
