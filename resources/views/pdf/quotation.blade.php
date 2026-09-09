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
        * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
        }
        @page {
            margin: 28px 32px;
        }
        body {
            font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
            font-size: 11px;
            color: #0f172a;
            background-color: #ffffff;
            padding: 5px 10px;
            line-height: 1.45;
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
            font-size: 20px;
            font-weight: 900;
            color: #002b66;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-bottom: 3px;
        }
        .company-contact {
            font-size: 11px;
            color: #1e293b;
            font-weight: 500;
            line-height: 1.4;
        }
        .quotation-main-title {
            font-size: 26px;
            font-weight: 900;
            color: #0f172a;
            letter-spacing: -0.5px;
            text-align: right;
            text-transform: capitalize;
        }

        .header-hr {
            border: none;
            border-top: 1px solid #94a3b8;
            margin: 14px 0 16px 0;
        }

        /* Recipient & Meta */
        .to-section {
            font-size: 12px;
            color: #0f172a;
            line-height: 1.45;
        }
        .to-title {
            font-size: 12px;
            font-weight: 700;
            color: #0f172a;
            margin-bottom: 2px;
        }
        .to-name {
            font-size: 14px;
            font-weight: 900;
            color: #0f172a;
        }
        .to-company {
            font-size: 11px;
            font-weight: 600;
            color: #475569;
            margin-top: 2px;
        }
        .to-phone {
            font-size: 11px;
            font-weight: 500;
            color: #64748b;
            margin-top: 2px;
        }

        .meta-section {
            text-align: right;
            font-size: 12px;
            line-height: 1.55;
            color: #0f172a;
        }
        .meta-section strong {
            font-weight: 900;
            color: #0f172a;
        }
        .meta-valid {
            font-size: 11px;
            color: #64748b;
            margin-top: 2px;
        }

        /* Salutation */
        .salutation-block {
            margin: 16px 0 12px 0;
            font-size: 12px;
            color: #0f172a;
            line-height: 1.5;
        }
        .salutation-block .greeting {
            font-weight: 800;
            margin-bottom: 3px;
        }

        /* Table */
        .items-table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 10px;
        }
        .items-table th {
            background-color: #cbd5e1;
            color: #003796;
            font-size: 11px;
            font-weight: 900;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            padding: 9px 10px;
            border-top: 2px solid #003796;
            border-bottom: 2px solid #003796;
        }
        .items-table td {
            padding: 10px 10px;
            font-size: 11.5px;
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
            padding: 10px 12px;
            font-weight: 900;
            font-size: 12px;
            color: #0f172a;
        }

        /* Notes & Closing */
        .closing-text {
            margin-top: 20px;
            font-size: 12px;
            font-weight: 600;
            color: #0f172a;
        }

        .notes-terms-box {
            margin-top: 18px;
            padding: 12px 14px;
            background-color: #f8fafc;
            border: 1px solid #e2e8f0;
            border-left: 4px solid #003796;
            border-radius: 6px;
            font-size: 11px;
            color: #334155;
            line-height: 1.5;
        }

        /* Signature Section */
        .signature-wrapper {
            margin-top: 32px;
            width: 100%;
        }
        .signature-box {
            float: right;
            text-align: center;
            width: 260px;
        }
        .company-for {
            font-size: 12px;
            font-weight: 900;
            color: #0f172a;
            text-transform: uppercase;
            margin-bottom: 4px;
        }
        .signature-img {
            max-height: 58px;
            max-width: 190px;
            margin: 2px auto;
            display: block;
        }
        .auth-sig-label {
            font-size: 10.5px;
            font-weight: 900;
            letter-spacing: 0.8px;
            color: #1e293b;
            text-transform: uppercase;
            border-top: 1px solid #334155;
            padding-top: 5px;
            margin-top: 4px;
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
            $fullLogoPath = public_path($cleanLogo);
            if (file_exists($fullLogoPath)) {
                $logoData = base64_encode(file_get_contents($fullLogoPath));
                $logoMime = mime_content_type($fullLogoPath) ?: 'image/png';
            }
        }

        $sigData = null;
        $sigMime = 'image/png';
        if (!empty($quotation->signature_image)) {
            $cleanSig = ltrim($quotation->signature_image, '/');
            $fullSigPath = public_path($cleanSig);
            if (file_exists($fullSigPath)) {
                $sigData = base64_encode(file_get_contents($fullSigPath));
                $sigMime = mime_content_type($fullSigPath) ?: 'image/png';
            }
        }

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

    <!-- Header Block -->
    <table class="table-layout">
        <tr>
            <!-- Left: Client Company Logo / Brand Block -->
            <td style="width: 25%; vertical-align: middle;">
                @if($logoData)
                    <img src="data:{{ $logoMime }};base64,{{ $logoData }}" style="max-height: 75px; max-width: 150px; object-fit: contain;" alt="Company Logo" />
                @else
                    <table style="border-collapse: collapse;">
                        <tr>
                            <td style="width: 44px; height: 44px; background-color: #003796; color: #ffffff; text-align: center; vertical-align: middle; border-radius: 10px; font-weight: 900; font-size: 16px;">
                                {{ $initials }}
                            </td>
                            <td style="padding-left: 8px; vertical-align: middle;">
                                <div style="font-size: 9px; font-weight: 900; color: #1e293b; text-transform: uppercase;">{{ $companyDisplay }}</div>
                                <div style="font-size: 8px; font-weight: 800; color: #1d4ed8; text-transform: uppercase; letter-spacing: 0.5px;">{{ $isInvoice ? 'OFFICIAL INVOICE' : 'OFFICIAL QUOTE' }}</div>
                            </td>
                        </tr>
                    </table>
                @endif
            </td>

            <!-- Center: Company Details -->
            <td style="width: 50%; text-align: center; vertical-align: middle; padding: 0 10px;">
                <div class="company-header-title">{{ $companyDisplay }}</div>
                <div class="company-contact">
                    @if($quotation->company_phone)
                        <div>{{ $quotation->company_phone }}</div>
                    @endif
                    @if($quotation->company_address)
                        <div>{{ $quotation->company_address }}</div>
                    @endif
                    <div style="margin-top: 2px;">
                        @if($quotation->company_whatsapp)
                            <span>WhatsApp: {{ $quotation->company_whatsapp }}</span>
                        @endif
                        @if($quotation->company_email)
                            <span style="margin-left: 10px;">Email: {{ $quotation->company_email }}</span>
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

    <!-- Line Items Table (Clean 3-column layout matching show.tsx) -->
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
                    <td colspan="2" class="text-right" style="font-weight: 700; padding: 7px 10px; border-bottom: 1px solid #e2e8f0; color: #475569;">Subtotal:</td>
                    <td class="text-right" style="font-weight: 800; padding: 7px 10px; border-bottom: 1px solid #e2e8f0;">
                        {{ $quotation->currency_code }} {{ number_format($quotation->subtotal, 2) }}
                    </td>
                </tr>
                @if($quotation->tax_rate > 0)
                    <tr>
                        <td colspan="2" class="text-right" style="font-weight: 700; padding: 6px 10px; border-bottom: 1px solid #e2e8f0; color: #475569;">Tax ({{ number_format($quotation->tax_rate, 1) }}%):</td>
                        <td class="text-right" style="font-weight: 800; padding: 6px 10px; border-bottom: 1px solid #e2e8f0;">
                            {{ $quotation->currency_code }} {{ number_format($quotation->tax_amount, 2) }}
                        </td>
                    </tr>
                @endif
                @if($quotation->discount > 0)
                    <tr>
                        <td colspan="2" class="text-right" style="font-weight: 700; padding: 6px 10px; border-bottom: 1px solid #e2e8f0; color: #166534;">Discount:</td>
                        <td class="text-right" style="font-weight: 800; padding: 6px 10px; border-bottom: 1px solid #e2e8f0; color: #166534;">
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
                <td class="text-right" style="font-weight: 900; font-size: 13px; color: #0f172a;">
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
                <div style="font-weight: 800; margin-bottom: 2px;">NOTES:</div>
                <div style="margin-bottom: 6px;">{{ $quotation->notes }}</div>
            @endif
            @if($quotation->terms)
                <div style="font-weight: 800; margin-bottom: 2px;">TERMS:</div>
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
            @if($sigData)
                <div style="min-height: 56px; text-align: center;">
                    <img src="data:{{ $sigMime }};base64,{{ $sigData }}" class="signature-img" alt="Signature" />
                </div>
            @else
                <div style="height: 56px;"></div>
            @endif
            <div class="auth-sig-label">
                AUTHORIZED SIGNATURE
            </div>
        </div>
        <div class="clear"></div>
    </div>

</body>
</html>
