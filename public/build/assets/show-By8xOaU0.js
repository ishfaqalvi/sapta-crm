import{r as f,j as e,L as A,$ as M}from"./app-Acl-u4kM.js";import{A as B}from"./app-layout-DXJZqinR.js";import{A as F}from"./arrow-left-q_DzrUkx.js";import{C as L}from"./clock-DhKWrKMq.js";import{C as R}from"./circle-check-Cg1iIwcQ.js";import{C as U}from"./circle-pause-B12BRpb_.js";import{C as J}from"./circle-alert-cyrGuXx8.js";import{B as O}from"./building-CfSg23WV.js";import{F as E}from"./folder-kanban-BpkpLyBU.js";import{R as W}from"./receipt-C_I5IbXB.js";import{L as K}from"./list-todo-CezfU_w0.js";import{K as V,F as H,U as q}from"./app-toaster-B1XhCJ4f.js";import{C as Y}from"./calendar-L6vj2kgd.js";import{P as G}from"./printer-BGTM2sCO.js";import{C as y}from"./copy-am4KUxHb.js";import{E as Q}from"./eye-off-BrmJQF9P.js";import{E as X}from"./eye-m5def09_.js";import"./button-C75V4IQf.js";import"./layout-grid-Dz5xXEup.js";import"./layers-B2Lt20bA.js";import"./building-2-CGOXwThW.js";import"./coins-CkdKgKHA.js";import"./index-DqGfz1FP.js";import"./index-Dvu0Nwwv.js";import"./input-BYve1tBG.js";function $e({project:s,companySettings:$}){var N,v,j;const l=$||{name:"Sapta Technologies",email:"contact@saptatechnologies.com",phone:"+92 300 1234567",address:"Office #402, Software Technology Park, Lahore, Pakistan",tax_id:"NTN-892415-0",logo:"/app-logo-icon.png"},C=[{title:"Dashboard",href:"/dashboard"},{title:"Website Projects",href:"/website-projects"},{title:s.project_name,href:`/website-projects/${s.id}`}],_=()=>{if(typeof window<"u"){const a=new URLSearchParams(window.location.search).get("tab");if(a==="budget"||a==="tasks"||a==="credentials"||a==="details")return a}return"details"},[i,P]=f.useState(_),p=t=>{if(P(t),typeof window<"u"){const a=new URL(window.location.href);a.searchParams.set("tab",t),window.history.replaceState({},"",a.toString())}},[u,z]=f.useState({}),[Z,w]=f.useState(null),D=t=>{z(a=>({...a,[t]:!a[t]}))},k=(t,a)=>{t&&(navigator.clipboard.writeText(t),w(a),setTimeout(()=>w(null),2e3))},m=typeof s.total_budget=="string"?parseFloat(s.total_budget):s.total_budget||0,h=(s.payments||[]).filter(t=>t.status==="paid").reduce((t,a)=>t+(typeof a.amount=="string"?parseFloat(a.amount):a.amount||0),0),T=Math.max(0,m-h),S=m>0?Math.min(100,Math.round(h/m*100)):0,n=t=>{var r;return((typeof t=="string"?parseFloat(t):t)||0).toLocaleString("en-US",{style:"currency",currency:s.currency||((r=s.client)==null?void 0:r.currency)||"USD",maximumFractionDigits:0})},c=t=>{if(!t)return"Flexible";const a=t.includes("T")?t.split("T")[0]:t.split(" ")[0],r=a.split("-");if(r.length===3){const x=parseInt(r[0],10),d=parseInt(r[1],10)-1,o=parseInt(r[2],10);if(!isNaN(x)&&!isNaN(d)&&!isNaN(o)&&d>=0&&d<12){const b=["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];return`${o<10?`0${o}`:`${o}`} ${b[d]} ${x}`}}return a},I=t=>{var x,d,o,b,g;const a=window.open("","_blank","width=850,height=950");if(!a)return;const r=`
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8" />
                <title>Invoice #${t.id} - ${t.milestone_title}</title>
                <style>
                    @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800;900&family=JetBrains+Mono:wght@600;800&display=swap');
                    
                    * { box-sizing: border-box; margin: 0; padding: 0; }
                    body {
                        font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                        background: #ffffff;
                        color: #0f172a;
                        padding: 40px;
                        font-size: 13px;
                        line-height: 1.5;
                    }

                    .invoice-container {
                        max-width: 800px;
                        margin: 0 auto;
                    }

                    .header {
                        display: flex;
                        justify-content: space-between;
                        align-items: flex-start;
                        padding-bottom: 24px;
                        border-bottom: 2px solid #f1f5f9;
                        margin-bottom: 32px;
                    }

                    .brand-name {
                        font-size: 22px;
                        font-weight: 900;
                        color: #0052D4;
                        text-transform: uppercase;
                        letter-spacing: -0.5px;
                    }

                    .brand-sub {
                        font-size: 12px;
                        color: #64748b;
                        font-weight: 500;
                        margin-top: 2px;
                    }

                    .invoice-title {
                        font-size: 24px;
                        font-weight: 900;
                        text-transform: uppercase;
                        letter-spacing: 1px;
                        color: #0f172a;
                        text-align: right;
                    }

                    .invoice-num {
                        font-family: 'JetBrains Mono', monospace;
                        font-size: 14px;
                        font-weight: 800;
                        color: #0052D4;
                        text-align: right;
                        margin-top: 2px;
                    }

                    .meta-grid {
                        display: grid;
                        grid-template-columns: 1fr 1fr;
                        gap: 32px;
                        margin-bottom: 36px;
                    }

                    .meta-label {
                        font-size: 10px;
                        font-weight: 800;
                        text-transform: uppercase;
                        letter-spacing: 0.8px;
                        color: #94a3b8;
                        margin-bottom: 6px;
                    }

                    .meta-title {
                        font-size: 15px;
                        font-weight: 800;
                        color: #0f172a;
                        margin-bottom: 4px;
                    }

                    .meta-text {
                        color: #475569;
                        font-size: 12px;
                        font-weight: 500;
                        margin-bottom: 2px;
                    }

                    .table-container {
                        border: 1px solid #e2e8f0;
                        border-radius: 16px;
                        overflow: hidden;
                        margin-bottom: 32px;
                    }

                    table {
                        width: 100%;
                        border-collapse: collapse;
                        text-align: left;
                    }

                    th {
                        background: #f8fafc;
                        padding: 14px 18px;
                        font-size: 10px;
                        font-weight: 800;
                        text-transform: uppercase;
                        letter-spacing: 0.8px;
                        color: #64748b;
                        border-bottom: 1px solid #e2e8f0;
                    }

                    td {
                        padding: 16px 18px;
                        font-size: 12px;
                        font-weight: 600;
                        color: #1e293b;
                        border-bottom: 1px solid #f1f5f9;
                    }

                    tr:last-child td {
                        border-bottom: none;
                    }

                    .mono-val {
                        font-family: 'JetBrains Mono', monospace;
                        font-weight: 800;
                    }

                    .status-pill {
                        display: inline-block;
                        padding: 4px 12px;
                        border-radius: 20px;
                        font-size: 10px;
                        font-weight: 800;
                        text-transform: uppercase;
                        letter-spacing: 0.5px;
                    }

                    .status-paid {
                        background: #dcfce7;
                        color: #15803d;
                        border: 1px solid #bbf7d0;
                    }

                    .status-pending {
                        background: #fef3c7;
                        color: #b45309;
                        border: 1px solid #fde68a;
                    }

                    .totals-section {
                        display: flex;
                        justify-content: flex-end;
                        margin-bottom: 40px;
                    }

                    .totals-box {
                        width: 320px;
                        background: #f8fafc;
                        border: 1px solid #e2e8f0;
                        border-radius: 16px;
                        padding: 20px;
                    }

                    .totals-row {
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                        margin-bottom: 10px;
                        font-size: 12px;
                        color: #64748b;
                        font-weight: 600;
                    }

                    .totals-row.final {
                        margin-top: 12px;
                        padding-top: 12px;
                        border-top: 2px solid #e2e8f0;
                        font-size: 14px;
                        font-weight: 800;
                        color: #0f172a;
                    }

                    .final-amount {
                        font-family: 'JetBrains Mono', monospace;
                        font-size: 20px;
                        font-weight: 900;
                        color: #0052D4;
                    }

                    .footer {
                        padding-top: 24px;
                        border-top: 1px solid #f1f5f9;
                        font-size: 11px;
                        color: #94a3b8;
                        text-align: center;
                        font-weight: 500;
                    }

                    @media print {
                        body { padding: 0; background: white; }
                        .invoice-container { max-width: 100%; }
                    }
                </style>
            </head>
            <body>
                <div class="invoice-container">
                    <div class="header">
                        <div style="display: flex; align-items: center; gap: 14px;">
                            <img src="${l.logo||"/app-logo-icon.png"}" alt="Company Logo" style="height: 48px; width: auto; object-fit: contain;" />
                            <div>
                                <div class="brand-name">${l.name}</div>
                                <div class="brand-sub">${l.email} ${l.phone?" • "+l.phone:""}</div>
                                ${l.address?`<div style="font-size: 11px; color: #64748b; font-weight: 500; margin-top: 2px;">${l.address}${l.tax_id?" • NTN: "+l.tax_id:""}</div>`:""}
                            </div>
                        </div>
                        <div>
                            <div class="invoice-title">INVOICE</div>
                            <div class="invoice-num">#INV-MS-${t.id}</div>
                        </div>
                    </div>

                    <div class="meta-grid">
                        <div>
                            <div class="meta-label">Billed To:</div>
                            <div class="meta-title">${((x=s.client)==null?void 0:x.company_name)||((d=s.client)==null?void 0:d.name)||"Client"}</div>
                            <div class="meta-text"><strong>Attn:</strong> ${((o=s.client)==null?void 0:o.name)||""}</div>
                            <div class="meta-text"><strong>Client Code:</strong> ${((b=s.client)==null?void 0:b.client_code)||"N/A"}</div>
                        </div>

                        <div style="text-align: right;">
                            <div class="meta-label">Invoice & Project Details:</div>
                            <div class="meta-text"><strong>Project:</strong> ${s.project_name}</div>
                            <div class="meta-text"><strong>Ref:</strong> #PROJ-${s.id}</div>
                            <div class="meta-text"><strong>Date:</strong> ${t.paid_at?c(t.paid_at):new Date().toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric"})}</div>
                            <div class="meta-text"><strong>Billing Currency:</strong> ${s.currency||((g=s.client)==null?void 0:g.currency)||"USD"}</div>
                        </div>
                    </div>

                    <div class="table-container">
                        <table>
                            <thead>
                                <tr>
                                    <th>Description / Milestone Title</th>
                                    <th>Stage</th>
                                    <th>Status</th>
                                    <th style="text-align: right;">Amount</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td>
                                        <div style="font-weight: 800; color: #0f172a;">${t.milestone_title}</div>
                                        ${t.notes?`<div style="font-size: 11px; color: #64748b; font-weight: 500; margin-top: 2px;">${t.notes}</div>`:""}
                                    </td>
                                    <td style="text-transform: capitalize;">${t.payment_stage}</td>
                                    <td>
                                        <span class="status-pill ${t.status==="paid"?"status-paid":"status-pending"}">
                                            ${t.status}
                                        </span>
                                    </td>
                                    <td style="text-align: right;" class="mono-val">${n(t.amount)}</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    <div class="totals-section">
                        <div class="totals-box">
                            <div class="totals-row">
                                <span>Milestone Amount:</span>
                                <span class="mono-val" style="color: #0f172a;">${n(t.amount)}</span>
                            </div>
                            <div class="totals-row">
                                <span>Status:</span>
                                <span style="font-weight: 800; text-transform: uppercase; ${t.status==="paid"?"color: #16a34a;":"color: #d97706;"}">${t.status}</span>
                            </div>
                            <div class="totals-row final">
                                <span>Total Settled:</span>
                                <span class="final-amount">${n(t.amount)}</span>
                            </div>
                        </div>
                    </div>

                    <div class="footer">
                        Thank you for your business! This is an official system-generated milestone invoice receipt.
                    </div>
                </div>

                <script>
                    window.onload = function() {
                        window.print();
                    };
                <\/script>
            </body>
            </html>
        `;a.document.write(r),a.document.close()};return e.jsxs(B,{breadcrumbs:C,children:[e.jsx(A,{title:`${s.project_name} - Project Workspace`}),e.jsxs("div",{className:"flex h-full flex-1 flex-col gap-6 p-4 sm:p-6 min-w-0",children:[e.jsx("div",{className:"flex items-center justify-between",children:e.jsxs(M,{href:"/website-projects",className:"inline-flex items-center gap-2 text-xs font-extrabold text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-white transition-colors",children:[e.jsx(F,{className:"size-4"}),e.jsx("span",{children:"Back to Website Projects Directory"})]})}),e.jsxs("div",{className:"p-6 rounded-xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-2xl border border-slate-200/80 dark:border-slate-800/80 shadow-xl space-y-5",children:[e.jsxs("div",{className:"flex flex-col md:flex-row md:items-center justify-between gap-4",children:[e.jsxs("div",{className:"space-y-2",children:[e.jsxs("div",{className:"flex flex-wrap items-center gap-2",children:[s.category&&e.jsx("span",{className:"px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200/60",children:s.category.name}),e.jsx("span",{className:`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider inline-flex items-center gap-1.5 ${s.status==="in_progress"?"bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200/60":s.status==="completed"?"bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200/60":s.status==="on_hold"?"bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200/60":"bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200/60"}`,children:s.status==="in_progress"?e.jsxs(e.Fragment,{children:[e.jsx(L,{className:"size-3"}),e.jsx("span",{children:"In Progress"})]}):s.status==="completed"?e.jsxs(e.Fragment,{children:[e.jsx(R,{className:"size-3"}),e.jsx("span",{children:"Completed"})]}):s.status==="on_hold"?e.jsxs(e.Fragment,{children:[e.jsx(U,{className:"size-3"}),e.jsx("span",{children:"On Hold"})]}):e.jsxs(e.Fragment,{children:[e.jsx(J,{className:"size-3"}),e.jsx("span",{children:"Cancelled"})]})})]}),e.jsx("h1",{className:"text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight",children:s.project_name}),s.client&&e.jsxs("p",{className:"text-xs text-slate-500 dark:text-slate-400 font-medium flex items-center gap-2",children:[e.jsx(O,{className:"size-4 text-blue-600"}),e.jsxs("span",{children:["Client: ",e.jsx("strong",{children:s.client.name})," (",s.client.company_name||"Individual",")"]}),e.jsx("span",{children:"•"}),e.jsx("span",{className:"font-mono text-blue-600 dark:text-blue-400",children:s.client.client_code})]})]}),e.jsxs("div",{className:"p-4 rounded-2xl bg-slate-50/80 dark:bg-slate-950/80 border border-slate-200/60 dark:border-slate-800 shrink-0 min-w-[200px] space-y-2",children:[e.jsxs("div",{className:"flex items-center justify-between text-xs font-bold",children:[e.jsx("span",{className:"text-slate-500 dark:text-slate-400",children:"Development Progress"}),e.jsxs("span",{className:"text-blue-600 font-extrabold font-mono",children:[s.progress_percentage,"%"]})]}),e.jsx("div",{className:"h-2.5 w-full rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden",children:e.jsx("div",{className:"h-full bg-gradient-to-r from-blue-500 via-indigo-600 to-purple-600 rounded-full transition-all duration-500",style:{width:`${s.progress_percentage}%`}})})]})]}),e.jsxs("div",{className:"grid grid-cols-1 sm:grid-cols-3 gap-4 pt-3 border-t border-slate-100 dark:border-slate-800",children:[e.jsxs("div",{className:"p-4 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white shadow-lg shadow-blue-500/20",children:[e.jsx("span",{className:"text-[10px] font-black uppercase tracking-wider text-blue-100 block",children:"Total Budget"}),e.jsx("h3",{className:"text-xl font-black font-mono mt-1",children:n(m)})]}),e.jsxs("div",{className:"p-4 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-700 text-white shadow-lg shadow-emerald-500/20",children:[e.jsx("span",{className:"text-[10px] font-black uppercase tracking-wider text-emerald-100 block",children:"Total Collected"}),e.jsx("h3",{className:"text-xl font-black font-mono mt-1",children:n(h)}),e.jsxs("p",{className:"text-[10px] text-emerald-100 mt-1 font-bold",children:[S,"% Payment Received"]})]}),e.jsxs("div",{className:"p-4 rounded-2xl bg-gradient-to-br from-rose-500 to-pink-700 text-white shadow-lg shadow-rose-500/20",children:[e.jsx("span",{className:"text-[10px] font-black uppercase tracking-wider text-rose-100 block",children:"Remaining Balance"}),e.jsx("h3",{className:"text-xl font-black font-mono mt-1",children:n(T)})]})]})]}),e.jsxs("div",{className:"flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin",children:[e.jsxs("button",{onClick:()=>p("details"),className:`px-5 py-2.5 rounded-xl text-xs font-black transition-all inline-flex items-center gap-2 shrink-0 ${i==="details"?"bg-gradient-to-r from-[#003796] via-[#0052D4] to-[#1d4ed8] text-white shadow-md shadow-blue-600/20":"bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"}`,children:[e.jsx(E,{className:"size-4"}),e.jsx("span",{children:"Project Overview & Specs"})]}),e.jsxs("button",{onClick:()=>p("budget"),className:`px-5 py-2.5 rounded-xl text-xs font-black transition-all inline-flex items-center gap-2 shrink-0 ${i==="budget"?"bg-gradient-to-r from-[#003796] via-[#0052D4] to-[#1d4ed8] text-white shadow-md shadow-blue-600/20":"bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"}`,children:[e.jsx(W,{className:"size-4"}),e.jsxs("span",{children:["Milestone Payments (",((N=s.payments)==null?void 0:N.length)||0,")"]})]}),e.jsxs("button",{onClick:()=>p("tasks"),className:`px-5 py-2.5 rounded-xl text-xs font-black transition-all inline-flex items-center gap-2 shrink-0 ${i==="tasks"?"bg-gradient-to-r from-[#003796] via-[#0052D4] to-[#1d4ed8] text-white shadow-md shadow-blue-600/20":"bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"}`,children:[e.jsx(K,{className:"size-4"}),e.jsxs("span",{children:["Deliverables & Tasks (",((v=s.tasks)==null?void 0:v.length)||0,")"]})]}),e.jsxs("button",{onClick:()=>p("credentials"),className:`px-5 py-2.5 rounded-xl text-xs font-black transition-all inline-flex items-center gap-2 shrink-0 ${i==="credentials"?"bg-gradient-to-r from-[#003796] via-[#0052D4] to-[#1d4ed8] text-white shadow-md shadow-blue-600/20":"bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"}`,children:[e.jsx(V,{className:"size-4"}),e.jsxs("span",{children:["Access Logins (",((j=s.credentials)==null?void 0:j.length)||0,")"]})]})]}),i==="details"&&e.jsxs("div",{className:"grid grid-cols-1 lg:grid-cols-3 gap-6",children:[e.jsxs("div",{className:"lg:col-span-2 space-y-6",children:[e.jsxs("div",{className:"p-6 rounded-xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-2xl border border-slate-200/80 dark:border-slate-800/80 shadow-xl space-y-4",children:[e.jsxs("h3",{className:"text-base font-black text-slate-900 dark:text-white flex items-center gap-2",children:[e.jsx(H,{className:"size-4 text-blue-600"}),e.jsx("span",{children:"Project Notes & Requirements"})]}),s.notes?e.jsx("div",{className:"p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200/60 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap font-medium",children:s.notes}):e.jsx("p",{className:"text-xs text-slate-400 italic",children:"No specific project notes provided."})]}),e.jsxs("div",{className:"p-6 rounded-xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-2xl border border-slate-200/80 dark:border-slate-800/80 shadow-xl space-y-4",children:[e.jsxs("h3",{className:"text-base font-black text-slate-900 dark:text-white flex items-center gap-2",children:[e.jsx(Y,{className:"size-4 text-emerald-600"}),e.jsx("span",{children:"Project Timeline & Key Dates"})]}),e.jsxs("div",{className:"grid grid-cols-1 sm:grid-cols-2 gap-4",children:[e.jsxs("div",{className:"p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200/60 dark:border-slate-800 space-y-1",children:[e.jsx("span",{className:"text-[10px] font-black uppercase text-slate-400",children:"Start Date"}),e.jsx("p",{className:"text-sm font-black text-slate-900 dark:text-white font-mono",children:c(s.start_date)})]}),e.jsxs("div",{className:"p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200/60 dark:border-slate-800 space-y-1",children:[e.jsx("span",{className:"text-[10px] font-black uppercase text-slate-400",children:"Target Deadline"}),e.jsx("p",{className:"text-sm font-black text-blue-600 dark:text-blue-400 font-mono",children:c(s.deadline)})]})]})]})]}),e.jsx("div",{className:"space-y-6",children:e.jsxs("div",{className:"p-6 rounded-xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-2xl border border-slate-200/80 dark:border-slate-800/80 shadow-xl space-y-4",children:[e.jsxs("h3",{className:"text-base font-black text-slate-900 dark:text-white flex items-center gap-2",children:[e.jsx(q,{className:"size-4 text-purple-600"}),e.jsx("span",{children:"Client Information"})]}),s.client?e.jsxs("div",{className:"space-y-3 text-xs",children:[e.jsxs("div",{className:"p-3 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200/60 dark:border-slate-800 space-y-1",children:[e.jsx("span",{className:"text-[10px] text-slate-400 font-bold uppercase",children:"Client Name"}),e.jsx("p",{className:"font-extrabold text-slate-900 dark:text-white",children:s.client.name})]}),e.jsxs("div",{className:"p-3 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200/60 dark:border-slate-800 space-y-1",children:[e.jsx("span",{className:"text-[10px] text-slate-400 font-bold uppercase",children:"Company"}),e.jsx("p",{className:"font-extrabold text-slate-900 dark:text-white",children:s.client.company_name||"Individual"})]}),e.jsxs("div",{className:"p-3 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200/60 dark:border-slate-800 space-y-1",children:[e.jsx("span",{className:"text-[10px] text-slate-400 font-bold uppercase",children:"Client Code"}),e.jsx("p",{className:"font-extrabold font-mono text-blue-600",children:s.client.client_code})]})]}):e.jsx("p",{className:"text-xs text-slate-400 italic",children:"No client assigned to this project."})]})})]}),i==="budget"&&e.jsxs("div",{className:"p-6 rounded-xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-2xl border border-slate-200/80 dark:border-slate-800/80 shadow-xl space-y-4",children:[e.jsx("div",{className:"flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800",children:e.jsxs("div",{children:[e.jsx("h3",{className:"text-base font-black text-slate-900 dark:text-white",children:"Project Milestone Payments & Billing"}),e.jsx("p",{className:"text-xs text-slate-400 font-medium",children:"Read-only list of milestone payments and invoice status."})]})}),s.payments&&s.payments.length>0?e.jsx("div",{className:"w-full overflow-x-auto scrollbar-thin",children:e.jsxs("table",{className:"w-full text-left text-xs min-w-[750px]",children:[e.jsx("thead",{className:"bg-slate-50 dark:bg-slate-950/70 border-b border-slate-200/80 dark:border-slate-800 uppercase tracking-wider text-[10px] font-extrabold text-slate-400",children:e.jsxs("tr",{children:[e.jsx("th",{className:"px-4 py-3 whitespace-nowrap",children:"Milestone Title"}),e.jsx("th",{className:"px-4 py-3 whitespace-nowrap",children:"Stage"}),e.jsx("th",{className:"px-4 py-3 whitespace-nowrap",children:"Amount"}),e.jsx("th",{className:"px-4 py-3 whitespace-nowrap",children:"Status"}),e.jsx("th",{className:"px-4 py-3 whitespace-nowrap",children:"Paid Date"}),e.jsx("th",{className:"px-4 py-3 text-right whitespace-nowrap",children:"Invoice"})]})}),e.jsx("tbody",{className:"divide-y divide-slate-100 dark:divide-slate-800 font-medium",children:s.payments.map(t=>e.jsxs("tr",{className:"hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors",children:[e.jsxs("td",{className:"px-4 py-3.5 whitespace-nowrap",children:[e.jsx("span",{className:"font-extrabold text-slate-900 dark:text-white block",children:t.milestone_title}),t.notes&&e.jsx("span",{className:"text-[11px] text-slate-400 block",children:t.notes})]}),e.jsx("td",{className:"px-4 py-3.5 whitespace-nowrap",children:e.jsx("span",{className:"px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200/60",children:t.payment_stage})}),e.jsx("td",{className:"px-4 py-3.5 whitespace-nowrap font-black font-mono text-slate-900 dark:text-white",children:n(t.amount)}),e.jsx("td",{className:"px-4 py-3.5 whitespace-nowrap",children:e.jsx("span",{className:`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${t.status==="paid"?"bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200/60":"bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200/60"}`,children:t.status})}),e.jsx("td",{className:"px-4 py-3.5 whitespace-nowrap text-slate-400 font-mono text-[11px]",children:c(t.paid_at)}),e.jsx("td",{className:"px-4 py-3.5 text-right whitespace-nowrap",children:e.jsxs("button",{onClick:()=>I(t),className:"px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-blue-600 hover:text-white font-extrabold text-[11px] inline-flex items-center gap-1.5 transition-all",children:[e.jsx(G,{className:"size-3.5"}),e.jsx("span",{children:"Print Invoice"})]})})]},t.id))})]})}):e.jsx("p",{className:"text-xs text-slate-400 italic text-center py-8",children:"No payment milestones recorded for this project."})]}),i==="tasks"&&e.jsxs("div",{className:"p-6 rounded-xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-2xl border border-slate-200/80 dark:border-slate-800/80 shadow-xl space-y-4",children:[e.jsx("div",{className:"flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800",children:e.jsxs("div",{children:[e.jsx("h3",{className:"text-base font-black text-slate-900 dark:text-white",children:"Project Deliverables & Tasks"}),e.jsx("p",{className:"text-xs text-slate-400 font-medium",children:"Read-only list of project tasks and assigned team members."})]})}),s.tasks&&s.tasks.length>0?e.jsx("div",{className:"w-full overflow-x-auto scrollbar-thin",children:e.jsxs("table",{className:"w-full text-left text-xs min-w-[750px]",children:[e.jsx("thead",{className:"bg-slate-50 dark:bg-slate-950/70 border-b border-slate-200/80 dark:border-slate-800 uppercase tracking-wider text-[10px] font-extrabold text-slate-400",children:e.jsxs("tr",{children:[e.jsx("th",{className:"px-4 py-3 whitespace-nowrap",children:"Task Title"}),e.jsx("th",{className:"px-4 py-3 whitespace-nowrap",children:"Assigned Member"}),e.jsx("th",{className:"px-4 py-3 whitespace-nowrap",children:"Priority"}),e.jsx("th",{className:"px-4 py-3 whitespace-nowrap",children:"Status"}),e.jsx("th",{className:"px-4 py-3 whitespace-nowrap",children:"Due Date"})]})}),e.jsx("tbody",{className:"divide-y divide-slate-100 dark:divide-slate-800 font-medium",children:s.tasks.map(t=>e.jsxs("tr",{className:"hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors",children:[e.jsxs("td",{className:"px-4 py-3.5 whitespace-nowrap",children:[e.jsx("span",{className:"font-extrabold text-slate-900 dark:text-white block",children:t.task_title}),t.description&&e.jsx("span",{className:"text-[11px] text-slate-400 block max-w-xs truncate",children:t.description})]}),e.jsx("td",{className:"px-4 py-3.5 whitespace-nowrap",children:t.assigned_employee?e.jsxs("div",{className:"flex items-center gap-2",children:[e.jsx("div",{className:"size-7 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-extrabold text-xs",children:t.assigned_employee.name.charAt(0)}),e.jsx("span",{className:"font-bold text-slate-900 dark:text-white",children:t.assigned_employee.name})]}):e.jsx("span",{className:"text-slate-400 italic",children:"Unassigned"})}),e.jsx("td",{className:"px-4 py-3.5 whitespace-nowrap",children:e.jsx("span",{className:`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${t.priority==="urgent"?"bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200/60":t.priority==="high"?"bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200/60":"bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200/60"}`,children:t.priority})}),e.jsx("td",{className:"px-4 py-3.5 whitespace-nowrap",children:e.jsx("span",{className:`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${t.status==="completed"?"bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200/60":t.status==="in_progress"?"bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 border border-purple-200/60":"bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300"}`,children:t.status.replace("_"," ")})}),e.jsx("td",{className:"px-4 py-3.5 whitespace-nowrap font-mono text-[11px] text-slate-400",children:c(t.due_date)})]},t.id))})]})}):e.jsx("p",{className:"text-xs text-slate-400 italic text-center py-8",children:"No tasks created for this project."})]}),i==="credentials"&&e.jsxs("div",{className:"p-6 rounded-xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-2xl border border-slate-200/80 dark:border-slate-800/80 shadow-xl space-y-4",children:[e.jsx("div",{className:"flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800",children:e.jsxs("div",{children:[e.jsx("h3",{className:"text-base font-black text-slate-900 dark:text-white",children:"Project Access Logins & Credentials"}),e.jsx("p",{className:"text-xs text-slate-400 font-medium",children:"Read-only list of hosting, CMS, database, and admin access keys."})]})}),s.credentials&&s.credentials.length>0?e.jsx("div",{className:"grid grid-cols-1 md:grid-cols-2 gap-4",children:s.credentials.map(t=>e.jsxs("div",{className:"p-5 rounded-2xl bg-slate-50/80 dark:bg-slate-950/80 border border-slate-200/60 dark:border-slate-800 space-y-3",children:[e.jsxs("div",{className:"flex items-center justify-between",children:[e.jsx("span",{className:"font-extrabold text-sm text-slate-900 dark:text-white",children:t.title}),e.jsx("span",{className:"px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200/60",children:t.type})]}),e.jsxs("div",{className:"space-y-2 text-xs",children:[t.url&&e.jsxs("div",{className:"flex items-center justify-between p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800",children:[e.jsx("span",{className:"text-slate-400 font-bold text-[10px] uppercase",children:"URL"}),e.jsx("a",{href:t.url.startsWith("http")?t.url:`https://${t.url}`,target:"_blank",rel:"noreferrer",className:"text-blue-600 font-bold hover:underline truncate max-w-[200px]",children:t.url})]}),t.username&&e.jsxs("div",{className:"flex items-center justify-between p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800",children:[e.jsx("span",{className:"text-slate-400 font-bold text-[10px] uppercase",children:"Username"}),e.jsxs("div",{className:"flex items-center gap-2",children:[e.jsx("span",{className:"font-mono font-bold text-slate-900 dark:text-white",children:t.username}),e.jsx("button",{onClick:()=>k(t.username,`u-${t.id}`),className:"text-slate-400 hover:text-blue-600 p-1",title:"Copy Username",children:e.jsx(y,{className:"size-3.5"})})]})]}),t.password&&e.jsxs("div",{className:"flex items-center justify-between p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800",children:[e.jsx("span",{className:"text-slate-400 font-bold text-[10px] uppercase",children:"Password"}),e.jsxs("div",{className:"flex items-center gap-2",children:[e.jsx("span",{className:"font-mono font-bold text-slate-900 dark:text-white",children:u[t.id]?t.password:"••••••••••••"}),e.jsx("button",{onClick:()=>D(t.id),className:"text-slate-400 hover:text-blue-600 p-1",children:u[t.id]?e.jsx(Q,{className:"size-3.5"}):e.jsx(X,{className:"size-3.5"})}),e.jsx("button",{onClick:()=>k(t.password,`p-${t.id}`),className:"text-slate-400 hover:text-blue-600 p-1",title:"Copy Password",children:e.jsx(y,{className:"size-3.5"})})]})]})]})]},t.id))}):e.jsx("p",{className:"text-xs text-slate-400 italic text-center py-8",children:"No access logins saved for this project."})]})]})]})}export{$e as default};
