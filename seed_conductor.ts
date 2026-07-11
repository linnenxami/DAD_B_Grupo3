import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const hashedPassword = await bcrypt.hash('123456', 10);

  const personaConductor = await prisma.persona.create({
    data: {
      nombres: 'Carlos',
      apellidos: 'Mendoza',
      dni: '87654321',
      telefono: '987654321',
      usuario: {
        create: {
          correo: 'conductor@elcumbe.com',
          contrasena: hashedPassword,
          rol: 'conductor',
        }
      }
    }
  });

  console.log('Conductor creado:', personaConductor);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
