// prisma/seed.ts
import { PrismaClient, CardRarity, PokemonType, CaseTier, TransactionType } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

const cards = [
  // Legendary Cards
  { name: 'Charizard VMAX', rarity: CardRarity.LEGENDARY, value: 120, pokemonType: PokemonType.FIRE, setName: 'Champion\'s Path', imageUrl: '/cards/charizard-vmax.png' },
  { name: 'Mewtwo V-UNION', rarity: CardRarity.LEGENDARY, value: 95, pokemonType: PokemonType.PSYCHIC, setName: 'Celebrations', imageUrl: '/cards/mewtwo-v-union.png' },
  { name: 'Lugia V Alt Art', rarity: CardRarity.LEGENDARY, value: 150, pokemonType: PokemonType.FLYING, setName: 'Silver Tempest', imageUrl: '/cards/lugia-v.png' },
  { name: 'Umbreon VMAX Alt', rarity: CardRarity.LEGENDARY, value: 200, pokemonType: PokemonType.DARK, setName: 'Evolving Skies', imageUrl: '/cards/umbreon-vmax.png' },

  // Epic Cards
  { name: 'Pikachu VMAX', rarity: CardRarity.EPIC, value: 45, pokemonType: PokemonType.ELECTRIC, setName: 'Vivid Voltage', imageUrl: '/cards/pikachu-vmax.png' },
  { name: 'Gengar VMAX', rarity: CardRarity.EPIC, value: 38, pokemonType: PokemonType.GHOST, setName: 'Fusion Strike', imageUrl: '/cards/gengar-vmax.png' },
  { name: 'Sylveon VMAX', rarity: CardRarity.EPIC, value: 42, pokemonType: PokemonType.FAIRY, setName: 'Evolving Skies', imageUrl: '/cards/sylveon-vmax.png' },
  { name: 'Rayquaza VMAX', rarity: CardRarity.EPIC, value: 55, pokemonType: PokemonType.DRAGON, setName: 'Evolving Skies', imageUrl: '/cards/rayquaza-vmax.png' },
  { name: 'Blastoise VMAX', rarity: CardRarity.EPIC, value: 35, pokemonType: PokemonType.WATER, setName: 'Battle Styles', imageUrl: '/cards/blastoise-vmax.png' },

  // Rare Cards
  { name: 'Charizard V', rarity: CardRarity.RARE, value: 18, pokemonType: PokemonType.FIRE, setName: 'Champion\'s Path', imageUrl: '/cards/charizard-v.png' },
  { name: 'Pikachu V', rarity: CardRarity.RARE, value: 12, pokemonType: PokemonType.ELECTRIC, setName: 'Vivid Voltage', imageUrl: '/cards/pikachu-v.png' },
  { name: 'Eevee V', rarity: CardRarity.RARE, value: 10, pokemonType: PokemonType.NORMAL, setName: 'Evolving Skies', imageUrl: '/cards/eevee-v.png' },
  { name: 'Mewtwo V', rarity: CardRarity.RARE, value: 15, pokemonType: PokemonType.PSYCHIC, setName: 'Sword & Shield', imageUrl: '/cards/mewtwo-v.png' },
  { name: 'Dragonite V', rarity: CardRarity.RARE, value: 14, pokemonType: PokemonType.DRAGON, setName: 'Evolving Skies', imageUrl: '/cards/dragonite-v.png' },

  // Uncommon Cards
  { name: 'Bulbasaur Holo', rarity: CardRarity.UNCOMMON, value: 4, pokemonType: PokemonType.GRASS, setName: 'Celebrations', imageUrl: '/cards/bulbasaur-holo.png' },
  { name: 'Squirtle Holo', rarity: CardRarity.UNCOMMON, value: 4, pokemonType: PokemonType.WATER, setName: 'Celebrations', imageUrl: '/cards/squirtle-holo.png' },
  { name: 'Charmander Holo', rarity: CardRarity.UNCOMMON, value: 5, pokemonType: PokemonType.FIRE, setName: 'Celebrations', imageUrl: '/cards/charmander-holo.png' },
  { name: 'Jigglypuff Holo', rarity: CardRarity.UNCOMMON, value: 3, pokemonType: PokemonType.FAIRY, setName: 'Base Set', imageUrl: '/cards/jigglypuff-holo.png' },
  { name: 'Snorlax Holo', rarity: CardRarity.UNCOMMON, value: 4, pokemonType: PokemonType.NORMAL, setName: 'Base Set', imageUrl: '/cards/snorlax-holo.png' },

  // Common Cards
  { name: 'Pidgey', rarity: CardRarity.COMMON, value: 0.5, pokemonType: PokemonType.FLYING, setName: 'Base Set', imageUrl: '/cards/pidgey.png' },
  { name: 'Rattata', rarity: CardRarity.COMMON, value: 0.5, pokemonType: PokemonType.NORMAL, setName: 'Base Set', imageUrl: '/cards/rattata.png' },
  { name: 'Caterpie', rarity: CardRarity.COMMON, value: 0.5, pokemonType: PokemonType.BUG, setName: 'Base Set', imageUrl: '/cards/caterpie.png' },
  { name: 'Weedle', rarity: CardRarity.COMMON, value: 0.5, pokemonType: PokemonType.BUG, setName: 'Base Set', imageUrl: '/cards/weedle.png' },
  { name: 'Magikarp', rarity: CardRarity.COMMON, value: 0.75, pokemonType: PokemonType.WATER, setName: 'Base Set', imageUrl: '/cards/magikarp.png' },
]

