import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function main() {
  const contrasenaPlana = "123456";
  const hashedPassword = await bcrypt.hash(contrasenaPlana, 10);

  console.log("🚀 Iniciando creación de cuentas (Conductor, Operario, Vendedor)...");

  // 1. CONDUCTOR
  const dniConductor = "88888881";
  const correoConductor = "conductor@elcumbe.com";
  
  const personaConductorExistente = await prisma.persona.findUnique({ where: { dni: dniConductor } });
  const usuarioConductorExistente = await prisma.usuario.findUnique({ where: { correo: correoConductor } });

  if (!personaConductorExistente && !usuarioConductorExistente) {
    const conductor = await prisma.persona.create({
      data: {
        nombres: "JUAN CONDUCTOR",
        apellidos: "PEREZ DIAZ",
        dni: dniConductor,
        telefono: "911111111",
        usuario: {
          create: {
            correo: correoConductor,
            contrasena: hashedPassword,
            rol: "conductor",
          }
        }
      }
    });
    console.log("✅ Conductor creado con éxito:", correoConductor);
  } else {
    // Si ya existe, forzar el reset de su contraseña y rol
    await prisma.usuario.update({
      where: { correo: correoConductor },
      data: { contrasena: hashedPassword, rol: "conductor" }
    });
    console.log("🔄 Conductor existente actualizado con contraseña '123456':", correoConductor);
  }

  // 2. OPERARIO
  const dniOperario = "88888882";
  const correoOperario = "operario@elcumbe.com";

  const personaOperarioExistente = await prisma.persona.findUnique({ where: { dni: dniOperario } });
  const usuarioOperarioExistente = await prisma.usuario.findUnique({ where: { correo: correoOperario } });

  if (!personaOperarioExistente && !usuarioOperarioExistente) {
    const operario = await prisma.persona.create({
      data: {
        nombres: "MARCOS OPERARIO",
        apellidos: "RODRIGUEZ GOMEZ",
        dni: dniOperario,
        telefono: "922222222",
        usuario: {
          create: {
            correo: correoOperario,
            contrasena: hashedPassword,
            rol: "operario",
          }
        }
      }
    });
    console.log("✅ Operario creado con éxito:", correoOperario);
  } else {
    // Si ya existe, forzar el reset de su contraseña y rol
    await prisma.usuario.update({
      where: { correo: correoOperario },
      data: { contrasena: hashedPassword, rol: "operario" }
    });
    console.log("🔄 Operario existente actualizado con contraseña '123456':", correoOperario);
  }

  // 3. VENDEDOR
  const dniVendedor = "88888883";
  const correoVendedor = "vendedor@elcumbe.com";

  const personaVendedorExistente = await prisma.persona.findUnique({ where: { dni: dniVendedor } });
  const usuarioVendedorExistente = await prisma.usuario.findUnique({ where: { correo: correoVendedor } });

  if (!personaVendedorExistente && !usuarioVendedorExistente) {
    const vendedor = await prisma.persona.create({
      data: {
        nombres: "ANA VENDEDORA",
        apellidos: "SALAS LOPEZ",
        dni: dniVendedor,
        telefono: "933333333",
        usuario: {
          create: {
            correo: correoVendedor,
            contrasena: hashedPassword,
            rol: "vendedor",
          }
        }
      }
    });
    console.log("✅ Vendedor creado con éxito:", correoVendedor);
  } else {
    // Si ya existe, forzar el reset de su contraseña y rol
    await prisma.usuario.update({
      where: { correo: correoVendedor },
      data: { contrasena: hashedPassword, rol: "vendedor" }
    });
    console.log("🔄 Vendedor existente actualizado con contraseña '123456':", correoVendedor);
  }

  console.log("\n🎉 Proceso finalizado. Credenciales comunes:");
  console.log("🔑 Contraseña para todos:", contrasenaPlana);
}

main()
  .catch((e) => {
    console.error("❌ Error durante la siembra de roles:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
