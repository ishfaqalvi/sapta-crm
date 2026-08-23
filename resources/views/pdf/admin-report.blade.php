<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Financial Report & Statement - {{ $selectedClient ? $selectedClient->name : 'All Clients' }}</title>
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
            padding: 26px;
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
            max-height: 44px;
            width: auto;
            margin-bottom: 6px;
        }
        .company-name {
            font-size: 16px;
            font-weight: 800;
            color: #003796;
            letter-spacing: -0.5px;
            text-transform: uppercase;
        }
        .company-meta {
            font-size: 8.5px;
            color: #64748b;
            line-height: 1.3;
        }
        .report-main-title {
            font-size: 18px;
            font-weight: 900;
            color: #0f172a;
            letter-spacing: 0.5px;
            text-align: right;
            text-transform: uppercase;
        }
        .report-num-text {
            font-size: 10.5px;
            font-weight: 800;
            color: #0052D4;
            text-align: right;
            margin-top: 2px;
        }

        /* Divider Bar */
        .header-divider {
            height: 3px;
            background: #0052D4;
            margin: 12px 0 14px 0;
            border-radius: 2px;
        }

        /* Information Cards */
        .info-card {
            background-color: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            padding: 9px 12px;
        }
        .section-label {
            font-size: 8px;
            font-weight: 800;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            color: #64748b;
            margin-bottom: 4px;
            display: block;
        }
        .party-name {
            font-size: 11px;
            font-weight: 800;
            color: #0f172a;
            margin-bottom: 2px;
        }
        .party-meta {
            font-size: 8.5px;
            color: #475569;
            line-height: 1.3;
        }

        /* KPI Boxes Grid */
        .kpi-container {
            margin: 12px 0;
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
            font-size: 12.5px;
            font-weight: 900;
            margin-top: 2px;
        }
        .kpi-total .kpi-value { color: #1e40af; }
        .kpi-paid .kpi-value { color: #166534; }
        .kpi-pending .kpi-value { color: #854d0e; }
        .kpi-overdue .kpi-value { color: #9f1239; }

        /* Items / Transactions Table */
        .items-table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 8px;
        }
        .items-table th {
            background-color: #003796;
            color: #ffffff;
            font-size: 8px;
            font-weight: 800;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            padding: 6px 7px;
            text-align: left;
        }
        .items-table td {
            padding: 5.5px 7px;
            border-bottom: 1px solid #e2e8f0;
            font-size: 8.5px;
            color: #334155;
            vertical-align: middle;
        }
        .items-table tr:nth-child(even) td {
            background-color: #f8fafc;
        }

        /* Status Badges */
        .status-badge {
            display: inline-block;
            padding: 1.5px 5px;
            font-size: 7.5px;
            font-weight: 800;
            text-transform: uppercase;
            border-radius: 3px;
            letter-spacing: 0.3px;
        }
        .status-paid { background-color: #dcfce7; color: #15803d; border: 1px solid #bbf7d0; }
        .status-pending { background-color: #fef9c3; color: #854d0e; border: 1px solid #fef08a; }
        .status-overdue { background-color: #ffe4e6; color: #be123c; border: 1px solid #fecdd3; }
        .status-cancelled { background-color: #f1f5f9; color: #64748b; border: 1px solid #cbd5e1; }

        /* Category Badges */
        .cat-badge {
            display: inline-block;
            padding: 1.5px 5px;
            font-size: 7.5px;
            font-weight: 800;
            border-radius: 3px;
        }
        .cat-project { background-color: #f3e8ff; color: #7e22ce; }
        .cat-service { background-color: #ecfdf5; color: #047857; }
        .cat-domain { background-color: #eff6ff; color: #1d4ed8; }
        .cat-hosting { background-color: #fef3c7; color: #b45309; }

        /* Footer */
        .footer {
            margin-top: 20px;
            padding-top: 10px;
            border-top: 1px solid #e2e8f0;
            font-size: 8px;
            color: #94a3b8;
            text-align: center;
        }
    </style>
</head>
<body>

    @php
        $logoPath = null;
        if (!empty($company['logo'])) {
            $cleaned = ltrim($company['logo'], '/');
            if (file_exists(public_path($cleaned))) {
                $logoPath = public_path($cleaned);
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

    <!-- Header & Branding -->
    <table class="table-layout">
        <tr>
            <td style="width: 55%;">
                @if($logoData)
                    <img src="data:{{ $logoMime }};base64,{{ $logoData }}" class="logo-img" alt="Company Logo" style="max-height: 48px; width: auto; margin-bottom: 6px; display: block;" />
                @else
                    <div class="company-name">{{ $company['name'] ?? 'SAPTA TECHNOLOGIES' }}</div>
                @endif
                <div class="company-meta">
                    <strong>{{ $company['name'] ?? 'Sapta Technologies' }}</strong><br>
                    {{ $company['address'] ?? 'Software Technology Park, Lahore' }}<br>
                    Email: {{ $company['email'] ?? 'contact@saptatechnologies.com' }} | Phone: {{ $company['phone'] ?? '+92 300 1234567' }}<br>
                    @if(!empty($company['tax_id']))
                        Tax / NTN: {{ $company['tax_id'] }}
                    @endif
                </div>
            </td>
            <td style="width: 45%;">
                <div class="report-main-title">Financial Report</div>
                <div class="report-num-text">
                    {{ $selectedClient ? "Client: {$selectedClient->name} ({$selectedClient->client_code})" : 'Scope: All Clients Consolidated' }}
                </div>
                <div style="font-size: 8.5px; color: #64748b; text-align: right; margin-top: 4px;">
                    Generated: {{ now()->format('d M Y, h:i A') }}
                </div>
            </td>
        </tr>
    </table>

    <div class="header-divider"></div>

    <!-- Statement Metadata Cards -->
    <table class="table-layout" style="margin-bottom: 12px;">
        <tr>
            <td style="width: 48%;">
                <div class="info-card">
                    <span class="section-label">Report Filter Scope</span>
                    <div class="party-name">{{ $selectedClient ? $selectedClient->name : 'All Clients' }}</div>
                    <div class="party-meta">
                        @if($selectedClient)
                            Code: <strong>{{ $selectedClient->client_code }}</strong> | Currency: <strong>{{ $selectedClient->currency ?? 'AED' }}</strong><br>
                            Company: {{ $selectedClient->company_name ?: 'N/A' }} | Email: {{ $selectedClient->email ?: 'N/A' }}
                        @else
                            Multi-Client Consolidated Cross-Section Ledger<br>
                            Includes Project Milestones, Subscriptions, Domains & Web Hostings.
                        @endif
                    </div>
                </div>
            </td>
            <td style="width: 4%;"></td>
            <td style="width: 48%;">
                <div class="info-card">
                    <span class="section-label">Report Parameters & Period</span>
                    <div class="party-meta">
                        <strong>Category:</strong> {{ ucfirst($filters['category'] ?? 'All Categories') }}<br>
                        <strong>Payment Status:</strong> {{ ucfirst($filters['status'] ?? 'All Statuses') }}<br>
                        <strong>Date Range:</strong> 
                        @if(!empty($filters['from_date']) || !empty($filters['to_date']))
                            {{ $filters['from_date'] ?: 'Beginning' }} to {{ $filters['to_date'] ?: 'Present' }}
                        @else
                            All-Time Full History
                        @endif
                    </div>
                </div>
            </td>
        </tr>
    </table>

    <!-- KPI Summary Grid -->
    <table class="kpi-container">
        <tr>
            <td style="width: 25%; padding-right: 4px;">
                <div class="kpi-box kpi-total">
                    <div class="kpi-label">Total Billed ({{ $kpi['count_all'] }})</div>
                    <div class="kpi-value">{{ number_format($kpi['total_billed'], 2) }}</div>
                </div>
            </td>
            <td style="width: 25%; padding: 0 2px;">
                <div class="kpi-box kpi-paid">
                    <div class="kpi-label">Settled / Paid ({{ $kpi['count_paid'] }})</div>
                    <div class="kpi-value">{{ number_format($kpi['total_paid'], 2) }}</div>
                </div>
            </td>
            <td style="width: 25%; padding: 0 2px;">
                <div class="kpi-box kpi-pending">
                    <div class="kpi-label">Pending / Due ({{ $kpi['count_pending'] }})</div>
                    <div class="kpi-value">{{ number_format($kpi['total_pending'], 2) }}</div>
                </div>
            </td>
            <td style="width: 25%; padding-left: 4px;">
                <div class="kpi-box kpi-overdue">
                    <div class="kpi-label">Overdue ({{ $kpi['count_overdue'] }})</div>
                    <div class="kpi-value">{{ number_format($kpi['total_overdue'], 2) }}</div>
                </div>
            </td>
        </tr>
    </table>

    <!-- Transactions Ledger Table -->
    <table class="items-table">
        <thead>
            <tr>
                <th style="width: 12%;">Date</th>
                <th style="width: 20%;">Client</th>
                <th style="width: 16%;">Category</th>
                <th style="width: 26%;">Description & Item</th>
                <th style="width: 12%;">Invoice #</th>
                <th style="width: 14%; text-align: right;">Amount</th>
            </tr>
        </thead>
        <tbody>
            @forelse($transactions as $t)
                <tr>
                    <td style="font-family: monospace;">{{ $t['date'] ?: 'N/A' }}</td>
                    <td>
                        <strong>{{ $t['client']['name'] ?? 'N/A' }}</strong>
                        @if(!empty($t['client']['client_code']))
                            <span style="font-size: 7.5px; color: #64748b;">({{ $t['client']['client_code'] }})</span>
                        @endif
                    </td>
                    <td>
                        <span class="cat-badge cat-{{ $t['category'] }}">
                            {{ $t['category_label'] }}
                        </span>
                    </td>
                    <td>
                        <strong>{{ $t['title'] }}</strong>
                        @if(!empty($t['parent_name']))
                            <div style="font-size: 7.5px; color: #64748b;">Item: {{ $t['parent_name'] }}</div>
                        @endif
                    </td>
                    <td>
                        @if(!empty($t['invoice']))
                            <strong>#{{ $t['invoice']['invoice_number'] }}</strong>
                        @else
                            <span style="color: #94a3b8; font-style: italic;">Uninvoiced</span>
                        @endif
                    </td>
                    <td style="text-align: right; font-weight: 800;">
                        <span style="font-size: 7.5px; color: #64748b;">{{ $t['currency'] }}</span>
                        {{ number_format($t['amount'], 2) }}
                    </td>
                </tr>
            @empty
                <tr>
                    <td colspan="6" style="text-align: center; padding: 20px; color: #94a3b8;">
                        No financial records found matching current criteria.
                    </td>
                </tr>
            @endforelse
        </tbody>
        @if(count($transactions) > 0)
            <tfoot>
                <tr style="background-color: #f1f5f9; font-weight: 800; border-top: 2px solid #cbd5e1;">
                    <td colspan="4" style="padding: 7px; text-transform: uppercase; font-size: 8px;">
                        Filtered Summary ({{ count($transactions) }} records)
                    </td>
                    <td style="padding: 7px; font-size: 8px; color: #475569;">
                        Settled: {{ $kpi['count_paid'] }} | Due: {{ $kpi['count_pending'] }}
                    </td>
                    <td style="padding: 7px; text-align: right; font-size: 9.5px; color: #003796;">
                        Total: {{ number_format($kpi['total_billed'], 2) }}
                    </td>
                </tr>
            </tfoot>
        @endif
    </table>

    <!-- Footer -->
    <div class="footer">
        This document is an electronically generated financial statement from {{ $company['name'] ?? 'Sapta Technologies' }}.<br>
        Report generated by {{ Auth::user()->name ?? 'System' }} on {{ now()->format('d M Y, h:i A') }}.
    </div>

</body>
</html>
