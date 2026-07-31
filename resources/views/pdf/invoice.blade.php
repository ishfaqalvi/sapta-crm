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
            font-size: 12px;
            color: #1e293b;
            background-color: #ffffff;
            padding: 30px;
            line-height: 1.5;
        }
        .header-table, .details-table, .items-table, .totals-table {
            width: 100%;
            border-collapse: collapse;
        }
        .header-table td {
            vertical-align: top;
        }
        .company-logo {
            font-size: 22px;
            font-weight: 800;
            color: #0052D4;
            letter-spacing: -0.5px;
            text-transform: uppercase;
        }
        .company-subtext {
            font-size: 10px;
            color: #64748b;
            margin-top: 2px;
        }
        .invoice-title {
            text-align: right;
            font-size: 24px;
            font-weight: 800;
            color: #0f172a;
            text-transform: uppercase;
            letter-spacing: 1px;
        }
        .invoice-number {
            text-align: right;
            font-size: 13px;
            font-weight: 700;
            color: #0052D4;
            margin-top: 2px;
        }
        .status-badge {
            display: inline-block;
            padding: 3px 8px;
            font-size: 10px;
            font-weight: 800;
            text-transform: uppercase;
            border-radius: 4px;
            margin-top: 5px;
        }
        .status-paid { background-color: #dcfce7; color: #15803d; }
        .status-sent { background-color: #dbeafe; color: #1d4ed8; }
        .status-draft { background-color: #f1f5f9; color: #475569; }
        .status-overdue { background-color: #ffe4e6; color: #be123c; }

        .divider {
            height: 2px;
            background: linear-gradient(to right, #003796, #0052D4, #1d4ed8);
            margin: 20px 0;
            border-radius: 2px;
        }

        .details-table td {
            width: 50%;
            vertical-align: top;
        }
        .section-heading {
            font-size: 10px;
            font-weight: 800;
            text-transform: uppercase;
            color: #94a3b8;
            letter-spacing: 0.5px;
            margin-bottom: 6px;
        }
        .info-block p {
            font-size: 11px;
            color: #334155;
            margin-bottom: 2px;
        }
        .info-block strong {
            color: #0f172a;
        }

        .items-table {
            margin-top: 25px;
            border: 1px solid #e2e8f0;
            border-radius: 6px;
            overflow: hidden;
        }
        .items-table th {
            background-color: #f8fafc;
            color: #475569;
            font-size: 10px;
            font-weight: 800;
            text-transform: uppercase;
            padding: 10px 12px;
            border-bottom: 1px solid #cbd5e1;
            text-align: left;
        }
        .items-table td {
            padding: 10px 12px;
            border-bottom: 1px solid #f1f5f9;
            font-size: 11px;
            color: #334155;
        }
        .items-table tr:nth-child(even) {
            background-color: #fafafa;
        }

        .text-right { text-align: right; }
        .text-center { text-align: center; }

        .summary-container {
            margin-top: 20px;
            width: 100%;
        }
        .summary-table {
            width: 320px;
            float: right;
            border-collapse: collapse;
        }
        .summary-table td {
            padding: 6px 10px;
            font-size: 11px;
        }
        .summary-table .label {
            color: #64748b;
            font-weight: 600;
        }
        .summary-table .value {
            text-align: right;
            font-weight: 700;
            color: #0f172a;
        }
        .summary-table .total-row td {
            border-top: 2px solid #0052D4;
            padding-top: 10px;
            font-size: 13px;
        }
        .summary-table .total-row .value {
            color: #0052D4;
            font-weight: 800;
        }
        .summary-table .pkr-converted td {
            background-color: #f0fdf4;
            font-size: 11px;
            color: #166534;
            padding: 8px 10px;
            border-radius: 4px;
        }

        .clear { clear: both; }

        .footer-section {
            margin-top: 40px;
            padding-top: 15px;
            border-top: 1px solid #e2e8f0;
            font-size: 10px;
            color: #64748b;
        }
        .footer-section h4 {
            font-size: 10px;
            text-transform: uppercase;
            color: #334155;
            margin-bottom: 4px;
        }
    </style>
</head>
<body>

    <!-- Header Section -->
    <table class="header-table">
        <tr>
            <td>
                <div class="company-logo">{{ $company['name'] ?? 'SAPTA TECHNOLOGIES' }}</div>
                <div class="company-subtext">{{ $company['email'] ?? 'contact@saptatechnologies.com' }}</div>
                <div class="company-subtext">{{ $company['phone'] ?? '' }}</div>
                <div class="company-subtext">{{ $company['address'] ?? '' }}</div>
                @if(!empty($company['tax_id']))
                    <div class="company-subtext">Tax ID: {{ $company['tax_id'] }}</div>
                @endif
            </td>
            <td class="text-right">
                <div class="invoice-title">INVOICE</div>
                <div class="invoice-number">{{ $invoice->invoice_number }}</div>
                <div>
                    <span class="status-badge status-{{ strtolower($invoice->status) }}">
                        {{ strtoupper($invoice->status) }}
                    </span>
                </div>
            </td>
        </tr>
    </table>

    <div class="divider"></div>

    <!-- Details Section -->
    <table class="details-table">
        <tr>
            <td>
                <div class="section-heading">Billed To</div>
                <div class="info-block">
                    <p><strong>{{ $invoice->client->company_name ?? $invoice->client->name }}</strong></p>
                    <p>Attn: {{ $invoice->client->name }}</p>
                    <p>{{ $invoice->client->email }}</p>
                    @if($invoice->client->phone)
                        <p>Phone: {{ $invoice->client->phone }}</p>
                    @endif
                    @if($invoice->websiteProject)
                        <p style="margin-top: 4px;"><strong>Project:</strong> {{ $invoice->websiteProject->project_name }}</p>
                    @endif
                </div>
            </td>
            <td>
                <div class="section-heading text-right">Invoice Information</div>
                <div class="info-block text-right">
                    <p><strong>Issue Date:</strong> {{ \Carbon\Carbon::parse($invoice->issue_date)->format('M d, Y') }}</p>
                    <p><strong>Due Date:</strong> {{ \Carbon\Carbon::parse($invoice->due_date)->format('M d, Y') }}</p>
                    <p><strong>Billing Currency:</strong> {{ $invoice->currency_code }}</p>
                    @if($invoice->currency_code !== 'PKR')
                        <p><strong>Exchange Rate:</strong> 1 {{ $invoice->currency_code }} = PKR {{ number_format($invoice->exchange_rate_to_pkr, 2) }}</p>
                    @endif
                </div>
            </td>
        </tr>
    </table>

    <!-- Line Items Table -->
    <table class="items-table">
        <thead>
            <tr>
                <th style="width: 50%;">Description</th>
                <th class="text-center" style="width: 15%;">Qty</th>
                <th class="text-right" style="width: 17%;">Unit Price</th>
                <th class="text-right" style="width: 18%;">Amount ({{ $invoice->currency_code }})</th>
            </tr>
        </thead>
        <tbody>
            @foreach($invoice->items as $item)
                <tr>
                    <td>{{ $item->description }}</td>
                    <td class="text-center">{{ number_format($item->quantity, 2) }}</td>
                    <td class="text-right">{{ $invoice->currency_code }} {{ number_format($item->unit_price, 2) }}</td>
                    <td class="text-right" style="font-weight: 700;">{{ $invoice->currency_code }} {{ number_format($item->amount, 2) }}</td>
                </tr>
            @endforeach
        </tbody>
    </table>

    <!-- Totals Summary -->
    <div class="summary-container">
        <table class="summary-table">
            <tr>
                <td class="label">Subtotal:</td>
                <td class="value">{{ $invoice->currency_code }} {{ number_format($invoice->subtotal, 2) }}</td>
            </tr>
            @if($invoice->tax_rate > 0)
                <tr>
                    <td class="label">Tax ({{ number_format($invoice->tax_rate, 1) }}%):</td>
                    <td class="value">{{ $invoice->currency_code }} {{ number_format($invoice->tax_amount, 2) }}</td>
                </tr>
            @endif
            @if($invoice->discount > 0)
                <tr>
                    <td class="label">Discount:</td>
                    <td class="value">- {{ $invoice->currency_code }} {{ number_format($invoice->discount, 2) }}</td>
                </tr>
            @endif
            <tr class="total-row">
                <td class="label" style="color: #0f172a; font-weight: 800;">Total Amount:</td>
                <td class="value">{{ $invoice->currency_code }} {{ number_format($invoice->total_amount, 2) }}</td>
            </tr>
            @if($invoice->currency_code !== 'PKR')
                <tr class="pkr-converted">
                    <td class="label" style="color: #166534; font-weight: 700;">PKR Converted Total:</td>
                    <td class="value" style="color: #166534; font-weight: 800;">PKR {{ number_format($invoice->total_amount_pkr, 2) }}</td>
                </tr>
            @endif
        </table>
        <div class="clear"></div>
    </div>

    <!-- Notes & Terms -->
    @if($invoice->notes || $invoice->terms)
        <div class="footer-section">
            @if($invoice->notes)
                <div style="margin-bottom: 10px;">
                    <h4>Notes</h4>
                    <p>{{ $invoice->notes }}</p>
                </div>
            @endif
            @if($invoice->terms)
                <div>
                    <h4>Terms & Conditions</h4>
                    <p>{{ $invoice->terms }}</p>
                </div>
            @endif
        </div>
    @endif

</body>
</html>
