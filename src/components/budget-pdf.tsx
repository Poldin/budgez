import React from 'react';
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';

// Definisci gli stili per il PDF
const styles = StyleSheet.create({
  page: {
    padding: 30,
    fontSize: 10,
    fontFamily: 'Helvetica',
  },
  title: {
    fontSize: 24,
    marginBottom: 20,
    borderBottom: '3 solid #1a1a1a',
    paddingBottom: 8,
  },
  activitySection: {
    marginTop: 15,
    marginBottom: 15,
  },
  activityHeader: {
    backgroundColor: '#1a1a1a',
    color: 'white',
    padding: 10,
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  activityDescription: {
    fontSize: 9,
    color: '#666',
    fontStyle: 'italic',
    padding: 8,
    backgroundColor: '#fafafa',
    marginBottom: 5,
  },
  resourcesTable: {
    border: '1 solid #ddd',
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#f5f5f5',
    padding: 6,
    borderBottom: '1 solid #ddd',
    fontSize: 9,
    fontWeight: 'bold',
  },
  tableRow: {
    flexDirection: 'row',
    padding: 6,
    borderBottom: '1 solid #f0f0f0',
  },
  col40: { width: '40%' },
  col20: { width: '20%', textAlign: 'center' },
  col20right: { width: '20%', textAlign: 'right' },
  activityTotalBox: {
    backgroundColor: '#f9f9f9',
    padding: 10,
    marginTop: 5,
    border: '1 solid #ddd',
  },
  activityTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
    fontSize: 10,
  },
  activityTotalLabel: {
    fontWeight: 'bold',
  },
  activityTotalValue: {
    fontWeight: 'bold',
  },
  discountText: {
    color: '#b45309',
    fontSize: 9,
  },
  summarySection: {
    marginTop: 25,
    border: '2 solid #1a1a1a',
  },
  summaryRow: {
    flexDirection: 'row',
    backgroundColor: '#f5f5f5',
    padding: 10,
    justifyContent: 'space-between',
    borderBottom: '1 solid #ddd',
    fontSize: 11,
  },
  discountRow: {
    flexDirection: 'row',
    backgroundColor: '#fef3c7',
    padding: 10,
    justifyContent: 'space-between',
    borderBottom: '1 solid #ddd',
    fontSize: 11,
  },
  grandTotalRow: {
    flexDirection: 'row',
    backgroundColor: '#1a1a1a',
    color: 'white',
    padding: 12,
    fontSize: 14,
    fontWeight: 'bold',
    justifyContent: 'space-between',
  },
  smaller: { fontSize: 8 },
  bold: { fontWeight: 'bold' },
});

interface Resource {
  id: string;
  name: string;
  costType: 'hourly' | 'quantity' | 'fixed';
  pricePerHour: number;
}

interface ResourceAssignment {
  resourceId: string;
  hours: number;
  fixedPrice: number;
}

interface ActivityDiscount {
  enabled: boolean;
  type: 'percentage' | 'fixed';
  value: number;
  applyOn: 'taxable' | 'withVat';
}

interface Activity {
  id: string;
  name: string;
  description: string;
  resources: ResourceAssignment[];
  vat: number;
  discount?: ActivityDiscount;
}

interface BudgetPDFProps {
  budgetName: string;
  currency: string;
  resources: Resource[];
  activities: Activity[];
  translations: {
    activityName: string;
    resourceName: string;
    subtotal: string;
    total: string;
    vatAmount: string;
    discount: string;
    activities: string;
    beforeDiscount: string;
    generalDiscount: string;
    finalTotal: string;
  };
  formatNumber: (num: number) => string;
  calculateResourceCost: (resourceId: string, hours: number, fixedPrice: number) => number;
  calculateActivityTotal: (activity: Activity) => number;
  calculateActivityDiscountAmount: (activity: Activity) => number;
  calculateActivityTotalWithVat: (activity: Activity) => number;
  calculateGrandSubtotal: () => number;
  calculateGrandVat: () => number;
  calculateGrandTotalBeforeGeneralDiscount: () => number;
  calculateGeneralDiscountAmount: () => number;
  calculateGrandTotal: () => number;
  calculateTotalActivityDiscounts: () => number;
}

