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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 30,
  },
  receiptTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000000',
  },
  businessName: {
    fontSize: 11,
    color: '#6B7280',
    textAlign: 'right',
  },
  invoiceInfo: {
    marginBottom: 20,
  },
  invoiceRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  invoiceLabel: {
    fontSize: 11,
    color: '#000000',
    fontWeight: 'bold',
    marginRight: 8,
  },
  invoiceValue: {
    fontSize: 11,
    color: '#000000',
  },
  billingSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  fromSection: {
    flex: 1,
  },
  toSection: {
    flex: 1,
    alignItems: 'flex-end',
  },
  billingLabel: {
    fontSize: 11,
    color: '#000000',
    fontWeight: 'bold',
    marginBottom: 5,
  },
  billingValue: {
    fontSize: 11,
    color: '#000000',
    marginBottom: 3,
  },
  paymentConfirmation: {
    marginBottom: 20,
  },
  paidStatus: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#000000',
    marginBottom: 5,
  },
  paymentDescription: {
    fontSize: 11,
    color: '#000000',
  },
  divider: {
    borderBottom: '1pt solid #000000',
    marginVertical: 15,
  },
  tableHeader: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  tableHeaderText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#000000',
  },
  descriptionCol: {
    width: '40%',
  },
  qtyCol: {
    width: '15%',
  },
  unitPriceCol: {
    width: '20%',
  },
  amountCol: {
    width: '25%',
  },
  tableRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  tableCell: {
    fontSize: 11,
    color: '#000000',
  },
  summarySection: {
    alignItems: 'flex-end',
    marginBottom: 20,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '50%',
    marginBottom: 5,
  },
  summaryLabel: {
    fontSize: 11,
    color: '#000000',
  },
  summaryValue: {
    fontSize: 11,
    color: '#000000',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '50%',
    marginBottom: 5,
  },
  totalLabel: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#000000',
  },
  totalValue: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#000000',
  },
  paymentHistorySection: {
    marginTop: 20,
  },
  paymentHistoryTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#000000',
    marginBottom: 10,
  },
  paymentHistoryHeader: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  paymentMethodCol: {
    width: '25%',
  },
  dateCol: {
    width: '20%',
  },
  amountPaidCol: {
    width: '25%',
  },
  receiptNumberCol: {
    width: '30%',
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
  paymentMethod: string;
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


  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.receiptTitle}>Receipt</Text>
          <Text style={styles.businessName}>Dubsea</Text>
        </View>

        {/* Invoice Information */}
        <View style={styles.invoiceInfo}>
          <View style={styles.invoiceRow}>
            <Text style={styles.invoiceLabel}>Invoice number:</Text>
            <Text style={styles.invoiceValue}>{data.paymentIntentId}</Text>
          </View>
          <View style={styles.invoiceRow}>
            <Text style={styles.invoiceLabel}>Date paid:</Text>
            <Text style={styles.invoiceValue}>{formatDate(data.created)}</Text>
          </View>
        </View>

        {/* Billing Information */}
        <View style={styles.billingSection}>
          <View style={styles.fromSection}>
            <Text style={styles.billingValue}>Dubsea</Text>
            <Text style={styles.billingValue}>United States</Text>
          </View>
          <View style={styles.toSection}>
            <Text style={styles.billingLabel}>Bill to</Text>
            <Text style={styles.billingValue}>{data.customerName}</Text>
            <Text style={styles.billingValue}>{data.customerEmail}</Text>
          </View>
        </View>

        {/* Payment Confirmation */}
        <View style={styles.paymentConfirmation}>
          <Text style={styles.paidStatus}>Marked as paid on {formatDate(data.created)}</Text>
          <Text style={styles.paymentDescription}>Payment for {data.customerEmail}</Text>
        </View>

        {/* Divider */}
        <View style={styles.divider} />

        {/* Itemized Details Table */}
        <View style={styles.tableHeader}>
          <View style={styles.descriptionCol}>
            <Text style={styles.tableHeaderText}>Description</Text>
          </View>
          <View style={styles.qtyCol}>
            <Text style={styles.tableHeaderText}>Qty</Text>
          </View>
          <View style={styles.unitPriceCol}>
            <Text style={styles.tableHeaderText}>Unit price</Text>
          </View>
          <View style={styles.amountCol}>
            <Text style={styles.tableHeaderText}>Amount</Text>
          </View>
        </View>

        <View style={styles.tableRow}>
          <View style={styles.descriptionCol}>
            <Text style={styles.tableCell}>Payment for {data.customerEmail}</Text>
          </View>
          <View style={styles.qtyCol}>
            <Text style={styles.tableCell}>1</Text>
          </View>
          <View style={styles.unitPriceCol}>
            <Text style={styles.tableCell}>{formatAmount(data.amount, data.currency)}</Text>
          </View>
          <View style={styles.amountCol}>
            <Text style={styles.tableCell}>{formatAmount(data.amount, data.currency)}</Text>
          </View>
        </View>

        {/* Divider */}
        <View style={styles.divider} />

        {/* Summary Section */}
        <View style={styles.summarySection}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Subtotal</Text>
            <Text style={styles.summaryValue}>{formatAmount(data.amount, data.currency)}</Text>
          </View>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>{formatAmount(data.amount, data.currency)}</Text>
          </View>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Amount paid</Text>
            <Text style={styles.totalValue}>{formatAmount(data.amount, data.currency)}</Text>
          </View>
        </View>

        {/* Payment History Section */}
        <View style={styles.paymentHistorySection}>
          <Text style={styles.paymentHistoryTitle}>Payment history</Text>
          <View style={styles.divider} />
          <View style={styles.paymentHistoryHeader}>
            <View style={styles.paymentMethodCol}>
              <Text style={styles.tableHeaderText}>Payment method</Text>
            </View>
            <View style={styles.dateCol}>
              <Text style={styles.tableHeaderText}>Date</Text>
            </View>
            <View style={styles.amountPaidCol}>
              <Text style={styles.tableHeaderText}>Amount paid</Text>
            </View>
            <View style={styles.receiptNumberCol}>
              <Text style={styles.tableHeaderText}>Receipt number</Text>
            </View>
          </View>
          <View style={styles.tableRow}>
            <View style={styles.paymentMethodCol}>
              <Text style={styles.tableCell}>{data.paymentMethod}</Text>
            </View>
            <View style={styles.dateCol}>
              <Text style={styles.tableCell}>{formatDate(data.created)}</Text>
            </View>
            <View style={styles.amountPaidCol}>
              <Text style={styles.tableCell}>{formatAmount(data.amount, data.currency)}</Text>
            </View>
            <View style={styles.receiptNumberCol}>
              <Text style={styles.tableCell}>{data.receiptNumber || data.paymentIntentId}</Text>
            </View>
          </View>
        </View>
      </Page>
    </Document>
  );
};

export { ReceiptDocument };
export type { ReceiptData, ReceiptDocumentProps };




