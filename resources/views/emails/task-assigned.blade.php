<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>New Task Assigned</title>
    <style>
        /* Base Reset */
        body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
        table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
        img { -ms-interpolation-mode: bicubic; border: 0; outline: none; text-decoration: none; }
        body { margin: 0; padding: 0; width: 100% !important; height: 100% !important; background-color: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif; color: #1e293b; }
        
        /* Container */
        .wrapper { width: 100%; table-layout: fixed; background-color: #f1f5f9; padding: 30px 10px; }
        .main-card { max-width: 620px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.06); border: 1px solid #e2e8f0; }
        
        /* Header */
        .header-bar { background: linear-gradient(135deg, #002b66 0%, #003796 50%, #1d4ed8 100%); padding: 32px 30px; text-align: left; color: #ffffff; }
        .brand-badge { display: inline-block; padding: 4px 12px; background: rgba(255, 255, 255, 0.2); border-radius: 9999px; font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.8px; margin-bottom: 12px; }
        .header-title { margin: 0; font-size: 22px; font-weight: 900; letter-spacing: -0.5px; color: #ffffff; line-height: 1.3; }
        
        /* Content Body */
        .content-body { padding: 32px 30px; }
        .greeting { font-size: 16px; font-weight: 800; color: #0f172a; margin-bottom: 8px; }
        .intro-text { font-size: 14px; color: #475569; line-height: 1.6; margin-bottom: 24px; }
        
        /* Task Details Box */
        .task-box { background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 22px; margin-bottom: 24px; }
        .task-title { font-size: 17px; font-weight: 900; color: #003796; margin-bottom: 16px; line-height: 1.4; }
        
        .info-table { width: 100%; border-collapse: collapse; margin-bottom: 16px; }
        .info-table td { padding: 6px 0; font-size: 13px; vertical-align: top; }
        .info-label { width: 35%; color: #64748b; font-weight: 600; }
        .info-val { width: 65%; color: #0f172a; font-weight: 700; text-align: right; }
        
        /* Badges */
        .priority-badge { display: inline-block; padding: 3px 10px; border-radius: 6px; font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px; border: 1px solid; }
        
        /* Description */
        .desc-box { background-color: #ffffff; border-left: 4px solid #003796; border-radius: 6px; padding: 14px 16px; margin-top: 14px; font-size: 13px; color: #334155; line-height: 1.6; border-top: 1px solid #e2e8f0; border-right: 1px solid #e2e8f0; border-bottom: 1px solid #e2e8f0; }
        .desc-title { font-size: 11px; font-weight: 800; text-transform: uppercase; color: #64748b; margin-bottom: 4px; letter-spacing: 0.5px; }
        
        /* Attachment Note */
        .attachment-box { margin-top: 14px; padding: 10px 14px; background-color: #eff6ff; border-radius: 8px; font-size: 12px; color: #1e40af; border: 1px solid #dbeafe; display: flex; align-items: center; }
        
        /* Button */
        .btn-wrapper { text-align: center; margin: 30px 0 10px 0; }
        .btn { display: inline-block; background: #003796; color: #ffffff !important; padding: 14px 32px; border-radius: 10px; font-size: 14px; font-weight: 800; text-decoration: none; text-align: center; box-shadow: 0 4px 12px rgba(0, 55, 150, 0.25); letter-spacing: 0.3px; }
        
        /* Footer */
        .footer-bar { padding: 24px 30px; background-color: #f8fafc; border-top: 1px solid #e2e8f0; text-align: center; font-size: 12px; color: #94a3b8; line-height: 1.5; }
        .footer-bar a { color: #64748b; text-decoration: underline; }
    </style>
</head>
<body>
    <div class="wrapper">
        <table width="100%" border="0" cellspacing="0" cellpadding="0">
            <tr>
                <td align="center">
                    <div class="main-card">
                        
                        <!-- Header Banner -->
                        <div class="header-bar">
                            <div class="brand-badge">{{ $details['type_label'] }}</div>
                            <h1 class="header-title">New Task Assigned to You</h1>
                        </div>

                        <!-- Content Body -->
                        <div class="content-body">
                            <div class="greeting">Hello {{ $details['employee_name'] }},</div>
                            <p class="intro-text">
                                You have been assigned a new task by <strong>{{ $details['assigned_by_name'] }}</strong> in the CRM. Please review the task details, requirements, and due date below.
                            </p>

                            <!-- Structured Task Details Card -->
                            <div class="task-box">
                                <div class="task-title">
                                    {{ $details['task_title'] }}
                                </div>

                                <table class="info-table">
                                    <tr>
                                        <td class="info-label">Task Type:</td>
                                        <td class="info-val">{{ $details['type_label'] }}</td>
                                    </tr>

                                    @if($details['client_name'])
                                    <tr>
                                        <td class="info-label">Client / Company:</td>
                                        <td class="info-val">{{ $details['client_name'] }}</td>
                                    </tr>
                                    @endif

                                    <tr>
                                        <td class="info-label">Associated With:</td>
                                        <td class="info-val">{{ $details['source_title'] }}</td>
                                    </tr>

                                    @if($details['task_code'])
                                    <tr>
                                        <td class="info-label">Task Code:</td>
                                        <td class="info-val" style="font-family: monospace; font-size: 12px; color: #003796;">{{ $details['task_code'] }}</td>
                                    </tr>
                                    @endif

                                    <tr>
                                        <td class="info-label">Priority:</td>
                                        <td class="info-val">
                                            <span class="priority-badge" style="background-color: {{ $details['priority_style']['bg'] }}; color: {{ $details['priority_style']['text'] }}; border-color: {{ $details['priority_style']['border'] }};">
                                                {{ $details['priority'] }}
                                            </span>
                                        </td>
                                    </tr>

                                    <tr>
                                        <td class="info-label">Current Status:</td>
                                        <td class="info-val">{{ $details['status'] }}</td>
                                    </tr>

                                    @if($details['start_date'])
                                    <tr>
                                        <td class="info-label">Start Date:</td>
                                        <td class="info-val">{{ $details['start_date'] }}</td>
                                    </tr>
                                    @endif

                                    @if($details['due_date'])
                                    <tr>
                                        <td class="info-label">Due Date (Deadline):</td>
                                        <td class="info-val" style="color: #b91c1c; font-weight: 900;">
                                            &#128197; {{ $details['due_date'] }}
                                        </td>
                                    </tr>
                                    @endif

                                    <tr>
                                        <td class="info-label">Assigned By:</td>
                                        <td class="info-val">{{ $details['assigned_by_name'] }}</td>
                                    </tr>
                                </table>

                                <!-- Task Description (if any) -->
                                @if(!empty($details['description']))
                                <div class="desc-box">
                                    <div class="desc-title">Description & Instructions</div>
                                    <div>{!! nl2br(e($details['description'])) !!}</div>
                                </div>
                                @endif

                                <!-- Attachment info (if any) -->
                                @if(!empty($details['attachment_url']))
                                <div class="attachment-box" style="margin-top: 14px; padding: 12px 16px; background-color: #eff6ff; border-radius: 8px; font-size: 13px; color: #1e40af; border: 1px solid #dbeafe;">
                                    <table width="100%" border="0" cellpadding="0" cellspacing="0">
                                        <tr>
                                            <td style="vertical-align: middle; color: #1e40af; font-size: 13px;">
                                                <strong>&#128206; Attached Document:</strong> &nbsp;
                                                <span style="font-weight: 600;">{{ $details['attachment_name'] ?: 'Task Document' }}</span>
                                            </td>
                                            <td style="text-align: right; vertical-align: middle;">
                                                <a href="{{ $details['attachment_url'] }}" target="_blank" style="display: inline-block; padding: 6px 14px; background-color: #003796; color: #ffffff !important; text-decoration: none; border-radius: 6px; font-weight: 700; font-size: 12px;">
                                                    Download File &darr;
                                                </a>
                                            </td>
                                        </tr>
                                    </table>
                                </div>
                                @elseif(!empty($details['attachment_name']))
                                <div class="attachment-box">
                                    <strong>&#128206; Attachment Attached:</strong> &nbsp; {{ $details['attachment_name'] }}
                                </div>
                                @endif
                            </div>

                            <!-- Direct Call to Action Button to Tasks List -->
                            <div class="btn-wrapper">
                                <a href="{{ $details['action_url'] }}" target="_blank" class="btn">
                                    View My Assigned Tasks &rarr;
                                </a>
                            </div>
                        </div>

                        <!-- Footer -->
                        <div class="footer-bar">
                            <p style="margin: 0 0 6px 0;">This is an automated operational notification sent by {{ config('app.name', 'Sapta CRM') }}.</p>
                            <p style="margin: 0;">Please log into your portal to update task status or leave conversation messages.</p>
                        </div>

                    </div>
                </td>
            </tr>
        </table>
    </div>
</body>
</html>
