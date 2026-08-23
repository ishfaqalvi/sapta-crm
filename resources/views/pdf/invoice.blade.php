<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Invoice {{ $invoice->invoice_number }}</title>
    <style>
        * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
        }
        body {
            font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
            font-size: 11px;
            color: #1e293b;
            background-color: #ffffff;
            padding: 35px;
            line-height: 1.5;
        }

        /* Layout Tables */
        .w-full { width: 100%; }
        .table-layout {
            width: 100%;
            border-collapse: collapse;
        }
        .table-layout td {
            vertical-align: top;
        }

        /* Header Branding */
        .logo-img {
            max-height: 55px;
            width: auto;
            margin-bottom: 8px;
        }
        .company-name {
            font-size: 20px;
            font-weight: 800;
            color: #003796;
            letter-spacing: -0.5px;
            text-transform: uppercase;
        }
        .company-meta {
            font-size: 10px;
            color: #64748b;
            line-height: 1.4;
        }
        .invoice-main-title {
            font-size: 28px;
            font-weight: 900;
            color: #0f172a;
            letter-spacing: 1px;
            text-align: right;
            text-transform: uppercase;
        }
        .invoice-num-text {
            font-size: 13px;
            font-weight: 800;
            color: #0052D4;
            text-align: right;
            margin-top: 2px;
        }

        /* Status Badges */
        .status-badge {
            display: inline-block;
            padding: 4px 10px;
            font-size: 10px;
            font-weight: 800;
            text-transform: uppercase;
            border-radius: 6px;
            margin-top: 6px;
            letter-spacing: 0.5px;
        }
        .status-paid { background-color: #dcfce7; color: #15803d; border: 1px solid #bbf7d0; }
        .status-sent { background-color: #dbeafe; color: #1d4ed8; border: 1px solid #bfdbfe; }
        .status-draft { background-color: #f1f5f9; color: #475569; border: 1px solid #e2e8f0; }
        .status-overdue { background-color: #ffe4e6; color: #be123c; border: 1px solid #fecdd3; }
        .status-cancelled { background-color: #f1f5f9; color: #64748b; border: 1px solid #cbd5e1; }

        /* Divider Bar */
        .header-divider {
            height: 3px;
            background: #0052D4;
            margin: 18px 0 22px 0;
            border-radius: 2px;
        }

        /* Information Cards */
        .info-card {
            background-color: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            padding: 12px 14px;
        }
        .section-label {
            font-size: 9px;
            font-weight: 800;
            text-transform: uppercase;
            color: #94a3b8;
            letter-spacing: 0.8px;
            margin-bottom: 5px;
        }
        .client-name {
            font-size: 13px;
            font-weight: 800;
            color: #0f172a;
            margin-bottom: 2px;
        }
        .info-text {
            font-size: 10.5px;
            color: #475569;
            line-height: 1.4;
        }

        /* Items Table */
        .items-table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 22px;
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            overflow: hidden;
        }
        .items-table th {
            background-color: #003796;
            color: #ffffff;
            font-size: 9.5px;
            font-weight: 800;
            text-transform: uppercase;
            letter-spacing: 0.6px;
            padding: 10px 12px;
            text-align: left;
        }
        .items-table td {
            padding: 11px 12px;
            border-bottom: 1px solid #f1f5f9;
            font-size: 11px;
            color: #334155;
        }
        .items-table tr:nth-child(even) td {
            background-color: #f8fafc;
        }
        .text-right { text-align: right; }
        .text-center { text-align: center; }

        /* Totals Area */
        .totals-wrapper {
            margin-top: 18px;
            width: 100%;
        }
        .totals-table {
            width: 320px;
            float: right;
            border-collapse: collapse;
        }
        .totals-table td {
            padding: 6px 10px;
            font-size: 11px;
        }
        .totals-table .label {
            color: #64748b;
            font-weight: 600;
        }
        .totals-table .val {
            text-align: right;
            font-weight: 700;
            color: #0f172a;
        }
        .grand-total-row td {
            border-top: 2px solid #0052D4;
            padding-top: 10px;
            padding-bottom: 10px;
            font-size: 14px;
        }
        .grand-total-row .val {
            color: #0052D4;
            font-weight: 900;
        }
        .pkr-banner {
            background-color: #f0fdf4;
            border: 1px solid #bbf7d0;
            border-radius: 6px;
            padding: 8px 12px;
            margin-top: 10px;
            font-size: 10.5px;
            color: #166534;
        }
        .clear { clear: both; }

        /* Notes & Footer */
        .notes-card {
            margin-top: 30px;
            padding: 12px 14px;
            background-color: #f8fafc;
            border-left: 3px solid #0052D4;
            border-radius: 4px;
        }
        .notes-card h5 {
            font-size: 10px;
            font-weight: 800;
            text-transform: uppercase;
            color: #334155;
            margin-bottom: 3px;
        }
        .notes-card p {
            font-size: 10.5px;
            color: #64748b;
        }

        .doc-footer {
            margin-top: 40px;
            padding-top: 12px;
            border-top: 1px solid #e2e8f0;
            text-align: center;
            font-size: 10px;
            color: #94a3b8;
        }
    </style>
</head>
<body>

    @php
        $logoPath = public_path('logo.png');
        if (!file_exists($logoPath)) {
            $logoPath = public_path('logo_clean.png');
        }
        $logoData = file_exists($logoPath) ? base64_encode(file_get_contents($logoPath)) : null;
        $logoMime = file_exists($logoPath) ? (mime_content_type($logoPath) ?: 'image/png') : 'image/png';
    @endphp

    <!-- Top Header & Logo Branding -->
    <table class="table-layout">
        <tr>
            <td style="width: 55%;">
                @if($logoData)
                    <img src="data:{{ $logoMime }};base64,{{ $logoData }}" class="logo-img" alt="Company Logo" />
                @else
                    <div class="company-name">{{ $company['name'] ?? 'SAPTA TECHNOLOGIES' }}</div>
                @endif
                <div class="company-meta">
                    <strong>{{ $company['name'] ?? 'Sapta Technologies' }}</strong><br>
                    {{ $company['address'] ?? 'Software Technology Park, Lahore, Pakistan' }}<br>
                    Email: {{ $company['email'] ?? 'contact@saptatechnologies.com' }} | Phone: {{ $company['phone'] ?? '+92 300 1234567' }}
                    @if(!empty($company['tax_id']))
                        <br>NTN / Tax Registration: {{ $company['tax_id'] }}
                    @endif
                </div>
            </td>
            <td style="width: 45%; text-align: right;">
                <div class="invoice-main-title">INVOICE</div>
                <div class="invoice-num-text">{{ $invoice->invoice_number }}</div>
                <div style="margin-top: 4px;">
                    <span class="status-badge status-{{ strtolower($invoice->status) }}">
                        {{ strtoupper($invoice->status) }}
                    </span>
                </div>
            </td>
        </tr>
    </table>

    <!-- Gradient Divider -->
    <div class="header-divider"></div>

    <!-- Client Billed To & Invoice Metadata -->
    <table class="table-layout">
        <tr>
            <td style="width: 48%;">
                <div class="info-card">
                    <div class="section-label">Billed To Client</div>
                    <div class="client-name">{{ $invoice->client->company_name ?? $invoice->client->name }}</div>
                    <div class="info-text">
                        Attention: {{ $invoice->client->name }}<br>
                        Email: {{ $invoice->client->email }}
                        @if($invoice->client->phone)
                            <br>Phone: {{ $invoice->client->phone }}
                        @endif
                    </div>
                </div>
            </td>
            <td style="width: 4%;"></td>
            <td style="width: 48%;">
                <div class="info-card">
                    <div class="section-label">Statement Info & Dates</div>
                    <div class="info-text">
                        <strong>Issue Date:</strong> {{ \Carbon\Carbon::parse($invoice->issue_date)->format('M d, Y') }}<br>
                        <strong>Due Date:</strong> {{ \Carbon\Carbon::parse($invoice->due_date)->format('M d, Y') }}<br>
                        <strong>Billing Currency:</strong> {{ $invoice->currency_code }}
                    </div>
                </div>
            </td>
        </tr>
    </table>

    <!-- Line Items Table -->
    <table class="items-table">
        <thead>
            <tr>
                <th style="width: 48%;">Item Description</th>
                <th class="text-center" style="width: 14%;">Qty</th>
                <th class="text-right" style="width: 18%;">Unit Price</th>
                <th class="text-right" style="width: 20%;">Total Amount</th>
            </tr>
        </thead>
        <tbody>
            @foreach($invoice->items as $item)
                <tr>
                    <td style="font-weight: 600;">{{ $item->description }}</td>
                    <td class="text-center">{{ number_format($item->quantity, 2) }}</td>
                    <td class="text-right">{{ $invoice->currency_code }} {{ number_format($item->unit_price, 2) }}</td>
                    <td class="text-right" style="font-weight: 800; color: #0f172a;">
                        {{ $invoice->currency_code }} {{ number_format($item->amount, 2) }}
                    </td>
                </tr>
            @endforeach
        </tbody>
    </table>

    <!-- Totals Summary Section -->
    <div class="totals-wrapper">
        <table class="totals-table">
            <tr>
                <td class="label">Subtotal Amount:</td>
                <td class="val">{{ $invoice->currency_code }} {{ number_format($invoice->subtotal, 2) }}</td>
            </tr>
            @if($invoice->tax_rate > 0)
                <tr>
                    <td class="label">Tax ({{ number_format($invoice->tax_rate, 1) }}%):</td>
                    <td class="val">+ {{ $invoice->currency_code }} {{ number_format($invoice->tax_amount, 2) }}</td>
                </tr>
            @endif
            @if($invoice->discount > 0)
                <tr>
                    <td class="label">Discount:</td>
                    <td class="val" style="color: #166534;">- {{ $invoice->currency_code }} {{ number_format($invoice->discount, 2) }}</td>
                </tr>
            @endif
            <tr class="grand-total-row">
                <td class="label" style="color: #0f172a; font-weight: 900;">Grand Total:</td>
                <td class="val">{{ $invoice->currency_code }} {{ number_format($invoice->total_amount, 2) }}</td>
            </tr>
        </table>
        <div class="clear"></div>
    </div>

    <!-- Notes & Terms -->
    @if($invoice->notes || $invoice->terms)
        @if($invoice->notes)
            <div class="notes-card">
                <h5>Invoice Notes</h5>
                <p>{{ $invoice->notes }}</p>
            </div>
        @endif
        @if($invoice->terms)
            <div class="notes-card" style="border-left-color: #64748b; margin-top: 10px;">
                <h5>Terms & Conditions</h5>
                <p>{{ $invoice->terms }}</p>
            </div>
        @endif
    @endif

    <!-- Document Footer -->
    <div class="doc-footer">
        Thank you for your business! If you have any questions regarding this invoice, please contact {{ $company['email'] ?? 'support@saptatechnologies.com' }}.
    </div>

</body>
</html>
