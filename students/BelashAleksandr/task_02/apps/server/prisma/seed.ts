import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting database seeding...');

  // Create users
  const adminPassword = await bcrypt.hash(process.env.ADMIN_PASSWORD || 'admin123', 10);
  const userPassword = await bcrypt.hash('user123', 10);
  const moderatorPassword = await bcrypt.hash('moderator123', 10);

  const admin = await prisma.user.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      username: 'admin',
      passwordHash: adminPassword,
      role: 'admin',
    },
  });

  const moderator = await prisma.user.upsert({
    where: { username: 'moderator' },
    update: {},
    create: {
      username: 'moderator',
      passwordHash: moderatorPassword,
      role: 'moderator',
    },
  });

  const user = await prisma.user.upsert({
    where: { username: 'user' },
    update: {},
    create: {
      username: 'user',
      passwordHash: userPassword,
      role: 'user',
    },
  });

  console.log('Users created:', { admin, moderator, user });

  // Create sources
  const sources = await Promise.all([
    prisma.source.upsert({
      where: { id: '00000000-0000-0000-0000-000000000001' },
      update: {},
      create: {
        id: '00000000-0000-0000-0000-000000000001',
        name: 'TechCrunch',
        url: 'https://techcrunch.com',
        description: 'Technology news and analysis',
      },
    }),
    prisma.source.upsert({
      where: { id: '00000000-0000-0000-0000-000000000002' },
      update: {},
      create: {
        id: '00000000-0000-0000-0000-000000000002',
        name: 'BBC News',
        url: 'https://bbc.com/news',
        description: 'World news and current affairs',
      },
    }),
    prisma.source.upsert({
      where: { id: '00000000-0000-0000-0000-000000000003' },
      update: {},
      create: {
        id: '00000000-0000-0000-0000-000000000003',
        name: 'Reuters',
        url: 'https://reuters.com',
        description: 'International news organization',
      },
    }),
  ]);

  console.log('Sources created:', sources.length);

  // Create tags
  const tags = await Promise.all([
    prisma.tag.upsert({
      where: { name: 'Technology' },
      update: {},
      create: { name: 'Technology' },
    }),
    prisma.tag.upsert({
      where: { name: 'Politics' },
      update: {},
      create: { name: 'Politics' },
    }),
    prisma.tag.upsert({
      where: { name: 'Business' },
      update: {},
      create: { name: 'Business' },
    }),
    prisma.tag.upsert({
      where: { name: 'Science' },
      update: {},
      create: { name: 'Science' },
    }),
    prisma.tag.upsert({
      where: { name: 'Health' },
      update: {},
      create: { name: 'Health' },
    }),
    prisma.tag.upsert({
      where: { name: 'Sports' },
      update: {},
      create: { name: 'Sports' },
    }),
  ]);

  console.log('Tags created:', tags.length);

  // Create articles
  const articles = await Promise.all([
    prisma.article.create({
      data: {
        title: 'AI Revolution: The Future of Technology',
        content: 'Artificial Intelligence is transforming industries across the globe...',
        url: 'https://techcrunch.com/ai-revolution',
        publishedAt: new Date('2024-01-15'),
        sourceId: sources[0].id,
        tags: {
          create: [
            { tagId: tags[0].id },
            { tagId: tags[3].id },
          ],
        },
      },
    }),
    prisma.article.create({
      data: {
        title: 'Global Climate Summit Reaches Agreement',
        content: 'World leaders have reached a historic agreement on climate change...',
        url: 'https://bbc.com/climate-summit',
        publishedAt: new Date('2024-01-14'),
        sourceId: sources[1].id,
        tags: {
          create: [
            { tagId: tags[1].id },
            { tagId: tags[3].id },
          ],
        },
      },
    }),
    prisma.article.create({
      data: {
        title: 'Stock Markets Hit Record Highs',
        content: 'Major stock indices reached all-time highs today...',
        url: 'https://reuters.com/markets',
        publishedAt: new Date('2024-01-13'),
        sourceId: sources[2].id,
        tags: {
          create: [
            { tagId: tags[2].id },
          ],
        },
      },
    }),
    prisma.article.create({
      data: {
        title: 'New Breakthrough in Cancer Research',
        content: 'Scientists have discovered a promising new treatment for cancer...',
        url: 'https://bbc.com/health',
        publishedAt: new Date('2024-01-12'),
        sourceId: sources[1].id,
        tags: {
          create: [
            { tagId: tags[3].id },
            { tagId: tags[4].id },
          ],
        },
      },
    }),
    prisma.article.create({
      data: {
        title: 'Tech Giants Announce Major Partnership',
        content: 'Leading technology companies are joining forces for a new initiative...',
        url: 'https://techcrunch.com/partnership',
        publishedAt: new Date('2024-01-11'),
        sourceId: sources[0].id,
        tags: {
          create: [
            { tagId: tags[0].id },
            { tagId: tags[2].id },
          ],
        },
      },
    }),
  ]);

  console.log('Articles created:', articles.length);

  console.log('Database seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
