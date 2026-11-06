import React from 'react';
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';
import type { Invoice, InvoiceItem, Organization, Client } from '@/db/schema';
import { formatCentsToCurrency, formatEditorialDate, formatBasisPointsToPercent } from '../utils';

const styles = StyleSheet.create({
  page: {
    backgroundColor: '#FAF8F5',
    padding: 36,
    fontFamily: 'Helvetica',
    color: '#18191B',
    fontSize: 9,
  },
  header: {
    marginBottom: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  brandContainer: {
    width: '100%',
  },
  brandTitle: {
    fontFamily: 'Times-Roman',
    fontSize: 22,
    fontWeight: 'bold',
    letterSpacing: -0.5,
    color: '#18191B',
    textTransform: 'uppercase',
    lineHeight: 1.15,
    marginBottom: 4,
  },
  brandSubtitle: {
    fontSize: 8,
    color: '#5C5E62',
    letterSpacing: 1.5,
    lineHeight: 1.2,
    textTransform: 'uppercase',
  },
  statusBadge: {
    borderWidth: 1.5,
    paddingVertical: 4,
    paddingHorizontal: 12,
    fontSize: 9,
    fontFamily: 'Courier',
    fontWeight: 'bold',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  statusPaid: {
    borderColor: '#2B4C3F',
    color: '#2B4C3F',
  },
  statusDraft: {
    borderColor: '#D4AF37',
    color: '#D4AF37',
  },
  statusVermilion: {
    borderColor: '#C84630',
    color: '#C84630',
  },
  metaGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
    paddingBottom: 16,
    borderBottomWidth: 0.5,
    borderBottomColor: '#E6E1D9',
  },
  metaCol: {
    width: '48%',
  },
  metaHeading: {
    fontSize: 7.5,
    letterSpacing: 1,
    color: '#5C5E62',
    textTransform: 'uppercase',
    marginBottom: 4,
    fontWeight: 'bold',
  },
  companyName: {
    fontFamily: 'Times-Roman',
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 3,
  },
  addressLine: {
    color: '#5C5E62',
    fontSize: 8.5,
    lineHeight: 1.3,
  },
  invoiceDetailsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    backgroundColor: '#F3EFEA',
    padding: 10,
    borderRadius: 2,
    marginBottom: 20,
    borderWidth: 0.5,
    borderColor: '#E6E1D9',
  },
  detailItem: {
    width: '33.33%',
  },
  detailLabel: {
    fontSize: 7,
    letterSpacing: 0.8,
    color: '#5C5E62',
    textTransform: 'uppercase',
  },
  detailValue: {
    fontFamily: 'Courier',
    fontSize: 9.5,
    fontWeight: 'bold',
    color: '#18191B',
    marginTop: 2,
  },
  // Table
  table: {
    width: '100%',
    marginBottom: 20,
  },
  tableHeader: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#18191B',
    paddingBottom: 6,
    marginBottom: 6,
  },
  thColDesc: {
    width: '55%',
    fontSize: 7.5,
    letterSpacing: 1,
    color: '#5C5E62',
    textTransform: 'uppercase',
    fontWeight: 'bold',
  },
  thColQty: {
    width: '15%',
    fontSize: 7.5,
    letterSpacing: 1,
    color: '#5C5E62',
    textAlign: 'center',
    textTransform: 'uppercase',
    fontWeight: 'bold',
  },
  thColRate: {
    width: '15%',
    fontSize: 7.5,
    letterSpacing: 1,
    color: '#5C5E62',
    textAlign: 'right',
    textTransform: 'uppercase',
    fontWeight: 'bold',
  },
  thColTotal: {
    width: '15%',
    fontSize: 7.5,
    letterSpacing: 1,
    color: '#5C5E62',
    textAlign: 'right',
    textTransform: 'uppercase',
    fontWeight: 'bold',
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 0.5,
    borderBottomColor: '#E6E1D9',
    paddingVertical: 7,
  },
  tdDesc: {
    width: '55%',
    fontSize: 8.5,
    color: '#18191B',
    paddingRight: 10,
  },
  tdQty: {
    width: '15%',
    fontFamily: 'Courier',
    fontSize: 8.5,
    textAlign: 'center',
    color: '#18191B',
  },
  tdRate: {
    width: '15%',
    fontFamily: 'Courier',
    fontSize: 8.5,
    textAlign: 'right',
    color: '#18191B',
  },
  tdTotal: {
    width: '15%',
    fontFamily: 'Courier',
    fontSize: 8.5,
    fontWeight: 'bold',
    textAlign: 'right',
    color: '#18191B',
  },
  // Totals Area
  totalsContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: 20,
  },
  totalsBox: {
    width: '45%',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 3,
  },
  totalRowFinal: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderTopWidth: 1,
    borderTopColor: '#18191B',
    borderBottomWidth: 1.5,
    borderBottomColor: '#18191B',
    marginTop: 4,
  },
  totalLabel: {
    fontSize: 8,
    color: '#5C5E62',
    textTransform: 'uppercase',
  },
  totalValue: {
    fontFamily: 'Courier',
    fontSize: 8.5,
    color: '#18191B',
  },
  totalLabelFinal: {
    fontFamily: 'Times-Roman',
    fontSize: 10,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  totalValueFinal: {
    fontFamily: 'Courier',
    fontSize: 12,
    fontWeight: 'bold',
    color: '#18191B',
  },
  notesSection: {
    marginBottom: 20,
    padding: 10,
    backgroundColor: '#F3EFEA',
    borderLeftWidth: 2,
    borderLeftColor: '#5C5E62',
  },
  notesLabel: {
    fontSize: 7,
    letterSpacing: 1,
    color: '#5C5E62',
    textTransform: 'uppercase',
    marginBottom: 3,
    fontWeight: 'bold',
  },
  notesText: {
    fontSize: 8,
    color: '#18191B',
    lineHeight: 1.4,
  },
  // Remittance Tear-off Stub
  stubDivider: {
    marginVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#A1A3A8',
    borderStyle: 'dashed',
    position: 'relative',
  },
  stubTitle: {
    textAlign: 'center',
    fontSize: 6.5,
    color: '#A1A3A8',
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginBottom: 10,
  },
  remittanceBox: {
    borderWidth: 0.5,
    borderColor: '#E6E1D9',
    backgroundColor: '#FAF8F5',
    padding: 10,
    borderRadius: 2,
  },
  wireRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  wireCol: {
    width: '48%',
  },
  wireLabel: {
    fontSize: 6.5,
    color: '#5C5E62',
    textTransform: 'uppercase',
  },
  wireValue: {
    fontFamily: 'Courier',
    fontSize: 8,
    fontWeight: 'bold',
    color: '#18191B',
  },
});

