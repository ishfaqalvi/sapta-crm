<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Quotation {{ $quotation->quotation_number }}</title>
    <style>
        * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
        }
        body {
            font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
            font-size: 11px;
            color: #0f172a;
            background-color: #ffffff;
            padding: 30px 40px;
            line-height: 1.4;
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
            font-size: 18px;
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
            line-height: 1.35;
        }
        .quotation-main-title {
            font-size: 26px;
            font-weight: 900;
            color: #0f172a;
            letter-spacing: 0.5px;
            text-align: right;
        }

        .header-hr {
            border: none;
            border-top: 1px solid #94a3b8;
            margin: 14px 0 16px 0;
        }

        /* Recipient & Meta */
        .to-section {
            font-size: 12px;
            font-weight: 800;
            color: #0f172a;
            line-height: 1.4;
        }
        .meta-section {
            text-align: right;
            font-size: 12px;
            line-height: 1.5;
        }
        .meta-section strong {
            font-weight: 800;
            color: #0f172a;
        }

        /* Salutation */
        .salutation-block {
            margin: 18px 0 14px 0;
            font-size: 11.5px;
            color: #0f172a;
            line-height: 1.5;
        }
        .salutation-block .greeting {
            font-weight: 700;
            margin-bottom: 6px;
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
            font-size: 10.5px;
            font-weight: 900;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            padding: 8px 10px;
            border-top: 2px solid #003796;
            border-bottom: 2px solid #003796;
        }
        .items-table td {
            padding: 10px 10px;
            font-size: 11px;
            color: #0f172a;
            border-bottom: 1px dotted #cbd5e1;
            vertical-align: top;
        }
        .text-center { text-align: center; }
        .text-right { text-align: right; }
        .text-left { text-align: left; }

        /* Grand Total Box */
        .grand-total-row td {
            background-color: #e2e8f0;
            border-top: 2px solid #94a3b8;
            border-bottom: 2px solid #94a3b8;
            padding: 8px 12px;
            font-weight: 900;
            font-size: 12px;
            color: #0f172a;
        }

        /* Notes & Closing */
        .closing-text {
            margin-top: 24px;
            font-size: 11px;
            font-weight: 600;
            color: #0f172a;
        }

        .notes-terms-box {
            margin-top: 20px;
            padding: 10px 14px;
            background-color: #f8fafc;
            border-left: 3px solid #003796;
            border-radius: 4px;
            font-size: 10px;
            color: #475569;
        }

        /* Signature Section */
        .signature-wrapper {
            margin-top: 45px;
            width: 100%;
        }
        .signature-box {
            float: right;
            text-align: center;
            width: 260px;
        }
        .company-for {
            font-size: 12.5px;
            font-weight: 900;
            color: #0f172a;
            margin-bottom: 15px;
        }
        .signature-img {
            max-height: 45px;
            margin: 5px auto;
            display: block;
        }
        .signature-line {
            font-family: 'Brush Script MT', 'Segoe Script', cursive;
            font-size: 24px;
            color: #1e293b;
            margin: 5px 0;
        }
        .auth-sig-label {
            font-size: 10px;
            font-weight: 800;
            letter-spacing: 0.8px;
            color: #334155;
            text-transform: uppercase;
            border-top: 1px solid #64748b;
            padding-top: 4px;
            margin-top: 5px;
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
    @endphp

    <!-- Header Block -->
    <table class="table-layout">
        <tr>
            <!-- Left: Client Company Logo -->
            <td style="width: 25%; vertical-align: middle;">
                @if($logoData)
                    <img src="data:{{ $logoMime }};base64,{{ $logoData }}" style="max-height: 70px; max-width: 140px; object-fit: contain;" alt="Company Logo" />
                @else
                    <div style="display: inline-block; padding: 8px 12px; background-color: #f1f5f9; border: 1.5px solid #cbd5e1; border-radius: 6px; text-align: center;">
                        <span style="font-size: 13px; font-weight: 900; color: #003796; text-transform: uppercase;">{{ $quotation->company_name ?: ($client->company_name ?: $client->name) }}</span>
                    </div>
                @endif
            </td>

            <!-- Center: Company Details -->
            <td style="width: 50%; text-align: center; vertical-align: middle; padding: 0 10px;">
                <div class="company-header-title">{{ $quotation->company_name ?: ($client->company_name ?: $client->name ?: 'AL MUSTAFA FURNITURE MOVERS') }}</div>
                <div class="company-contact">
                    @if($quotation->company_phone)
                        <div>{{ $quotation->company_phone }}</div>
                    @endif
                    @if($quotation->company_address)
                        <div>{{ $quotation->company_address }}</div>
                    @endif
                    <div>
                        @if($quotation->company_whatsapp)
                            <span>&#x1F4F1; {{ $quotation->company_whatsapp }}</span>
                        @endif
                        @if($quotation->company_email)
                            <span style="margin-left: 8px;">&#x2709; {{ $quotation->company_email }}</span>
                        @endif
                    </div>
                </div>
            </td>

            <!-- Right: Quotation Title -->
            <td style="width: 25%; text-align: right; vertical-align: middle;">
                <div class="quotation-main-title">Quotation</div>
            </td>
        </tr>
    </table>

    <hr class="header-hr">

    <!-- Recipient & Meta Section -->
    <table class="table-layout">
        <tr>
            <td style="width: 55%;">
                <div class="to-section">
                    <div>To,</div>
                    <div style="margin-top: 2px;">
                        {{ $quotation->customer_prefix ?: 'Mr/Mrs' }} {{ $quotation->customer_name ?: ($quotation->client?->name ?? 'Valued Client') }}
                    </div>
                    @if($quotation->client?->company_name && $quotation->client?->company_name !== $quotation->customer_name)
                        <div style="font-weight: 600; font-size: 11px; color: #475569;">{{ $quotation->client->company_name }}</div>
                    @endif
                    @if($quotation->customer_phone)
                        <div style="font-weight: 500; font-size: 10.5px; color: #64748b;">Phone: {{ $quotation->customer_phone }}</div>
                    @endif
                </div>
            </td>
            <td style="width: 45%;">
                <div class="meta-section">
                    <div><strong>Quotation#</strong> &nbsp; {{ $quotation->quotation_number }}</div>
                    <div style="margin-top: 3px;"><strong>Date:</strong> &nbsp; {{ \Carbon\Carbon::parse($quotation->date)->format('d/m/Y') }}</div>
                    @if($quotation->expiry_date)
                        <div style="margin-top: 3px; font-size: 10.5px; color: #64748b;"><strong>Valid Until:</strong> &nbsp; {{ \Carbon\Carbon::parse($quotation->expiry_date)->format('d/m/Y') }}</div>
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

    <!-- Items Table -->
    <table class="items-table">
        <thead>
            <tr>
                <th class="text-center" style="width: 6%;">#</th>
                <th class="text-left" style="width: 54%;">DESCRIPTION</th>
                <th class="text-center" style="width: 10%;">QTY</th>
                <th class="text-right" style="width: 15%;">PRICE</th>
                <th class="text-right" style="width: 15%;">TOTAL</th>
            </tr>
        </thead>
        <tbody>
            @foreach($quotation->items as $index => $item)
                <tr>
                    <td class="text-center" style="font-weight: 700;">{{ $index + 1 }}</td>
                    <td class="text-left" style="font-weight: 700; line-height: 1.4;">
                        {{ $item->description }}
                    </td>
                    <td class="text-center">{{ number_format($item->quantity, 0) == $item->quantity ? number_format($item->quantity, 0) : number_format($item->quantity, 2) }}</td>
                    <td class="text-right">{{ $quotation->currency_code }} {{ number_format($item->unit_price, 2) }}</td>
                    <td class="text-right" style="font-weight: 700;">
                        {{ $quotation->currency_code }} {{ number_format($item->amount, 2) }}
                    </td>
                </tr>
            @endforeach

            <!-- Subtotal / Taxes if applied -->
            @if($quotation->tax_rate > 0 || $quotation->discount > 0)
                <tr>
                    <td colspan="4" class="text-right" style="font-weight: 600; padding: 6px 10px; border-bottom: 1px solid #e2e8f0;">Subtotal:</td>
                    <td class="text-right" style="font-weight: 700; padding: 6px 10px; border-bottom: 1px solid #e2e8f0;">
                        {{ $quotation->currency_code }} {{ number_format($quotation->subtotal, 2) }}
                    </td>
                </tr>
                @if($quotation->tax_rate > 0)
                    <tr>
                        <td colspan="4" class="text-right" style="font-weight: 600; padding: 6px 10px; border-bottom: 1px solid #e2e8f0;">Tax ({{ number_format($quotation->tax_rate, 1) }}%):</td>
                        <td class="text-right" style="font-weight: 700; padding: 6px 10px; border-bottom: 1px solid #e2e8f0;">
                            {{ $quotation->currency_code }} {{ number_format($quotation->tax_amount, 2) }}
                        </td>
                    </tr>
                @endif
                @if($quotation->discount > 0)
                    <tr>
                        <td colspan="4" class="text-right" style="font-weight: 600; padding: 6px 10px; border-bottom: 1px solid #e2e8f0; color: #166534;">Discount:</td>
                        <td class="text-right" style="font-weight: 700; padding: 6px 10px; border-bottom: 1px solid #e2e8f0; color: #166534;">
                            - {{ $quotation->currency_code }} {{ number_format($quotation->discount, 2) }}
                        </td>
                    </tr>
                @endif
            @endif

            <!-- Grand Total Row -->
            <tr class="grand-total-row">
                <td colspan="4" class="text-right" style="font-weight: 900; letter-spacing: 0.5px;">
                    GRAND TOTAL
                </td>
                <td class="text-right" style="font-weight: 900; color: #003796;">
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
                <div style="font-weight: 700; margin-bottom: 2px;">NOTES:</div>
                <div style="margin-bottom: 6px;">{{ $quotation->notes }}</div>
            @endif
            @if($quotation->terms)
                <div style="font-weight: 700; margin-bottom: 2px;">TERMS & CONDITIONS:</div>
                <div>{{ $quotation->terms }}</div>
            @endif
        </div>
    @endif

    <!-- Signature Block -->
    <div class="signature-wrapper">
        <div class="signature-box">
            <div class="company-for">
                {{ $quotation->authorized_by_text ?: ('For, ' . ($quotation->company_name ?: 'AL MUSTAFA FURNITURE MOVERS')) }}
            </div>
            <div style="height: 50px;"></div>
            <div class="auth-sig-label">
                AUTHORIZED SIGNATURE
            </div>
        </div>
        <div class="clear"></div>
    </div>

</body>
</html>
