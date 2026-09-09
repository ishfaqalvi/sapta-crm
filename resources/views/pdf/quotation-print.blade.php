<!DOCTYPE html>
<html lang="en">
<head>
    @php
        $isInvoice = in_array($quotation->status, ['accepted', 'paid']);
        $docTitle = $isInvoice ? 'Invoice' : 'Quotation';
    @endphp
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{ $docTitle }} {{ $quotation->quotation_number }} - Print</title>
    <style>
        * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
        }

        body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
            background-color: #f1f5f9;
            color: #0f172a;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
        }

        /* Top Action Bar (Hidden on Print) */
        .print-actions-bar {
            position: sticky;
            top: 0;
            left: 0;
            right: 0;
            background: rgba(15, 23, 42, 0.9);
            backdrop-filter: blur(12px);
            color: #ffffff;
            padding: 12px 24px;
            display: flex;
            align-items: center;
            justify-content: space-between;
            z-index: 100;
            box-shadow: 0 4px 20px rgba(0,0,0,0.15);
        }

        .bar-left {
            display: flex;
            align-items: center;
            gap: 12px;
        }

        .doc-tag {
            background: #003796;
            color: white;
            font-weight: 800;
            font-size: 11px;
            padding: 4px 10px;
            border-radius: 9999px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }

        .bar-title {
            font-size: 14px;
            font-weight: 700;
        }

        .bar-actions {
            display: flex;
            align-items: center;
            gap: 8px;
        }

        .btn {
            display: inline-flex;
            align-items: center;
            gap: 6px;
            padding: 8px 16px;
            font-size: 12px;
            font-weight: 700;
            border-radius: 8px;
            border: none;
            cursor: pointer;
            text-decoration: none;
            transition: all 0.15s ease;
        }

        .btn-primary {
            background-color: #2563eb;
            color: white;
        }
        .btn-primary:hover {
            background-color: #1d4ed8;
        }

        .btn-secondary {
            background-color: #334155;
            color: white;
        }
        .btn-secondary:hover {
            background-color: #475569;
        }

        /* Printable Paper Container */
        .paper-container {
            max-width: 820px;
            margin: 24px auto 40px auto;
            background: #ffffff;
            border-radius: 16px;
            box-shadow: 0 10px 30px -5px rgba(0, 0, 0, 0.08), 0 0 0 1px rgba(0, 0, 0, 0.05);
            padding: 40px 48px;
        }

        .w-full { width: 100%; }
        .table-layout {
            width: 100%;
            border-collapse: collapse;
        }
        .table-layout td {
            vertical-align: top;
        }

        /* Header Layout */
        .company-header-title {
            font-size: 22px;
            font-weight: 900;
            color: #002b66;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-bottom: 3px;
        }
        .company-contact {
            font-size: 12px;
            color: #1e293b;
            font-weight: 500;
            line-height: 1.45;
        }
        .quotation-main-title {
            font-size: 28px;
            font-weight: 900;
            color: #0f172a;
            letter-spacing: -0.5px;
            text-align: right;
            text-transform: capitalize;
        }

        .header-hr {
            border: none;
            border-top: 1px solid #94a3b8;
            margin: 18px 0 20px 0;
        }

        /* Recipient & Meta */
        .to-section {
            font-size: 13px;
            color: #0f172a;
            line-height: 1.45;
        }
        .to-title {
            font-size: 13px;
            font-weight: 700;
            color: #0f172a;
            margin-bottom: 2px;
        }
        .to-name {
            font-size: 16px;
            font-weight: 900;
            color: #0f172a;
        }
        .to-company {
            font-size: 12px;
            font-weight: 600;
            color: #475569;
            margin-top: 2px;
        }
        .to-phone {
            font-size: 12px;
            font-weight: 500;
            color: #64748b;
            margin-top: 2px;
        }

        .meta-section {
            text-align: right;
            font-size: 13px;
            line-height: 1.6;
            color: #0f172a;
        }
        .meta-section strong {
            font-weight: 900;
            color: #0f172a;
        }
        .meta-valid {
            font-size: 12px;
            color: #64748b;
            margin-top: 2px;
        }

        /* Salutation */
        .salutation-block {
            margin: 18px 0 14px 0;
            font-size: 13px;
            color: #0f172a;
            line-height: 1.55;
        }
        .salutation-block .greeting {
            font-weight: 800;
            margin-bottom: 3px;
        }

        /* Items Table */
        .items-table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 10px;
        }
        .items-table th {
            background-color: #cbd5e1;
            color: #003796;
            font-size: 12px;
            font-weight: 900;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            padding: 10px 12px;
            border-top: 2px solid #003796;
            border-bottom: 2px solid #003796;
        }
        .items-table td {
            padding: 12px 12px;
            font-size: 12.5px;
            color: #0f172a;
            border-bottom: 1px solid #e2e8f0;
            vertical-align: top;
        }
        .items-table th.text-center,
        .items-table td.text-center,
        .text-center { text-align: center !important; }
        .items-table th.text-right,
        .items-table td.text-right,
        .text-right { text-align: right !important; }
        .items-table th.text-left,
        .items-table td.text-left,
        .text-left { text-align: left !important; }

        /* Grand Total Box */
        .grand-total-row td {
            background-color: #cbd5e1;
            border-top: 2px solid #94a3b8;
            border-bottom: 2px solid #94a3b8;
            padding: 12px 14px;
            font-weight: 900;
            font-size: 13.5px;
            color: #0f172a;
        }

        /* Notes & Closing */
        .closing-text {
            margin-top: 22px;
            font-size: 13px;
            font-weight: 600;
            color: #0f172a;
        }

        .notes-terms-box {
            margin-top: 20px;
            padding: 14px 18px;
            background-color: #f8fafc;
            border: 1px solid #e2e8f0;
            border-left: 4px solid #003796;
            border-radius: 8px;
            font-size: 12px;
            color: #334155;
            line-height: 1.55;
        }

        /* Signature Section */
        .signature-wrapper {
            margin-top: 36px;
            width: 100%;
        }
        .signature-box {
            float: right;
            text-align: center;
            width: 270px;
        }
        .company-for {
            font-size: 13px;
            font-weight: 900;
            color: #0f172a;
            text-transform: uppercase;
            margin-bottom: 6px;
        }
        .signature-img {
            max-height: 64px;
            max-width: 200px;
            margin: 4px auto;
            display: block;
        }
        .auth-sig-label {
            font-size: 11px;
            font-weight: 900;
            letter-spacing: 0.8px;
            color: #1e293b;
            text-transform: uppercase;
            border-top: 1px solid #334155;
            padding-top: 6px;
            margin-top: 6px;
        }
        .clear { clear: both; }

        /* Print Media Styles */
        @media print {
            body {
                background-color: #ffffff;
                padding: 0;
            }
            .print-actions-bar {
                display: none !important;
            }
            .paper-container {
                max-width: 100% !important;
                margin: 0 !important;
                padding: 0 !important;
                box-shadow: none !important;
                border-radius: 0 !important;
                border: none !important;
            }
            @page {
                size: A4 portrait;
                margin: 12mm 15mm;
            }
        }
    </style>
