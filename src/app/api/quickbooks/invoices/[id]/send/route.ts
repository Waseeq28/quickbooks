import { NextRequest, NextResponse } from 'next/server';
import { qbService } from '@/lib/quickbooks';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id: invoiceId } = params;
  const { email } = await request.json();

  if (!email) {
    return NextResponse.json({ success: false, error: 'Email address is required' }, { status: 400 });
  }

  try {
    await qbService.sendInvoiceEmail(invoiceId, email);
    return NextResponse.json({ success: true, message: `Invoice ${invoiceId} sent to ${email}` });
  } catch (error: any) {
    console.error(`Failed to send invoice ${invoiceId}:`, error);
    return NextResponse.json({ success: false, error: error.message || 'Failed to send invoice email' }, { status: 500 });
  }
} 