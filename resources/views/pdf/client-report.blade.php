<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Financial Report - {{ $client->name }}</title>
    <style>
        * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
        }
        body {
            font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
            font-size: 10px;
            color: #1e293b;
            background-color: #ffffff;
            padding: 30px;
            line-height: 1.4;
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
            max-height: 48px;
            width: auto;
            margin-bottom: 6px;
        }
        .company-name {
            font-size: 18px;
            font-weight: 800;
            color: #003796;
            letter-spacing: -0.5px;
            text-transform: uppercase;
        }
        .company-meta {
            font-size: 9px;
            color: #64748b;
            line-height: 1.3;
        }
        .report-main-title {
            font-size: 20px;
            font-weight: 900;
            color: #0f172a;
            letter-spacing: 0.5px;
            text-align: right;
            text-transform: uppercase;
        }
        .report-num-text {
            font-size: 11px;
            font-weight: 800;
            color: #0052D4;
            text-align: right;
            margin-top: 2px;
        }

        /* Divider Bar */
        .header-divider {
            height: 3px;
            background: #0052D4;
            margin: 14px 0 16px 0;
            border-radius: 2px;
        }

        /* Information Cards */
        .info-card {
            background-color: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            padding: 10px 12px;
        }
        .section-label {
            font-size: 8.5px;
            font-weight: 800;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            color: #64748b;
            margin-bottom: 4px;
            display: block;
        }
        .party-name {
            font-size: 12px;
            font-weight: 800;
            color: #0f172a;
            margin-bottom: 2px;
        }
        .party-meta {
            font-size: 9px;
            color: #475569;
            line-height: 1.3;
        }

        /* KPI Boxes Grid */
        .kpi-container {
            margin: 14px 0;
            width: 100%;
            border-collapse: collapse;
        }
        .kpi-box {
            padding: 8px 10px;
            border-radius: 6px;
            text-align: center;
        }
        .kpi-total { background-color: #eff6ff; border: 1px solid #bfdbfe; }
        .kpi-paid { background-color: #f0fdf4; border: 1px solid #bbf7d0; }
        .kpi-pending { background-color: #fefce8; border: 1px solid #fef08a; }
        .kpi-overdue { background-color: #fff1f2; border: 1px solid #fecdd3; }
        
        .kpi-label {
            font-size: 8px;
            font-weight: 800;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            color: #64748b;
        }
        .kpi-value {
            font-size: 13px;
            font-weight: 900;
            margin-top: 2px;
        }
        .kpi-total .kpi-value { color: #1e40af; }
        .kpi-paid .kpi-value { color: #166534; }
        .kpi-pending .kpi-value { color: #854d0e; }
        .kpi-overdue .kpi-value { color: #9f1239; }

        /* Category Breakdown Table */
        .breakdown-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 14px;
        }
        .breakdown-table th {
            background-color: #f1f5f9;
            color: #475569;
            font-size: 8px;
            font-weight: 800;
            text-transform: uppercase;
            padding: 5px 8px;
            border: 1px solid #e2e8f0;
            text-align: left;
        }
        .breakdown-table td {
            padding: 5px 8px;
            font-size: 9px;
            border: 1px solid #e2e8f0;
        }

        /* Items / Transactions Table */
        .items-table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 10px;
        }
        .items-table th {
            background-color: #003796;
            color: #ffffff;
            font-size: 8.5px;
            font-weight: 800;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            padding: 7px 8px;
            text-align: left;
        }
        .items-table td {
            padding: 6px 8px;
            border-bottom: 1px solid #e2e8f0;
            font-size: 9px;
            color: #334155;
            vertical-align: middle;
        }
        .items-table tr:nth-child(even) td {
            background-color: #f8fafc;
        }

        /* Status Badges */
        .status-badge {
            display: inline-block;
            padding: 2px 6px;
            font-size: 8px;
            font-weight: 800;
            text-transform: uppercase;
            border-radius: 4px;
            letter-spacing: 0.3px;
        }
        .status-paid { background-color: #dcfce7; color: #15803d; border: 1px solid #bbf7d0; }
        .status-pending { background-color: #fef9c3; color: #854d0e; border: 1px solid #fef08a; }
        .status-overdue { background-color: #ffe4e6; color: #be123c; border: 1px solid #fecdd3; }
        .status-cancelled { background-color: #f1f5f9; color: #64748b; border: 1px solid #cbd5e1; }

        /* Category Badges */
        .cat-badge {
            display: inline-block;
            padding: 2px 5px;
            font-size: 8px;
            font-weight: 800;
            border-radius: 4px;
        }
        .cat-project { background-color: #f3e8ff; color: #6b21a8; }
        .cat-service { background-color: #ecfdf5; color: #047857; }
        .cat-domain { background-color: #eff6ff; color: #1d4ed8; }
        .cat-hosting { background-color: #fff7ed; color: #c2410c; }

        /* Summary Total Row */
        .totals-row td {
            background-color: #f1f5f9 !important;
            font-weight: 800;
            color: #0f172a;
            border-top: 2px solid #cbd5e1;
            padding: 8px;
        }

        /* Footer */
        .footer {
            margin-top: 25px;
            padding-top: 10px;
            border-top: 1px solid #e2e8f0;
            font-size: 8.5px;
            color: #94a3b8;
            text-align: center;
        }
    </style>
</head>
<body>
    @php
        $logoPath = null;
        if (!empty($company['logo'])) {
            $rawLogo = ltrim($company['logo'], '/');
            if (file_exists(public_path($rawLogo))) {
                $logoPath = public_path($rawLogo);
            }
        }
        if (!$logoPath) {
            $candidates = ['logo.png', 'logo_clean.png', 'logo.jpeg', 'app-logo-icon.png', 'uploads/settings/logo.png'];
            foreach ($candidates as $cand) {
                if (file_exists(public_path($cand))) {
                    $logoPath = public_path($cand);
                    break;
                }
            }
        }
        $logoData = ($logoPath && file_exists($logoPath)) ? base64_encode(file_get_contents($logoPath)) : null;
        $logoMime = ($logoPath && file_exists($logoPath)) ? (mime_content_type($logoPath) ?: 'image/png') : 'image/png';
    @endphp

    <!-- Top Header -->
    <table class="table-layout">
        <tr>
            <td style="width: 55%;">
                @if($logoData)
                    <img src="data:{{ $logoMime }};base64,{{ $logoData }}" class="logo-img" alt="Company Logo" style="max-height: 52px; width: auto; margin-bottom: 8px; display: block;" />
                @else
                    <div class="company-name">{{ $company['name'] ?? 'SAPTA TECHNOLOGIES' }}</div>
                @endif
                <div class="company-meta">
                    <strong>{{ $company['name'] ?? 'Sapta Technologies' }}</strong><br>
                    {{ $company['address'] ?? 'Software Technology Park, Lahore, Pakistan' }}<br>
                    Email: {{ $company['email'] ?? 'contact@saptatechnologies.com' }} | Phone: {{ $company['phone'] ?? '+92 300 1234567' }}<br>
                    @if(!empty($company['tax_id']))
                        Tax ID / NTN: {{ $company['tax_id'] }}
                    @endif
                </div>
            </td>
            <td style="width: 45%; text-align: right;">
                <div class="report-main-title">Financial Statement</div>
                <div class="report-num-text">Client: {{ $client->client_code }}</div>
                <div style="font-size: 9px; color: #64748b; margin-top: 4px;">
                    Generated: {{ date('d M Y, h:i A') }}<br>
                    @if(!empty($filters['from_date']) || !empty($filters['to_date']))
                        Period: {{ $filters['from_date'] ?: 'Start' }} to {{ $filters['to_date'] ?: 'Present' }}
                    @else
                        Period: All Time (Complete Record)
                    @endif
                </div>
            </td>
        </tr>
    </table>

    <div class="header-divider"></div>

    <!-- Client Info Card -->
    <table class="table-layout" style="margin-bottom: 12px;">
        <tr>
            <td style="width: 50%; padding-right: 8px;">
                <div class="info-card">
                    <span class="section-label">Client Statement For:</span>
                    <div class="party-name">{{ $client->name }}</div>
                    <div class="party-meta">
                        @if($client->company_name)
                            <strong>{{ $client->company_name }}</strong><br>
                        @endif
                        @if($client->contact_person && $client->contact_person !== $client->name)
                            Attn: {{ $client->contact_person }}<br>
                        @endif
                        Email: {{ $client->email ?: 'N/A' }} | Phone: {{ $client->phone ?: $client->mobile ?: 'N/A' }}<br>
                        Location: {{ implode(', ', array_filter([$client->city, $client->country])) ?: 'Global' }}
                    </div>
                </div>
            </td>
            <td style="width: 50%; padding-left: 8px;">
                <div class="info-card">
                    <span class="section-label">Report Filter Criteria:</span>
                    <div class="party-meta" style="font-size: 9.5px; line-height: 1.5;">
                        <strong>Category:</strong> {{ ucfirst($filters['category'] ?? 'All Categories') }}<br>
                        <strong>Status:</strong> {{ ucfirst($filters['status'] ?? 'All Statuses') }}<br>
                        <strong>Total Records:</strong> {{ count($transactions) }} transactions found<br>
                        <strong>Billing Currency:</strong> {{ $client->currency ?: 'AED' }}
                    </div>
                </div>
            </td>
        </tr>
    </table>

    <!-- 4 KPI Summary Cards -->
    <table class="kpi-container">
        <tr>
            <td style="width: 25%; padding-right: 4px;">
                <div class="kpi-box kpi-total">
                    <div class="kpi-label">Total Billed ({{ $kpi['count_all'] }})</div>
                    <div class="kpi-value">{{ $client->currency ?: 'AED' }} {{ number_format($kpi['total_billed'], 2) }}</div>
                </div>
            </td>
            <td style="width: 25%; padding: 0 4px;">
                <div class="kpi-box kpi-paid">
                    <div class="kpi-label">Total Paid ({{ $kpi['count_paid'] }})</div>
                    <div class="kpi-value">{{ $client->currency ?: 'AED' }} {{ number_format($kpi['total_paid'], 2) }}</div>
                </div>
            </td>
            <td style="width: 25%; padding: 0 4px;">
                <div class="kpi-box kpi-pending">
                    <div class="kpi-label">Pending / Due ({{ $kpi['count_pending'] }})</div>
                    <div class="kpi-value">{{ $client->currency ?: 'AED' }} {{ number_format($kpi['total_pending'], 2) }}</div>
                </div>
            </td>
            <td style="width: 25%; padding-left: 4px;">
                <div class="kpi-box kpi-overdue">
                    <div class="kpi-label">Overdue ({{ $kpi['count_overdue'] }})</div>
                    <div class="kpi-value">{{ $client->currency ?: 'AED' }} {{ number_format($kpi['total_overdue'], 2) }}</div>
                </div>
            </td>
        </tr>
    </table>

    <!-- Category Summary Breakdown Table -->
    <table class="breakdown-table">
        <thead>
            <tr>
                <th>Category Module</th>
                <th style="text-align: center;">Total Items</th>
                <th style="text-align: right;">Total Amount</th>
                <th style="text-align: right;">Total Paid</th>
                <th style="text-align: right;">Pending / Due</th>
            </tr>
        </thead>
        <tbody>
            <tr>
                <td><strong>Project Milestones</strong></td>
                <td style="text-align: center;">{{ $categoryBreakdown['project']['count'] }}</td>
                <td style="text-align: right;">{{ $client->currency ?: 'AED' }} {{ number_format($categoryBreakdown['project']['total'], 2) }}</td>
                <td style="text-align: right; color: #166534;">{{ $client->currency ?: 'AED' }} {{ number_format($categoryBreakdown['project']['paid'], 2) }}</td>
                <td style="text-align: right; color: #854d0e;">{{ $client->currency ?: 'AED' }} {{ number_format($categoryBreakdown['project']['pending'], 2) }}</td>
            </tr>
            <tr>
                <td><strong>Monthly Services & Subscriptions</strong></td>
                <td style="text-align: center;">{{ $categoryBreakdown['service']['count'] }}</td>
                <td style="text-align: right;">{{ $client->currency ?: 'AED' }} {{ number_format($categoryBreakdown['service']['total'], 2) }}</td>
                <td style="text-align: right; color: #166534;">{{ $client->currency ?: 'AED' }} {{ number_format($categoryBreakdown['service']['paid'], 2) }}</td>
                <td style="text-align: right; color: #854d0e;">{{ $client->currency ?: 'AED' }} {{ number_format($categoryBreakdown['service']['pending'], 2) }}</td>
            </tr>
            <tr>
                <td><strong>Domain Registrations & Renewals</strong></td>
                <td style="text-align: center;">{{ $categoryBreakdown['domain']['count'] }}</td>
                <td style="text-align: right;">{{ $client->currency ?: 'AED' }} {{ number_format($categoryBreakdown['domain']['total'], 2) }}</td>
                <td style="text-align: right; color: #166534;">{{ $client->currency ?: 'AED' }} {{ number_format($categoryBreakdown['domain']['paid'], 2) }}</td>
                <td style="text-align: right; color: #854d0e;">{{ $client->currency ?: 'AED' }} {{ number_format($categoryBreakdown['domain']['pending'], 2) }}</td>
            </tr>
            <tr>
                <td><strong>Web Hosting Packages</strong></td>
                <td style="text-align: center;">{{ $categoryBreakdown['hosting']['count'] }}</td>
                <td style="text-align: right;">{{ $client->currency ?: 'AED' }} {{ number_format($categoryBreakdown['hosting']['total'], 2) }}</td>
                <td style="text-align: right; color: #166534;">{{ $client->currency ?: 'AED' }} {{ number_format($categoryBreakdown['hosting']['paid'], 2) }}</td>
                <td style="text-align: right; color: #854d0e;">{{ $client->currency ?: 'AED' }} {{ number_format($categoryBreakdown['hosting']['pending'], 2) }}</td>
            </tr>
        </tbody>
    </table>

    <!-- Detailed Transactions Table -->
    <div style="font-size: 10px; font-weight: 800; color: #0f172a; text-transform: uppercase; margin-bottom: 4px;">
        Detailed Payment Records ({{ count($transactions) }})
    </div>

    <table class="items-table">
        <thead>
            <tr>
                <th style="width: 10%;">Date</th>
                <th style="width: 15%;">Category</th>
                <th style="width: 33%;">Description / Item Name</th>
                <th style="width: 14%;">Invoice #</th>
                <th style="width: 12%; text-align: center;">Status</th>
                <th style="width: 16%; text-align: right;">Amount</th>
            </tr>
        </thead>
        <tbody>
            @forelse($transactions as $tx)
                <tr>
                    <td>{{ $tx['date'] ?: 'N/A' }}</td>
                    <td>
                        <span class="cat-badge cat-{{ $tx['category'] }}">
                            {{ $tx['category_label'] }}
                        </span>
                    </td>
                    <td>
                        <strong>{{ $tx['title'] }}</strong>
                        @if($tx['parent_name'])
                            <div style="font-size: 8px; color: #64748b;">Item: {{ $tx['parent_name'] }}</div>
                        @endif
                    </td>
                    <td>
                        @if($tx['invoice'])
                            <strong>#{{ $tx['invoice']['invoice_number'] }}</strong>
                        @else
                            <span style="color: #94a3b8; font-style: italic;">Uninvoiced</span>
                        @endif
                    </td>
                    <td style="text-align: center;">
                        <span class="status-badge status-{{ $tx['status'] }}">
                            {{ ucfirst($tx['status']) }}
                        </span>
                    </td>
                    <td style="text-align: right; font-weight: 700;">
                        {{ $tx['currency'] }} {{ number_format($tx['amount'], 2) }}
                    </td>
                </tr>
            @empty
                <tr>
                    <td colspan="6" style="text-align: center; padding: 20px; color: #94a3b8;">
                        No transaction or payment records match the selected filter criteria.
                    </td>
                </tr>
            @endforelse

            @if(count($transactions) > 0)
                <tr class="totals-row">
                    <td colspan="4" style="text-align: right; font-size: 9px; font-weight: 800; text-transform: uppercase;">
                        Filtered Summary Totals:
                    </td>
                    <td style="text-align: center; font-size: 8.5px;">
                        Paid: {{ $kpi['count_paid'] }} / Due: {{ $kpi['count_pending'] }}
                    </td>
                    <td style="text-align: right; font-size: 10px; font-weight: 900; color: #003796;">
                        {{ $client->currency ?: 'AED' }} {{ number_format($kpi['total_billed'], 2) }}
                    </td>
                </tr>
            @endif
        </tbody>
    </table>

    <!-- Footer -->
    <div class="footer">
        This is a system-generated statement of payments & financial record for <strong>{{ $client->name }}</strong> ({{ $client->client_code }}).<br>
        For inquiries regarding this report, please contact {{ $company['email'] }} or call {{ $company['phone'] }}.
    </div>
</body>
</html>
