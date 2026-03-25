const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

/**
 * Simple health check.
 */
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'invoice-validation-backend' });
});

/**
 * POST /api/validate
 * Body: {
 *   invoiceNumber: string,
 *   invoiceDate: string (ISO or dd-mm-yyyy),
 *   supplierName: string,
 *   totalAmount: number,
 *   taxAmount: number,
 *   lineItems: [{ description, quantity, unitPrice }]
 * }
 *
 * Returns validation errors and warnings.
 */
app.post('/api/validate', (req, res) => {
  const invoice = req.body || {};
  const errors = [];
  const warnings = [];

  const isEmpty = (v) => v === undefined || v === null || String(v).trim() === '';

  // Basic required field checks
  if (isEmpty(invoice.invoiceNumber)) {
    errors.push('Invoice number is required.');
  }

  if (isEmpty(invoice.invoiceDate)) {
    errors.push('Invoice date is required.');
  } else {
    const date = new Date(invoice.invoiceDate);
    if (Number.isNaN(date.getTime())) {
      errors.push('Invoice date is not a valid date.');
    } else if (date > new Date()) {
      warnings.push('Invoice date is in the future. Please confirm.');
    }
  }

  if (isEmpty(invoice.supplierName)) {
    errors.push('Supplier name is required.');
  }

  // Numeric validations
  const totalAmount = Number(invoice.totalAmount);
  const taxAmount = Number(invoice.taxAmount);

  if (Number.isNaN(totalAmount) || totalAmount <= 0) {
    errors.push('Total amount must be a positive number.');
  }

  if (Number.isNaN(taxAmount) || taxAmount < 0) {
    errors.push('Tax amount must be a non-negative number.');
  }

  // Line item checks
  const lineItems = Array.isArray(invoice.lineItems) ? invoice.lineItems : [];
  if (lineItems.length === 0) {
    warnings.push('No line items found on the invoice.');
  }

  let computedSubtotal = 0;
  lineItems.forEach((item, index) => {
    const row = index + 1;

    if (isEmpty(item.description)) {
      errors.push(`Line item ${row}: Description is required.`);
    }

    const quantity = Number(item.quantity);
    const unitPrice = Number(item.unitPrice);

    if (Number.isNaN(quantity) || quantity <= 0) {
      errors.push(`Line item ${row}: Quantity must be a positive number.`);
    }

    if (Number.isNaN(unitPrice) || unitPrice < 0) {
      errors.push(`Line item ${row}: Unit price must be a non-negative number.`);
    }

    if (!Number.isNaN(quantity) && !Number.isNaN(unitPrice)) {
      computedSubtotal += quantity * unitPrice;
    }
  });

  if (!Number.isNaN(totalAmount) && !Number.isNaN(taxAmount)) {
    const expectedTotal = computedSubtotal + taxAmount;
    const diff = Math.abs(totalAmount - expectedTotal);
    if (diff > 0.01) {
      errors.push(
        `Total amount (${totalAmount}) does not match subtotal (${computedSubtotal.toFixed(
          2
        )}) + tax (${taxAmount.toFixed(2)}). Difference: ${diff.toFixed(2)}.`
      );
    }
  }

  res.json({
    invoice,
    errors,
    warnings,
    isValid: errors.length === 0
  });
});

app.listen(PORT, () => {
  console.log(`Invoice Validation backend listening on http://localhost:${PORT}`);
});

