import { NextRequest, NextResponse } from 'next/server';
import { searchResources } from '@/lib/aws';
import { secureStorage } from '@/lib/storage';

export async function GET(request: NextRequest) {
  console.log('[Search API] Received search request');
  try {
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('q');
    console.log(`[Search API] Search query: ${query}`);

    if (!query) {
      console.log('[Search API] No query provided');
      return NextResponse.json({ error: 'Search query is required' }, { status: 400 });
    }

    // Get stored AWS credentials from cookies
    console.log('[Search API] Retrieving stored AWS credentials');
    const credentialsCookie = request.cookies.get('awsCredentials');
    
    if (!credentialsCookie) {
      console.log('[Search API] No stored credentials found');
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    console.log('[Search API] Found stored credentials');
    const credentials = JSON.parse(credentialsCookie.value);
    console.log(`[Search API] Searching resources in region: ${credentials.region}`);
    
    const results = await searchResources(credentials, query);
    console.log(`[Search API] Found ${results.length} matching resources`);

    return NextResponse.json(results);
  } catch (error) {
    console.error('[Search API] Error during search:', error);
    return NextResponse.json(
      { error: 'Failed to search AWS resources' },
      { status: 500 }
    );
  }
} 