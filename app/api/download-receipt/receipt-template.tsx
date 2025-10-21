import React from 'react';
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';

// Create styles
const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 11,
    fontFamily: 'Helvetica',
  },
  header: {
    marginBottom: 30,
    textAlign: 'center',
  },
  companyName: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 5,
    color: '#000000',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 10,
    color: '#059669',
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#374151',
    borderBottom: '1pt solid #E5E7EB',
    paddingBottom: 5,
  },
  row: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  label: {
    width: '40%',
    fontSize: 10,
    color: '#6B7280',
  },
  value: {
    width: '60%',
    fontSize: 10,
    color: '#111827',
    fontWeight: 'bold',
  },
  amountSection: {
    backgroundColor: '#F3F4F6',
    padding: 15,
    borderRadius: 4,
    marginBottom: 20,
  },
  amountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  amountLabel: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: 'bold',
  },
  amountValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#059669',
  },
  statusBadge: {
    backgroundColor: '#059669',
    color: '#FFFFFF',
    padding: '4pt 12pt',
    borderRadius: 4,
    fontSize: 10,
    fontWeight: 'bold',
    alignSelf: 'flex-start',
    marginBottom: 10,
  },
  footer: {
    marginTop: 30,
    paddingTop: 20,
    borderTop: '1pt solid #E5E7EB',
    textAlign: 'center',
  },
  footerText: {
    fontSize: 9,
    color: '#6B7280',
    marginBottom: 3,
  },
  divider: {
    borderBottom: '1pt solid #E5E7EB',
    marginVertical: 15,
  },
});

interface ReceiptData {
  paymentIntentId: string;
  chargeId: string | null;
  receiptNumber: string | null;
  amount: number;
  currency: string;
  status: string;
  created: number;
  description: string;
  customerName: string;
  customerEmail: string;
  customerAddress: {
    line1: string;
    line2: string;
    city: string;
    state: string;
    postal_code: string;
    country: string;
  } | null;
  metadata: Record<string, string>;
}

interface ReceiptDocumentProps {
  data: ReceiptData;
}

const ReceiptDocument: React.FC<ReceiptDocumentProps> = ({ data }) => {
  const formatAmount = (cents: number, currencyCode: string) => {
    const amount = (cents / 100).toFixed(2);
    
    const currencySymbols: Record<string, string> = {
      usd: '$',
      eur: '€',
      gbp: '£',
      jpy: '¥',
      cad: 'CA$',
      aud: 'A$',
      chf: 'CHF',
      cny: '¥',
      inr: '₹',
      brl: 'R$',
      mxn: 'MX$',
      krw: '₩',
      sgd: 'S$',
      nzd: 'NZ$',
      sek: 'kr',
      nok: 'kr',
      dkk: 'kr',
      pln: 'zł',
      czk: 'Kč',
      huf: 'Ft',
      rub: '₽',
      try: '₺',
      zar: 'R',
      aed: 'د.إ',
      sar: '﷼',
      thb: '฿',
      myr: 'RM',
      php: '₱',
      idr: 'Rp',
      vnd: '₫',
      pkr: '₨',
    };
    
    const symbol = currencySymbols[currencyCode.toLowerCase()] || currencyCode.toUpperCase();
    return `${symbol}${amount}`;
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp * 1000);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatAddress = (address: ReceiptData['customerAddress']) => {
    if (!address) return 'N/A';
    const parts = [
      address.line1,
      address.line2,
      address.city,
      address.state,
      address.postal_code,
      address.country,
    ].filter(Boolean);
    return parts.length > 0 ? parts.join(', ') : 'N/A';
  };

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.companyName}>DUBSEA</Text>
          <Text style={styles.title}>PAYMENT RECEIPT</Text>
        </View>

        {/* Payment Status */}
        <View style={styles.section}>
          <Text style={styles.statusBadge}>✓ {data.status.toUpperCase()}</Text>
        </View>

        {/* Amount Section */}
        <View style={styles.amountSection}>
          <View style={styles.amountRow}>
            <Text style={styles.amountLabel}>Amount Paid:</Text>
            <Text style={styles.amountValue}>
              {formatAmount(data.amount, data.currency)}
            </Text>
          </View>
        </View>

        {/* Payment Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Payment Details</Text>
          
          <View style={styles.row}>
            <Text style={styles.label}>Payment Date:</Text>
            <Text style={styles.value}>{formatDate(data.created)}</Text>
          </View>

          <View style={styles.row}>
            <Text style={styles.label}>Currency:</Text>
            <Text style={styles.value}>{data.currency.toUpperCase()}</Text>
          </View>

          <View style={styles.row}>
            <Text style={styles.label}>Description:</Text>
            <Text style={styles.value}>{data.description}</Text>
          </View>

          {data.receiptNumber && (
            <View style={styles.row}>
              <Text style={styles.label}>Receipt Number:</Text>
              <Text style={styles.value}>{data.receiptNumber}</Text>
            </View>
          )}

          <View style={styles.row}>
            <Text style={styles.label}>Transaction ID:</Text>
            <Text style={styles.value}>{data.paymentIntentId}</Text>
          </View>

          {data.chargeId && (
            <View style={styles.row}>
              <Text style={styles.label}>Charge ID:</Text>
              <Text style={styles.value}>{data.chargeId}</Text>
            </View>
          )}
        </View>

        {/* Customer Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Customer Information</Text>
          
          <View style={styles.row}>
            <Text style={styles.label}>Name:</Text>
            <Text style={styles.value}>{data.customerName}</Text>
          </View>

          <View style={styles.row}>
            <Text style={styles.label}>Email:</Text>
            <Text style={styles.value}>{data.customerEmail}</Text>
          </View>

          <View style={styles.row}>
            <Text style={styles.label}>Billing Address:</Text>
            <Text style={styles.value}>{formatAddress(data.customerAddress)}</Text>
          </View>
        </View>

        {/* Additional Information from Metadata */}
        {data.metadata.base_amount && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Fee Breakdown</Text>
            
            <View style={styles.row}>
              <Text style={styles.label}>Base Amount:</Text>
              <Text style={styles.value}>
                {formatAmount(parseInt(data.metadata.base_amount), data.currency)}
              </Text>
            </View>

            {data.metadata.processing_fee && parseInt(data.metadata.processing_fee) > 0 && (
              <View style={styles.row}>
                <Text style={styles.label}>Processing Fee (3%):</Text>
                <Text style={styles.value}>
                  {formatAmount(parseInt(data.metadata.processing_fee), data.currency)}
                </Text>
              </View>
            )}
          </View>
        )}

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>Thank you for your payment!</Text>
          <Text style={styles.footerText}>
            For questions or support, contact us at support@dubsea.com
          </Text>
          <Text style={styles.footerText}>
            This is an electronically generated receipt.
          </Text>
        </View>
      </Page>
    </Document>
  );
};

export { ReceiptDocument };
export type { ReceiptData, ReceiptDocumentProps };

