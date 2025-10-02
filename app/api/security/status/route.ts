import { NextResponse } from 'next/server'
import { GET_SECURITY_STATUS } from '@/lib/api-security'

export async function GET() {
  try {
    return await GET_SECURITY_STATUS()
  } catch (error) {
    console.error('Error getting security status:', error)
    return NextResponse.json(
      { error: 'Failed to get security status' },
      { status: 500 }
    )
  }
}