</head>
<body>

    <!-- Floating Top Bar for user convenience -->
    <div class="print-actions-bar">
        <div class="bar-left">
            <span class="doc-tag">{{ $docTitle }}</span>
            <span class="bar-title">{{ $quotation->quotation_number }} &bull; {{ $quotation->customer_name }}</span>
        </div>
        <div class="bar-actions">
            <button type="button" onclick="window.print()" class="btn btn-primary">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 6 2 18 2 18 9"></polyline><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path><rect x="6" y="14" width="12" height="8"></rect></svg>
                <span>Print Document</span>
            </button>
            <a href="{{ route('client-portal.quotations.pdf', $quotation->id) }}" class="btn btn-secondary">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
                <span>Download PDF</span>
            </a>
            <button type="button" onclick="window.close()" class="btn btn-secondary">
                <span>Close</span>
            </button>
        </div>
    </div>

    @php
        $companyDisplay = $quotation->company_name ?: ($client->company_name ?: $client->name ?: 'AL MUSTAFA FURNITURE MOVERS');
        $initials = 'Q';
        if ($companyDisplay) {
            $parts = preg_split('/\s+/', trim($companyDisplay));
            if (count($parts) >= 2) {
                $initials = strtoupper(substr($parts[0], 0, 1) . substr($parts[1], 0, 1));
            } else {
                $initials = strtoupper(substr($companyDisplay, 0, 2));
            }
        }
    @endphp

    <div class="paper-container">
        <!-- Header Block -->
        <table class="table-layout">
            <tr>
                <!-- Left: Client Company Logo / Brand Block -->
                <td style="width: 25%; vertical-align: middle;">
                    @if($quotation->company_logo)
                        <img src="{{ asset(ltrim($quotation->company_logo, '/')) }}" style="max-height: 80px; max-width: 160px; object-fit: contain;" alt="Company Logo" />
                    @else
                        <table style="border-collapse: collapse;">
                            <tr>
                                <td style="width: 48px; height: 48px; background-color: #003796; color: #ffffff; text-align: center; vertical-align: middle; border-radius: 12px; font-weight: 900; font-size: 18px;">
                                    {{ $initials }}
                                </td>
                                <td style="padding-left: 10px; vertical-align: middle;">
                                    <div style="font-size: 10px; font-weight: 900; color: #1e293b; text-transform: uppercase;">{{ $companyDisplay }}</div>
                                    <div style="font-size: 9px; font-weight: 800; color: #1d4ed8; text-transform: uppercase; letter-spacing: 0.5px;">{{ $isInvoice ? 'OFFICIAL INVOICE' : 'OFFICIAL QUOTE' }}</div>
                                </td>
                            </tr>
                        </table>
                    @endif
                </td>

                <!-- Center: Company Details -->
                <td style="width: 50%; text-align: center; vertical-align: middle; padding: 0 12px;">
                    <div class="company-header-title">{{ $companyDisplay }}</div>
                    <div class="company-contact">
                        @if($quotation->company_phone)
                            <div>{{ $quotation->company_phone }}</div>
                        @endif
                        @if($quotation->company_address)
                            <div>{{ $quotation->company_address }}</div>
                        @endif
                        <div style="margin-top: 3px;">
                            @if($quotation->company_whatsapp)
                                <span>📱 {{ $quotation->company_whatsapp }}</span>
                            @endif
                            @if($quotation->company_email)
                                <span style="margin-left: 10px;">✉️ {{ $quotation->company_email }}</span>
                            @endif
                        </div>
                    </div>
                </td>

                <!-- Right: Quotation / Invoice Title -->
                <td style="width: 25%; text-align: right; vertical-align: middle;">
                    <div class="quotation-main-title">{{ $docTitle }}</div>
                </td>
            </tr>
        </table>

        <hr class="header-hr">

        <!-- Recipient & Meta Section -->
        <table class="table-layout">
            <tr>
                <td style="width: 55%;">
                    <div class="to-section">
                        <div class="to-title">To,</div>
                        <div class="to-name">
                            {{ $quotation->customer_prefix ?: 'Mr/Mrs' }} {{ $quotation->customer_name }}
                        </div>
                        @if($quotation->client?->company_name && $quotation->client?->company_name !== $quotation->customer_name)
                            <div class="to-company">{{ $quotation->client->company_name }}</div>
                        @endif
                        @if($quotation->customer_phone)
                            <div class="to-phone">Phone: {{ $quotation->customer_phone }}</div>
                        @endif
                    </div>
                </td>
                <td style="width: 45%;">
                    <div class="meta-section">
                        <div><strong>{{ $docTitle }}#</strong> &nbsp; {{ $quotation->quotation_number }}</div>
                        <div style="margin-top: 2px;"><strong>Date:</strong> &nbsp; {{ \Carbon\Carbon::parse($quotation->date)->format('d/m/Y') }}</div>
                        @if($quotation->expiry_date)
                            <div class="meta-valid"><strong>Valid Until:</strong> &nbsp; {{ \Carbon\Carbon::parse($quotation->expiry_date)->format('d/m/Y') }}</div>
                        @endif
                    </div>
                </td>
            </tr>
        </table>

        <!-- Salutation & Inquiry Intro -->
        <div class="salutation-block">
            <div class="greeting">{{ $quotation->greeting ?: 'Dear Sir/Mam,' }}</div>
            <div>{{ $quotation->opening_text ?: 'Thank you for your valuable inquiry. We are pleased to quote as below' }}</div>
        </div>

        <!-- Line Items Table -->
        <table class="items-table">
            <thead>
                <tr>
                    <th class="text-center" style="width: 8%;">#</th>
                    <th class="text-left" style="width: 64%;">DESCRIPTION</th>
                    <th class="text-right" style="width: 28%;">AMOUNT</th>
                </tr>
            </thead>
            <tbody>
                @foreach($quotation->items as $index => $item)
                    @php
                        $cleanAmount = $item->amount > 0 ? (float) $item->amount : (float) $item->unit_price;
                    @endphp
                    <tr>
                        <td class="text-center" style="font-weight: 700; color: #475569;">{{ $index + 1 }}</td>
                        <td class="text-left" style="font-weight: 800; line-height: 1.4;">
                            {{ $item->description }}
                        </td>
                        <td class="text-right" style="font-weight: 900;">
                            {{ $quotation->currency_code }} {{ number_format($cleanAmount, 2) }}
                        </td>
                    </tr>
                @endforeach

                <!-- Subtotal / Taxes / Discount if applied -->
                @if($quotation->tax_rate > 0 || $quotation->discount > 0)
                    <tr>
                        <td colspan="2" class="text-right" style="font-weight: 700; padding: 8px 12px; border-bottom: 1px solid #e2e8f0; color: #475569;">Subtotal:</td>
                        <td class="text-right" style="font-weight: 800; padding: 8px 12px; border-bottom: 1px solid #e2e8f0;">
                            {{ $quotation->currency_code }} {{ number_format($quotation->subtotal, 2) }}
                        </td>
                    </tr>
                    @if($quotation->tax_rate > 0)
                        <tr>
                            <td colspan="2" class="text-right" style="font-weight: 700; padding: 7px 12px; border-bottom: 1px solid #e2e8f0; color: #475569;">Tax ({{ number_format($quotation->tax_rate, 1) }}%):</td>
                            <td class="text-right" style="font-weight: 800; padding: 7px 12px; border-bottom: 1px solid #e2e8f0;">
                                {{ $quotation->currency_code }} {{ number_format($quotation->tax_amount, 2) }}
                            </td>
                        </tr>
                    @endif
                    @if($quotation->discount > 0)
                        <tr>
                            <td colspan="2" class="text-right" style="font-weight: 700; padding: 7px 12px; border-bottom: 1px solid #e2e8f0; color: #166534;">Discount:</td>
                            <td class="text-right" style="font-weight: 800; padding: 7px 12px; border-bottom: 1px solid #e2e8f0; color: #166534;">
                                - {{ $quotation->currency_code }} {{ number_format($quotation->discount, 2) }}
                            </td>
                        </tr>
                    @endif
                @endif

                <!-- Grand Total Row -->
                <tr class="grand-total-row">
                    <td colspan="2" class="text-right" style="font-weight: 900; letter-spacing: 0.5px;">
                        GRAND TOTAL
                    </td>
                    <td class="text-right" style="font-weight: 900; font-size: 14px; color: #0f172a;">
                        {{ $quotation->currency_code }} {{ number_format($quotation->total_amount, 2) }}
                    </td>
                </tr>
            </tbody>
        </table>

        <!-- Closing Remarks -->
        <div class="closing-text">
            {{ $quotation->closing_text ?: 'We hope you find our offer to be in line with your requirement.' }}
        </div>

        <!-- Notes & Terms if any -->
        @if($quotation->notes || $quotation->terms)
            <div class="notes-terms-box">
                @if($quotation->notes)
                    <div style="font-weight: 800; margin-bottom: 3px;">NOTES:</div>
                    <div style="margin-bottom: 8px;">{{ $quotation->notes }}</div>
                @endif
                @if($quotation->terms)
                    <div style="font-weight: 800; margin-bottom: 3px;">TERMS:</div>
                    <div>{{ $quotation->terms }}</div>
                @endif
            </div>
        @endif

        <!-- Signature Block -->
        <div class="signature-wrapper">
            <div class="signature-box">
                <div class="company-for">
                    {{ $quotation->authorized_by_text ?: ('For, ' . $companyDisplay) }}
                </div>
                @if($quotation->signature_image)
                    <div style="min-height: 64px; text-align: center;">
                        <img src="{{ asset(ltrim($quotation->signature_image, '/')) }}" class="signature-img" alt="Signature" />
                    </div>
                @else
                    <div style="height: 64px;"></div>
                @endif
                <div class="auth-sig-label">
                    AUTHORIZED SIGNATURE
                </div>
            </div>
            <div class="clear"></div>
        </div>
    </div>

    <script>
        // Automatically trigger print after page loads
        window.addEventListener('DOMContentLoaded', () => {
            setTimeout(() => {
                window.print();
            }, 300);
        });
    </script>
</body>
</html>
