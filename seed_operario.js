const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function main() {
  const hashedPassword = await bcrypt.hash('123456', 10);

  const existing = await prisma.usuario.findUnique({
    where: { correo: 'operario@elcumbe.com' }
  });

  if (existing) {
    console.log('El operario ya existe.');
    return;
  }

  const personaOperario = await prisma.persona.create({
    data: {
      nombres: 'José',
      apellidos: 'Ramírez',
      dni: '76543210',
      telefono: '912345678',
      usuario: {
        create: {
          correo: 'operario@elcumbe.com',
          contrasena: hashedPassword,
          rol: 'operario',
        }
      }
    }
  });

  console.log('Operario creado con éxito:', personaOperario);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
