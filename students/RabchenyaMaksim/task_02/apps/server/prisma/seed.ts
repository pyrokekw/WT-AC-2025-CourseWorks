import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'  // ← для хэширования пароля

const prisma = new PrismaClient()

async function main() {
  // Добавляем категории
  const categories = [
    'Яма на дороге',
    'Мусорная свалка',
    'Отсутствует освещение',
    'Повреждённый тротуар',
    'Другое',
    'Аварийное дерево',
    'Затопление',
    'Разбитый фонарь'
  ]

  for (const name of categories) {
    await prisma.category.upsert({
      where: { name },
      update: {},
      create: { name }
    })
  }

  console.log('Категории успешно добавлены!')

  // Добавляем админа
  const adminEmail = 'admin@admin.com'
  const adminPassword = 'admin123'

  const hashedPassword = await bcrypt.hash(adminPassword, 10)

  await prisma.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      email: adminEmail,
      password: hashedPassword,
      name: 'Админ',
      role: 'ADMIN'
    }
  })

  console.log('Администратор успешно добавлен!')
  console.log(`Email: ${adminEmail}`)
  console.log(`Пароль: ${adminPassword}`)
}

main()
  .catch((e) => {
    console.error('Ошибка в seed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })