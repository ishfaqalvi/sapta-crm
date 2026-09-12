<!DOCTYPE html>
<html lang="en">
<head>
    @php
        $isInvoice = in_array($quotation->status, ['accepted', 'paid']);
        $docTitle = $isInvoice ? 'Invoice' : 'Quotation';
    @endphp
    <meta charset="UTF-8">
    <title>{{ $docTitle }} {{ $quotation->quotation_number }}</title>
    <style>
        @page {
            size: A4 portrait;
            margin: 0;
        }

        * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
        }

        body {
            font-family: 'Helvetica Neue', Helvetica, Arial, 'DejaVu Sans', sans-serif;
            background-color: #ffffff;
            color: #0f172a;
            font-size: 13px;
            line-height: 1.45;
            padding: 32px 42px;
            margin: 0;
            position: relative;
        }

        /* Diagonal Status Ribbon */
        .status-corner-banner {
            position: absolute;
            top: 0px;
            right: 0px;
            width: 130px;
            height: 130px;
            overflow: hidden;
            z-index: 100;
        }
        .status-corner-ribbon {
            position: absolute;
            top: 26px;
            right: -32px;
            width: 140px;
            padding: 5px 0;
            text-align: center;
            font-size: 10.5px;
            font-weight: 900;
            letter-spacing: 1.5px;
            text-transform: uppercase;
            color: #ffffff;
            transform: rotate(45deg);
            -webkit-transform: rotate(45deg);
            box-shadow: 0 2px 4px rgba(0,0,0,0.15);
        }
        .ribbon-paid {
            background-color: #16a34a;
        }
        .ribbon-unpaid {
            background-color: #dc2626;
        }

        /* Status Badges */
        .status-badge {
            display: inline-block;
            padding: 3px 8px;
            font-size: 10px;
            font-weight: 900;
            text-transform: uppercase;
            border-radius: 4px;
            letter-spacing: 0.5px;
            margin-top: 4px;
        }
        .status-paid {
            background-color: #dcfce7;
            color: #15803d;
            border: 1px solid #86efac;
        }
        .status-unpaid {
            background-color: #fee2e2;
            color: #b91c1c;
            border: 1px solid #fca5a5;
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
            page-break-inside: avoid;
        }

        /* Signature Section */
        .signature-wrapper {
            margin-top: 36px;
            width: 100%;
            page-break-inside: avoid;
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
    </style>
</head>
<body>

    @php
        $logoData = null;
        $logoMime = 'image/png';
        if (!empty($quotation->company_logo)) {
            $cleanLogo = ltrim($quotation->company_logo, '/');
            $candidates = [
                public_path($cleanLogo),
                storage_path('app/public/' . $cleanLogo),
                base_path($cleanLogo),
            ];
            foreach ($candidates as $candidate) {
                if (file_exists($candidate) && !is_dir($candidate)) {
                    $logoData = base64_encode(file_get_contents($candidate));
                    $logoMime = mime_content_type($candidate) ?: 'image/png';
                    break;
                }
            }
        }

        $sigData = null;
        $sigMime = 'image/png';
        if (!empty($quotation->signature_image)) {
            $cleanSig = ltrim($quotation->signature_image, '/');
            $candidates = [
                public_path($cleanSig),
                storage_path('app/public/' . $cleanSig),
                base_path($cleanSig),
            ];
            foreach ($candidates as $candidate) {
                if (file_exists($candidate) && !is_dir($candidate)) {
                    $sigData = base64_encode(file_get_contents($candidate));
                    $sigMime = mime_content_type($candidate) ?: 'image/png';
                    break;
                }
            }
        }

        $companyDisplay = $quotation->company_name ?: ($client?->company_name ?: ($client?->name ?: ''));
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

    @if($isInvoice)
        <!-- Diagonal Status Ribbon for Invoices -->
        <div class="status-corner-banner">
            @if($quotation->status === 'paid')
                <div class="status-corner-ribbon ribbon-paid">PAID</div>
            @else
                <div class="status-corner-ribbon ribbon-unpaid">UNPAID</div>
            @endif
        </div>
    @endif

    <!-- Header Block -->
    <table class="table-layout">
        <tr>
            <!-- Left: Client Company Logo / Brand Block -->
            <td style="width: 25%; vertical-align: middle;">
                @if($logoData)
                    <img src="data:{{ $logoMime }};base64,{{ $logoData }}" style="max-height: 80px; max-width: 160px; object-fit: contain;" alt="Company Logo" />
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
                            <span><strong style="color: #002b66;">WhatsApp:</strong> {{ $quotation->company_whatsapp }}</span>
                        @endif
                        @if($quotation->company_whatsapp && $quotation->company_email)
                            <span style="color: #94a3b8; margin: 0 8px;">&bull;</span>
                        @endif
                        @if($quotation->company_email)
                            <span><strong style="color: #002b66;">Email:</strong> {{ $quotation->company_email }}</span>
                        @endif
                    </div>
                </div>
            </td>

            <!-- Right: Quotation / Invoice Title -->
            <td style="width: 25%; text-align: right; vertical-align: middle;">
                <div class="quotation-main-title">{{ $docTitle }}</div>
                @if($isInvoice)
                    <div style="margin-top: 4px;">
                        @if($quotation->status === 'paid')
                            <span class="status-badge status-paid">PAID</span>
                        @else
                            <span class="status-badge status-unpaid">UNPAID</span>
                        @endif
                    </div>
                @endif
            </td>
        </tr>
    </table>

    <hr class="header-hr">

    @php
        $hasRecipient = !empty(trim($quotation->customer_name ?? '')) 
            || !empty(trim($quotation->customer_phone ?? '')) 
            || !empty(trim($quotation->customer_email ?? '')) 
            || !empty(trim($quotation->customer_address ?? ''))
            || !empty(trim($quotation->customer_prefix ?? ''));
    @endphp

    <!-- Recipient & Meta Section -->
    <table class="table-layout">
        <tr>
            <td style="width: 55%;">
                @if($hasRecipient)
                    <div class="to-section">
                        <div class="to-title">To,</div>
                        @if(!empty(trim($quotation->customer_name ?? '')))
                            <div class="to-name">
                                {{ $quotation->customer_prefix ? $quotation->customer_prefix . ' ' : '' }}{{ $quotation->customer_name }}
                            </div>
                        @endif
                        @if(!empty(trim($quotation->customer_phone ?? '')))
                            <div class="to-phone">Phone: {{ $quotation->customer_phone }}</div>
                        @endif
                        @if(!empty(trim($quotation->customer_email ?? '')))
                            <div class="to-phone">Email: {{ $quotation->customer_email }}</div>
                        @endif
                        @if(!empty(trim($quotation->customer_address ?? '')))
                            <div class="to-phone">Address: {{ $quotation->customer_address }}</div>
                        @endif
                    </div>
                @endif
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
        <div>{{ $quotation->opening_text ?: "We thank you for providing us with an opportunity to submit our quotation for shifting your home furniture and appliances. Our prices are reasonable; our staff are professional and well trained to handle all your stuff and equipment's with care. Please find the complete details and expenses to cover this operation." }}</div>
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
        {{ $quotation->closing_text ?: 'In case of any queries, kindly get in touch with us. Thank you and I look forward to hearing from you.' }}
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
                {{ $quotation->authorized_by_text ?: ($companyDisplay ? 'For, ' . $companyDisplay : '') }}
            </div>
            @if($sigData)
                <div style="min-height: 64px; text-align: center;">
                    <img src="data:{{ $sigMime }};base64,{{ $sigData }}" class="signature-img" alt="Signature" />
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

</body>
</html>