const BudgetPDF: React.FC<BudgetPDFProps> = ({
  budgetName,
  currency,
  resources,
  activities,
  translations: t,
  formatNumber,
  calculateResourceCost,
  calculateActivityTotal,
  calculateActivityDiscountAmount,
  calculateActivityTotalWithVat,
  calculateGrandSubtotal,
  calculateGrandVat,
  calculateGrandTotalBeforeGeneralDiscount,
  calculateGeneralDiscountAmount,
  calculateGrandTotal,
  calculateTotalActivityDiscounts,
}) => {
  const subtotal = calculateGrandSubtotal();
  const vatAmount = calculateGrandVat();
  const totalBeforeGeneralDiscount = calculateGrandTotalBeforeGeneralDiscount();
  const generalDiscountAmount = calculateGeneralDiscountAmount();
  const total = calculateGrandTotal();

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.title}>{budgetName}</Text>

        {/* Activities - Una sezione per ogni attività */}
        {activities.map((activity, index) => {
          const activitySubtotal = calculateActivityTotal(activity);
          const activityDiscountAmount = calculateActivityDiscountAmount(activity);
          const activityTotalWithVat = calculateActivityTotalWithVat(activity);
          const activityVatAmount = activitySubtotal * activity.vat / 100;

          return (
            <View key={activity.id} style={styles.activitySection} break={index > 0 && index % 2 === 0}>
              {/* Resources Table */}
              <View style={styles.resourcesTable}>
                {/* Activity Name as First Row */}
                <View style={styles.activityHeader}>
                  <Text>{activity.name}</Text>
                </View>

                {/* Activity Description */}
                {activity.description && (
                  <View style={styles.activityDescription}>
                    <Text>{activity.description}</Text>
                  </View>
                )}

                {/* Table Header */}
                <View style={styles.tableHeader}>
                  <Text style={styles.col40}>Risorsa</Text>
                  <Text style={styles.col20}>Dettagli</Text>
                  <Text style={styles.col20right}>Costo</Text>
                </View>

                {/* Resources */}
                {activity.resources.map((assignment, resIndex) => {
                  const resource = resources.find(r => r.id === assignment.resourceId);
                  if (!resource) return null;

                  const cost = calculateResourceCost(assignment.resourceId, assignment.hours, assignment.fixedPrice);
                  const detailText = resource.costType === 'hourly'
                    ? `${assignment.hours} ore × ${currency}${formatNumber(resource.pricePerHour)}/h`
                    : resource.costType === 'quantity'
                    ? `${assignment.hours} unità × ${currency}${formatNumber(resource.pricePerHour)}/u`
                    : `Costo fisso`;

                  return (
                    <View style={styles.tableRow} key={resIndex}>
                      <Text style={styles.col40}>{resource.name}</Text>
                      <Text style={[styles.col20, styles.smaller]}>{detailText}</Text>
                      <Text style={styles.col20right}>{currency}{formatNumber(cost)}</Text>
                    </View>
                  );
                })}
              </View>

              {/* Activity Total Box */}
              <View style={styles.activityTotalBox}>
                <View style={styles.activityTotalRow}>
                  <Text>{t.subtotal}:</Text>
                  <Text>{currency}{formatNumber(activitySubtotal)}</Text>
                </View>
                <View style={styles.activityTotalRow}>
                  <Text>IVA ({activity.vat}%):</Text>
                  <Text>{currency}{formatNumber(activityVatAmount)}</Text>
                </View>
                {activity.discount?.enabled && activityDiscountAmount > 0 && (
                  <View style={[styles.activityTotalRow, { marginTop: 4 }]}>
                    <Text style={styles.discountText}>{t.discount}:</Text>
                    <Text style={styles.discountText}>-{currency}{formatNumber(activityDiscountAmount)}</Text>
                  </View>
                )}
                <View style={[styles.activityTotalRow, { marginTop: 6, paddingTop: 6, borderTop: '1 solid #ddd' }]}>
                  <Text style={styles.activityTotalLabel}>{t.total}:</Text>
                  <Text style={styles.activityTotalValue}>{currency}{formatNumber(activityTotalWithVat)}</Text>
                </View>
              </View>
            </View>
          );
        })}

        {/* Summary Section */}
        <View style={styles.summarySection}>
          <View style={styles.summaryRow}>
            <Text>{t.subtotal}:</Text>
            <Text>{currency}{formatNumber(subtotal)}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text>{t.vatAmount}:</Text>
            <Text>{currency}{formatNumber(vatAmount)}</Text>
          </View>
          {calculateTotalActivityDiscounts() > 0 && (
            <View style={styles.discountRow}>
              <Text>{t.discount} {t.activities}:</Text>
              <Text>-{currency}{formatNumber(calculateTotalActivityDiscounts())}</Text>
            </View>
          )}
          {generalDiscountAmount > 0 && (
            <>
              <View style={styles.summaryRow}>
                <Text>{t.beforeDiscount}:</Text>
                <Text>{currency}{formatNumber(totalBeforeGeneralDiscount)}</Text>
              </View>
              <View style={styles.discountRow}>
                <Text>{t.generalDiscount}:</Text>
                <Text>-{currency}{formatNumber(generalDiscountAmount)}</Text>
              </View>
            </>
          )}
          <View style={styles.grandTotalRow}>
            <Text>{t.finalTotal}:</Text>
            <Text>{currency}{formatNumber(total)}</Text>
          </View>
        </View>
      </Page>
    </Document>
  );
};

export default BudgetPDF;

