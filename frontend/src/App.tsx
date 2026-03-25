import React, { useState } from 'react';

type LineItem = {
  description: string;
  quantity: string;
  unitPrice: string;
};

type ValidationResponse = {
  errors: string[];
  warnings: string[];
  isValid: boolean;
};

export const App: React.FC = () => {
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [invoiceDate, setInvoiceDate] = useState('');
  const [supplierName, setSupplierName] = useState('');
  const [totalAmount, setTotalAmount] = useState('');
  const [taxAmount, setTaxAmount] = useState('');
  const [lineItems, setLineItems] = useState<LineItem[]>([
    { description: '', quantity: '', unitPrice: '' }
  ]);

  const [result, setResult] = useState<ValidationResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleLineItemChange = (index: number, field: keyof LineItem, value: string) => {
    setLineItems((items) => {
      const copy = [...items];
      copy[index] = { ...copy[index], [field]: value };
      return copy;
    });
  };

  const addLineItem = () => {
    setLineItems((items) => [...items, { description: '', quantity: '', unitPrice: '' }]);
  };

  const removeLineItem = (index: number) => {
    setLineItems((items) => items.filter((_, i) => i !== index));
  };

  const handleValidate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage(null);
    setResult(null);

    try {
      const response = await fetch('/api/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          invoiceNumber,
          invoiceDate,
          supplierName,
          totalAmount,
          taxAmount,
          lineItems
        })
      });

      if (!response.ok) {
        throw new Error(`Server responded with status ${response.status}`);
      }

      const data = (await response.json()) as ValidationResponse;
      setResult(data);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unexpected error during validation';
      setErrorMessage(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="app-root">
      <header className="app-header">
        <h1>Invoice Data Validation</h1>
        <p className="subtitle">Learnathon Project – Clean, rule-based invoice checks</p>
      </header>

      <main className="layout">
        <section className="card">
          <h2>Invoice Details</h2>
          <form onSubmit={handleValidate} className="form">
            <div className="field-row">
              <div className="field">
                <label>Invoice Number</label>
                <input
                  type="text"
                  value={invoiceNumber}
                  onChange={(e) => setInvoiceNumber(e.target.value)}
                  placeholder="e.g., INV-2025-001"
                  required
                />
              </div>
              <div className="field">
                <label>Invoice Date</label>
                <input
                  type="date"
                  value={invoiceDate}
                  onChange={(e) => setInvoiceDate(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="field">
              <label>Supplier Name</label>
              <input
                type="text"
                value={supplierName}
                onChange={(e) => setSupplierName(e.target.value)}
                placeholder="Vendor / Supplier"
                required
              />
            </div>

            <div className="field-row">
              <div className="field">
                <label>Total Amount</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={totalAmount}
                  onChange={(e) => setTotalAmount(e.target.value)}
                  placeholder="e.g., 1000.00"
                  required
                />
              </div>
              <div className="field">
                <label>Tax Amount</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={taxAmount}
                  onChange={(e) => setTaxAmount(e.target.value)}
                  placeholder="e.g., 180.00"
                  required
                />
              </div>
            </div>

            <div className="line-items">
              <div className="line-items-header">
                <h3>Line Items</h3>
                <button type="button" className="btn-secondary" onClick={addLineItem}>
                  + Add Item
                </button>
              </div>

              {lineItems.map((item, index) => (
                <div key={index} className="line-item-row">
                  <input
                    type="text"
                    value={item.description}
                    onChange={(e) => handleLineItemChange(index, 'description', e.target.value)}
                    placeholder="Description"
                  />
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={item.quantity}
                    onChange={(e) => handleLineItemChange(index, 'quantity', e.target.value)}
                    placeholder="Qty"
                  />
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={item.unitPrice}
                    onChange={(e) => handleLineItemChange(index, 'unitPrice', e.target.value)}
                    placeholder="Unit Price"
                  />
                  {lineItems.length > 1 && (
                    <button
                      type="button"
                      className="btn-icon"
                      onClick={() => removeLineItem(index)}
                    >
                      ✕
                    </button>
                  )}
                </div>
              ))}
            </div>

            <div className="actions">
              <button type="submit" className="btn-primary" disabled={isLoading}>
                {isLoading ? 'Validating…' : 'Validate Invoice'}
              </button>
            </div>
          </form>

          {errorMessage && <p className="status status-error">Error: {errorMessage}</p>}
        </section>

        <section className="card results-card">
          <h2>Validation Results</h2>
          {!result && <p className="muted">Fill in the invoice and click “Validate Invoice”.</p>}

          {result && (
            <>
              <p
                className={
                  result.isValid ? 'status status-success' : 'status status-error-strong'
                }
              >
                {result.isValid
                  ? 'Invoice is valid. No blocking issues found.'
                  : 'Invoice has validation issues. Please review.'}
              </p>

              {result.errors.length > 0 && (
                <div className="list-block">
                  <h3>Errors</h3>
                  <ul className="list errors">
                    {result.errors.map((err, idx) => (
                      <li key={idx}>{err}</li>
                    ))}
                  </ul>
                </div>
              )}

              {result.warnings.length > 0 && (
                <div className="list-block">
                  <h3>Warnings</h3>
                  <ul className="list warnings">
                    {result.warnings.map((w, idx) => (
                      <li key={idx}>{w}</li>
                    ))}
                  </ul>
                </div>
              )}
            </>
          )}
        </section>
      </main>

      <footer className="app-footer">
        <span>Built for Learnathon – Invoice Data Validation</span>
      </footer>
    </div>
  );
};

