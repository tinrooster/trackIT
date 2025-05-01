import { db } from '@/lib/db'

export async function GET() {
  try {
    const assets = await db.asset.findMany({
      include: {
        location: true,
        assignedTo: true,
      },
    })
    return new Response(JSON.stringify({ assets }), {
      headers: {
        'Content-Type': 'application/json',
      },
    })
  } catch (error) {
    console.error('Failed to fetch assets:', error)
    return new Response(JSON.stringify({ error: 'Failed to fetch assets' }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
      },
    })
  }
} 