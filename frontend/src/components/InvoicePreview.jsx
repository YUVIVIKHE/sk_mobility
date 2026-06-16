import VehicleInvoicePreview from './VehicleInvoicePreview';
import WarrantyInvoicePreview from './WarrantyInvoicePreview';

/**
 * Smart invoice router — picks the right template based on bill type.
 * bill_type: 'vehicle' → Vehicle Tax Invoice format
 * bill_type: 'warranty' → Extended Warranty Certificate format
 * default → Vehicle Tax Invoice (most common)
 */
export default function InvoicePreview({ data }) {
  if (!data) return null;

  const billType = data?.bill?.bill_type || 'vehicle';

  if (billType === 'warranty') {
    return <WarrantyInvoicePreview data={data} />;
  }

  return <VehicleInvoicePreview data={data} />;
}
