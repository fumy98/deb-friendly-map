import { PrismaClient } from '../src/generated/prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const adapter = new PrismaPg({ connectionString: process.env.DIRECT_URL! })
const prisma = new PrismaClient({ adapter })

const categories = [
  { slug: 'narrow_road',      labelJa: '道幅が狭い',           icon: '🚶' },
  { slug: 'narrow_toilet',    labelJa: 'トイレが狭い',         icon: '🚽' },
  { slug: 'narrow_entrance',  labelJa: '入口が狭い',           icon: '🚪' },
  { slug: 'narrow_seat',      labelJa: '席が狭い',             icon: '🪑' },
  { slug: 'step',             labelJa: '段差あり',             icon: '⛔' },
  { slug: 'no_elevator',      labelJa: 'エレベーターなし',     icon: '🛗' },
  { slug: 'no_luggage_space', labelJa: '荷物置き場なし',       icon: '🧺' },
  { slug: 'no_nursing_room',  labelJa: '授乳室・おむつ台なし', icon: '👶' },
]

async function main() {
  console.log('カテゴリを投入中...')
  for (const category of categories) {
    await prisma.category.upsert({
      where: { slug: category.slug },
      update: {},
      create: category,
    })
    console.log(`  ✓ ${category.icon} ${category.labelJa}`)
  }
  console.log('完了！')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