async function main() {
  console.log('🌱 Seeding database...')

  // Create admin user
  const adminPassword = await bcrypt.hash('admin123', 10)
  const admin = await prisma.user.upsert({
    where: { email: 'admin@tcgroll.com' },
    update: {},
    create: {
      email: 'admin@tcgroll.com',
      name: 'Admin',
      password: adminPassword,
      role: 'ADMIN',
      balance: 1000,
    },
  })
  console.log('✅ Admin user created:', admin.email)

  // Create test user
  const userPassword = await bcrypt.hash('user123', 10)
  const testUser = await prisma.user.upsert({
    where: { email: 'test@tcgroll.com' },
    update: {},
    create: {
      email: 'test@tcgroll.com',
      name: 'Ash Ketchum',
      password: userPassword,
      balance: 100,
    },
  })
  console.log('✅ Test user created:', testUser.email)

  // Create cards
  const createdCards = []
  for (const card of cards) {
    const created = await prisma.card.upsert({
      where: { id: card.name.toLowerCase().replace(/\s+/g, '-') },
      update: card,
      create: { id: card.name.toLowerCase().replace(/\s+/g, '-'), ...card },
    })
    createdCards.push(created)
  }
  console.log(`✅ ${createdCards.length} cards created`)

  // Create card cases
  const cases = [
    {
      name: 'Starter Pack',
      slug: 'starter-pack',
      description: 'Perfect for beginners. Common and uncommon cards with a chance at rare pulls.',
      price: 2.99,
      tier: CaseTier.STARTER,
      featured: false,
      cardCount: 5,
      imageUrl: '/cases/starter.png',
    },
    {
      name: 'Classic Collection',
      slug: 'classic-collection',
      description: 'Base set classics with balanced drop rates. Great value for any collector.',
      price: 4.99,
      tier: CaseTier.STANDARD,
      featured: true,
      cardCount: 5,
      imageUrl: '/cases/classic.png',
    },
    {
      name: 'V-Star Showdown',
      slug: 'v-star-showdown',
      description: 'High chance at V and VMAX cards. Guaranteed rare or better.',
      price: 9.99,
      tier: CaseTier.PREMIUM,
      featured: true,
      cardCount: 5,
      imageUrl: '/cases/vstar.png',
    },
    {
      name: 'Elite Trainer Box',
      slug: 'elite-trainer-box',
      description: 'Premium pulls with elevated epic chances. For serious collectors only.',
      price: 19.99,
      tier: CaseTier.ELITE,
      featured: true,
      cardCount: 10,
      imageUrl: '/cases/elite.png',
    },
    {
      name: 'Legendary Vault',
      slug: 'legendary-vault',
      description: 'Maximum rarity. Guaranteed epic or legendary in every opening. Top-tier alternative art cards.',
      price: 49.99,
      tier: CaseTier.LEGENDARY,
      featured: true,
      cardCount: 10,
      imageUrl: '/cases/legendary.png',
    },
  ]

  // Drop rate configurations per case tier
  const dropRateConfigs: Record<string, Record<string, number>> = {
    'starter-pack': {
      COMMON: 60, UNCOMMON: 30, RARE: 8, EPIC: 1.5, LEGENDARY: 0.5
    },
    'classic-collection': {
      COMMON: 45, UNCOMMON: 35, RARE: 15, EPIC: 4, LEGENDARY: 1
    },
    'v-star-showdown': {
      COMMON: 20, UNCOMMON: 30, RARE: 35, EPIC: 12, LEGENDARY: 3
    },
    'elite-trainer-box': {
      COMMON: 10, UNCOMMON: 20, RARE: 40, EPIC: 22, LEGENDARY: 8
    },
    'legendary-vault': {
      COMMON: 0, UNCOMMON: 5, RARE: 25, EPIC: 45, LEGENDARY: 25
    },
  }

  for (const caseData of cases) {
    const createdCase = await prisma.cardCase.upsert({
      where: { slug: caseData.slug },
      update: caseData,
      create: caseData,
    })

    // Delete existing case cards and recreate
    await prisma.caseCard.deleteMany({ where: { caseId: createdCase.id } })

    const config = dropRateConfigs[caseData.slug]
    const cardsByRarity = {
      COMMON: createdCards.filter(c => c.rarity === 'COMMON'),
      UNCOMMON: createdCards.filter(c => c.rarity === 'UNCOMMON'),
      RARE: createdCards.filter(c => c.rarity === 'RARE'),
      EPIC: createdCards.filter(c => c.rarity === 'EPIC'),
      LEGENDARY: createdCards.filter(c => c.rarity === 'LEGENDARY'),
    }

    for (const [rarity, totalRate] of Object.entries(config)) {
      const cards = cardsByRarity[rarity as keyof typeof cardsByRarity]
      if (cards.length === 0) continue
      const ratePerCard = totalRate / cards.length

      for (const card of cards) {
        await prisma.caseCard.create({
          data: {
            caseId: createdCase.id,
            cardId: card.id,
            dropRate: ratePerCard,
          },
        })
      }
    }
    console.log(`✅ Case "${caseData.name}" created with drop rates`)
  }

  // Give test user some cards
  const commonCards = createdCards.filter(c => c.rarity === 'COMMON').slice(0, 3)
  const uncommonCards = createdCards.filter(c => c.rarity === 'UNCOMMON').slice(0, 2)
  const rareCards = createdCards.filter(c => c.rarity === 'RARE').slice(0, 1)

  for (const card of [...commonCards, ...uncommonCards, ...rareCards]) {
    await prisma.userCard.create({
      data: { userId: testUser.id, cardId: card.id }
    })
  }

  // Add sample transaction
  await prisma.transaction.create({
    data: {
      userId: testUser.id,
      amount: 100,
      type: TransactionType.DEPOSIT,
      description: 'Welcome bonus',
    }
  })

  console.log('✅ Test user cards and transactions created')
  console.log('🎉 Seeding complete!')
  console.log('\n📧 Login credentials:')
  console.log('  Admin: admin@tcgroll.com / admin123')
  console.log('  User:  test@tcgroll.com  / user123')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