interface InvoicePdfProps {
  invoice: Invoice;
  items: InvoiceItem[];
  organization: Organization;
  client: Client;
}

export function InvoicePdfTemplate({ invoice, items, organization, client }: InvoicePdfProps) {
  return (
    <Document title={`Invoice ${invoice.invoiceNumber}`} author={organization.companyName}>
      <Page size="LETTER" style={styles.page}>
        {/* Header (Document Letterhead) */}
        <View style={styles.header}>
          <View style={styles.brandContainer}>
            <Text style={styles.brandTitle}>
              {organization.letterheadTitle ||
                organization.companyName ||
                organization.principalName ||
                'Artisan Ledger'}
            </Text>
            {(organization.letterheadTagline ?? 'Archival Financial Document / Certified Ledger') ? (
              <Text style={styles.brandSubtitle}>
                {organization.letterheadTagline ?? 'Archival Financial Document / Certified Ledger'}
              </Text>
            ) : null}
          </View>
        </View>

        {/* Metadata Grid */}
        <View style={styles.metaGrid}>
          <View style={styles.metaCol}>
            <Text style={styles.metaHeading}>From</Text>
            {organization.entityType === 'INDIVIDUAL' ? (
              <>
                <Text style={styles.companyName}>
                  {organization.principalName || organization.companyName}
                </Text>
                {organization.companyName &&
                  organization.principalName &&
                  organization.companyName !== organization.principalName && (
                    <Text style={styles.addressLine}>{organization.companyName}</Text>
                  )}
              </>
            ) : (
              <>
                <Text style={styles.companyName}>
                  {organization.companyName || organization.principalName}
                </Text>
                {organization.principalName &&
                  organization.principalName !== organization.companyName && (
                    <Text style={styles.addressLine}>
                      Principal: {organization.principalName}
                    </Text>
                  )}
              </>
            )}
            {organization.addressLine && <Text style={styles.addressLine}>{organization.addressLine}</Text>}
            <Text style={styles.addressLine}>
              {[organization.city, organization.state, organization.postalCode].filter(Boolean).join(', ')}
            </Text>
            {organization.taxId && (
              <Text style={styles.addressLine}>Tax ID / EIN: {organization.taxId}</Text>
            )}
            {organization.email && <Text style={styles.addressLine}>{organization.email}</Text>}
            {organization.phone && <Text style={styles.addressLine}>{organization.phone}</Text>}
          </View>

          <View style={styles.metaCol}>
            <Text style={styles.metaHeading}>Billed to</Text>
            <Text style={styles.companyName}>{client.companyName || client.name}</Text>
            {client.companyName && <Text style={styles.addressLine}>Attn: {client.name}</Text>}
            {client.address && <Text style={styles.addressLine}>{client.address}</Text>}
            {client.email && <Text style={styles.addressLine}>{client.email}</Text>}
          </View>
        </View>

        {/* Invoice Key Details Grid */}
        <View style={styles.invoiceDetailsGrid}>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Invoice No.</Text>
            <Text style={styles.detailValue}>{invoice.invoiceNumber}</Text>
          </View>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Issue Date</Text>
            <Text style={styles.detailValue}>{formatEditorialDate(invoice.issueDate)}</Text>
          </View>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Due Date</Text>
            <Text style={styles.detailValue}>{formatEditorialDate(invoice.dueDate)}</Text>
          </View>
        </View>

        {/* Line Items Table */}
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={styles.thColDesc}>Description & Deliverables</Text>
            <Text style={styles.thColQty}>Qty</Text>
            <Text style={styles.thColRate}>Rate</Text>
            <Text style={styles.thColTotal}>Amount</Text>
          </View>

          {items.map((item, index) => (
            <View key={item.id || index} style={styles.tableRow}>
              <Text style={styles.tdDesc}>{item.description}</Text>
              <Text style={styles.tdQty}>{item.quantity}</Text>
              <Text style={styles.tdRate}>{formatCentsToCurrency(item.unitPriceCents, invoice.currency || 'USD')}</Text>
              <Text style={styles.tdTotal}>{formatCentsToCurrency(item.totalCents, invoice.currency || 'USD')}</Text>
            </View>
          ))}
        </View>

        {/* Totals Summary */}
        <View style={styles.totalsContainer}>
          <View style={styles.totalsBox}>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Subtotal</Text>
              <Text style={styles.totalValue}>
                {formatCentsToCurrency(invoice.subtotalCents || 0, invoice.currency || 'USD')}
              </Text>
            </View>

            {invoice.discountCents ? (
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Discount</Text>
                <Text style={styles.totalValue}>
                  -{formatCentsToCurrency(invoice.discountCents || 0, invoice.currency || 'USD')}
                </Text>
              </View>
            ) : null}

            {invoice.taxRateBasisPoints ? (
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>
                  Tax ({formatBasisPointsToPercent(invoice.taxRateBasisPoints || 0)})
                </Text>
                <Text style={styles.totalValue}>
                  {formatCentsToCurrency(invoice.taxAmountCents || 0, invoice.currency || 'USD')}
                </Text>
              </View>
            ) : null}

            <View style={styles.totalRowFinal}>
              <Text style={styles.totalLabelFinal}>Balance Due</Text>
              <Text style={styles.totalValueFinal}>
                {formatCentsToCurrency(invoice.totalCents || 0, invoice.currency || 'USD')}
              </Text>
            </View>
          </View>
        </View>

        {/* Notes & Terms */}
        {(invoice.notes || invoice.termsConditions) && (
          <View style={styles.notesSection}>
            {invoice.notes && (
              <>
                <Text style={styles.notesLabel}>Notes & Instructions</Text>
                <Text style={styles.notesText}>{invoice.notes}</Text>
              </>
            )}
            {invoice.termsConditions && (
              <>
                <Text style={[styles.notesLabel, { marginTop: 6 }]}>Terms & Conditions</Text>
                <Text style={styles.notesText}>{invoice.termsConditions}</Text>
              </>
            )}
          </View>
        )}

        {/* Tear-off Bank Wire Stub */}
        <View style={styles.stubDivider} />
        <Text style={styles.stubTitle}>
          --- {organization.remittanceStubLabel || 'TEAR-OFF REMITTANCE ADVICE / WIRE INSTRUCTIONS'} ---
        </Text>

        <View style={styles.remittanceBox}>
          <View style={styles.wireRow}>
            <View style={styles.wireCol}>
              <Text style={styles.wireLabel}>Beneficiary Bank</Text>
              <Text style={styles.wireValue}>{organization.bankName || 'Direct Wire Transfer'}</Text>
            </View>
            <View style={styles.wireCol}>
              <Text style={styles.wireLabel}>Account Holder</Text>
              <Text style={styles.wireValue}>{organization.accountHolderName || organization.companyName}</Text>
            </View>
          </View>
          <View style={styles.wireRow}>
            <View style={styles.wireCol}>
              <Text style={styles.wireLabel}>Routing / Transit / ABA</Text>
              <Text style={styles.wireValue}>{organization.routingNumber || '—'}</Text>
            </View>
            <View style={styles.wireCol}>
              <Text style={styles.wireLabel}>Account Number</Text>
              <Text style={styles.wireValue}>{organization.accountNumber || '—'}</Text>
            </View>
          </View>
          {(organization.swiftBic || organization.paymentNotes) && (
            <View style={styles.wireRow}>
              {organization.swiftBic && (
                <View style={styles.wireCol}>
                  <Text style={styles.wireLabel}>SWIFT / BIC</Text>
                  <Text style={styles.wireValue}>{organization.swiftBic}</Text>
                </View>
              )}
              {organization.paymentNotes && (
                <View style={styles.wireCol}>
                  <Text style={styles.wireLabel}>Payment Reference</Text>
                  <Text style={styles.wireValue}>{organization.paymentNotes}</Text>
                </View>
              )}
            </View>
          )}
        </View>
      </Page>
    </Document>
  );
}
