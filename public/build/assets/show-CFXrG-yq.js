import{K as X,r as o,j as e,L as Y,$ as Q,S as z}from"./app-B44lyIJU.js";import{C as Z}from"./client-portal-layout-DyS_58F0.js";import{F,U as ee,X as te}from"./app-toaster-B3WtKB4x.js";import{R as _}from"./receipt-BScHAj44.js";import{A as se}from"./arrow-left-w_r7kCY0.js";import{C as k}from"./circle-check-P7A9B9jr.js";import{C as ae}from"./circle-pause-CRLR9hCG.js";import{C as re}from"./circle-stop-CXD1sre3.js";import{B as le}from"./building-CnaY7J3h.js";import{D as de}from"./dollar-sign-tq2LwjxO.js";import{P as ne,R as oe}from"./refresh-cw-Dw91sS26.js";import{C as ie}from"./calendar-C6bqtKmI.js";import{P as ce}from"./plus-67uQWPIi.js";import{P as xe}from"./printer-BjIHyogF.js";import{L as me}from"./lock-CYpRb9W0.js";import{T as pe}from"./trash-2-Pb2LSv-A.js";import{L as $}from"./loader-circle-D89XdILI.js";import{T as be}from"./triangle-alert-CCm41k78.js";import"./client-sidebar-CnzBI8g4.js";import"./button-FkCh6mYg.js";import"./index-hXXqdqPu.js";import"./index-D00CtJ2r.js";import"./input-BPbx18WE.js";function Oe({client:a,service:s,company:L}){var B;const{auth:he}=X().props,d=L||{name:"Sapta Technologies",email:"contact@saptatechnologies.com",phone:"+92 300 1234567",address:"Office #402, Software Technology Park, Lahore, Pakistan",tax_id:"NTN-892415-0",logo:"/app-logo-icon.png"},G=[{title:"Client Portal",href:"/client-portal/overview"},{title:"Services",href:"/client-portal/services"},{title:s.service_name,href:`/client-portal/services/${s.id}`}],O=()=>{if(typeof window<"u"){const r=new URLSearchParams(window.location.search).get("tab");if(r==="payments"||r==="details")return r}return"details"},[x,R]=o.useState(O),D=t=>{if(R(t),typeof window<"u"){const r=new URL(window.location.href);r.searchParams.set("tab",t),window.history.replaceState({},"",r.toString())}},[E,m]=o.useState(!1),[M,A]=o.useState(new Date().toISOString().slice(0,7)),[T,p]=o.useState(!1),[i,y]=o.useState(null),[v,b]=o.useState(!1),[h,N]=o.useState(null),[w,g]=o.useState(!1),S=t=>{if(!t)return"N/A";const r=t.includes("T")?t.split("T")[0]:t.split(" ")[0],n=r.split("-");if(n.length===3){const c=parseInt(n[0],10),f=parseInt(n[1],10)-1,j=parseInt(n[2],10);if(!isNaN(c)&&!isNaN(f)&&!isNaN(j)&&f>=0&&f<12){const W=["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];return`${j<10?`0${j}`:`${j}`} ${W[f]} ${c}`}}return r},l=(t,r=s.currency||a.currency||"$")=>{const n=typeof t=="number"?t:parseFloat(t||"0");return`${r} ${n.toLocaleString("en-US",{minimumFractionDigits:2,maximumFractionDigits:2})}`},P=s.contract_months||12,C=Number(s.monthly_fee)*P,u=s.payments||[],I=u.filter(t=>t.status==="paid").reduce((t,r)=>t+Number(r.amount_paid||0),0),J=C>0?Math.min(100,Math.round(I/C*100)):0,U=()=>{A(new Date().toISOString().slice(0,7)),m(!0)},V=t=>{t.preventDefault(),p(!0),z.post("/client-portal/services/payments/generate",{client_service_id:s.id,billing_month:M},{preserveScroll:!0,onSuccess:()=>{m(!1),p(!1)},onError:()=>{p(!1)},onFinish:()=>{p(!1)}})},H=()=>{if(!i)return;b(!0);const t={amount_due:i.amount_due,amount_paid:i.amount_due,payment_date:new Date().toISOString().split("T")[0],status:"paid"};z.put(`/client-portal/services/payments/update/${i.id}`,t,{preserveScroll:!0,onSuccess:()=>{y(null),b(!1)},onError:()=>{b(!1)},onFinish:()=>{b(!1)}})},q=()=>{h&&(g(!0),z.delete(`/client-portal/services/payments/destroy/${h.id}`,{preserveScroll:!0,onSuccess:()=>{N(null),g(!1)},onError:()=>{g(!1)},onFinish:()=>{g(!1)}}))},K=t=>{var c;const r=window.open("","_blank");if(!r)return;const n=`
            <!DOCTYPE html>
            <html>
            <head>
                <title>Service Invoice Statement - #${t.id}</title>
                <style>
                    @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800;900&family=JetBrains+Mono:wght@600;800&display=swap');
                    
                    * { box-sizing: border-box; margin: 0; padding: 0; }
                    body {
                        font-family: 'Plus Jakarta Sans', sans-serif;
                        background: #ffffff;
                        color: #0f172a;
                        padding: 40px;
                        -webkit-print-color-adjust: exact;
                    }

                    .invoice-container {
                        max-width: 800px;
                        margin: 0 auto;
                        border: 1px solid #e2e8f0;
                        border-radius: 24px;
                        padding: 40px;
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
                        color: #003796;
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
                        color: #0f172a;
                        text-align: right;
                        letter-spacing: -0.5px;
                    }

                    .invoice-num {
                        font-family: 'JetBrains Mono', monospace;
                        font-size: 13px;
                        color: #0052D4;
                        font-weight: 800;
                        text-align: right;
                        margin-top: 4px;
                    }

                    .meta-grid {
                        display: grid;
                        grid-template-columns: 1fr 1fr;
                        gap: 24px;
                        margin-bottom: 32px;
                    }

                    .meta-label {
                        font-size: 10px;
                        font-weight: 800;
                        text-transform: uppercase;
                        letter-spacing: 0.5px;
                        color: #94a3b8;
                        margin-bottom: 6px;
                    }

                    .meta-title {
                        font-size: 15px;
                        font-weight: 800;
                        color: #0f172a;
                    }

                    .meta-text {
                        font-size: 12px;
                        color: #475569;
                        margin-top: 2px;
                        font-weight: 500;
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
                        letter-spacing: 0.5px;
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
                            <img src="${d.logo||"/app-logo-icon.png"}" alt="Company Logo" style="height: 48px; width: auto; object-fit: contain;" />
                            <div>
                                <div class="brand-name">${d.name}</div>
                                <div class="brand-sub">${d.email} ${d.phone?" • "+d.phone:""}</div>
                                ${d.address?`<div style="font-size: 11px; color: #64748b; font-weight: 500; margin-top: 2px;">${d.address}${d.tax_id?" • NTN: "+d.tax_id:""}</div>`:""}
                            </div>
                        </div>
                        <div>
                            <div class="invoice-title">SERVICE INVOICE</div>
                            <div class="invoice-num">#INV-SRV-${t.id}</div>
                        </div>
                    </div>

                    <div class="meta-grid">
                        <div>
                            <div class="meta-label">Billed To:</div>
                            <div class="meta-title">${a.company_name||a.name}</div>
                            <div class="meta-text"><strong>Attn:</strong> ${a.name}</div>
                            <div class="meta-text"><strong>Client Code:</strong> ${a.client_code}</div>
                        </div>

                        <div style="text-align: right;">
                            <div class="meta-label">Invoice & Service Details:</div>
                            <div class="meta-text"><strong>Service:</strong> ${s.service_name}</div>
                            <div class="meta-text"><strong>Category:</strong> ${((c=s.category)==null?void 0:c.name)||"General"}</div>
                            <div class="meta-text"><strong>Billing Month:</strong> ${t.billing_month}</div>
                            <div class="meta-text"><strong>Date:</strong> ${t.payment_date?S(t.payment_date):new Date().toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric"})}</div>
                        </div>
                    </div>

                    <div class="table-container">
                        <table>
                            <thead>
                                <tr>
                                    <th>Description / Billing Month</th>
                                    <th>Status</th>
                                    <th style="text-align: right;">Amount Due</th>
                                    <th style="text-align: right;">Amount Paid</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td>
                                        <div style="font-weight: 800; color: #0f172a;">${s.service_name} (${t.billing_month})</div>
                                        ${t.notes?`<div style="font-size: 11px; color: #64748b; font-weight: 500; margin-top: 2px;">${t.notes}</div>`:""}
                                    </td>
                                    <td>
                                        <span class="status-pill ${t.status==="paid"?"status-paid":"status-pending"}">
                                            ${t.status==="paid"?"Paid":t.status==="overdue"?"Overdue":"Pending"}
                                        </span>
                                    </td>
                                    <td style="text-align: right;" class="mono-val">${l(t.amount_due)}</td>
                                    <td style="text-align: right;" class="mono-val" style="color: #16a34a;">${l(t.amount_paid)}</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    <div class="totals-section">
                        <div class="totals-box">
                            <div class="totals-row">
                                <span>Amount Due:</span>
                                <span class="mono-val" style="color: #0f172a;">${l(t.amount_due)}</span>
                            </div>
                            <div class="totals-row">
                                <span>Amount Paid:</span>
                                <span class="mono-val" style="color: #16a34a;">${l(t.amount_paid)}</span>
                            </div>
                            <div class="totals-row final">
                                <span>Total Paid:</span>
                                <span class="final-amount">${l(t.amount_paid)}</span>
                            </div>
                        </div>
                    </div>

                    <div class="footer">
                        Thank you for your business! This is an official system-generated service invoice statement.
                    </div>
                </div>

                <script>
                    window.onload = function() {
                        window.print();
                    };
                <\/script>
            </body>
            </html>
        `;r.document.write(n),r.document.close()};return e.jsxs(Z,{client:a,breadcrumbs:G,children:[e.jsx(Y,{title:`${s.service_name} | ${a.name}`}),e.jsxs("div",{className:"p-2 sm:p-6 w-full space-y-6 bg-slate-50/50 dark:bg-slate-950",children:[e.jsxs("div",{className:"flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs",children:[e.jsxs("div",{className:"flex flex-wrap items-center gap-1.5",children:[e.jsxs("button",{type:"button",onClick:()=>D("details"),className:`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${x==="details"?"bg-gradient-to-r from-[#003796] via-[#0052D4] to-[#1d4ed8] text-white shadow-md shadow-blue-600/20":"text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"}`,children:[e.jsx(F,{className:"size-4"}),e.jsx("span",{children:"1. Details"})]}),e.jsxs("button",{type:"button",onClick:()=>D("payments"),className:`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${x==="payments"?"bg-gradient-to-r from-[#003796] via-[#0052D4] to-[#1d4ed8] text-white shadow-md shadow-blue-600/20":"text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"}`,children:[e.jsx(_,{className:"size-4"}),e.jsxs("span",{children:["2. Payments (",u.length,")"]})]})]}),e.jsxs(Q,{href:"/client-portal/services",className:"px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shrink-0",children:[e.jsx(se,{className:"size-4"}),e.jsx("span",{children:"Back to Services"})]})]}),x==="details"&&e.jsxs("div",{className:"space-y-6",children:[e.jsx("div",{className:"p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6",children:e.jsxs("div",{className:"space-y-2",children:[e.jsxs("div",{className:"flex flex-wrap items-center gap-2",children:[e.jsx("h1",{className:"text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight",children:s.service_name}),s.category&&e.jsx("span",{className:"px-2.5 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800",children:s.category.name}),e.jsx("span",{className:`px-3 py-1 rounded-full text-xs font-extrabold capitalize inline-flex items-center gap-1 ${s.status==="active"?"bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800":s.status==="paused"?"bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800":"bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800"}`,children:s.status==="active"?e.jsxs(e.Fragment,{children:[e.jsx(k,{className:"size-3.5"}),e.jsx("span",{children:"Active"})]}):s.status==="paused"?e.jsxs(e.Fragment,{children:[e.jsx(ae,{className:"size-3.5"}),e.jsx("span",{children:"Paused"})]}):e.jsxs(e.Fragment,{children:[e.jsx(re,{className:"size-3.5"}),e.jsx("span",{children:"Stopped"})]})})]}),e.jsxs("p",{className:"text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2",children:[e.jsx(le,{className:"size-3.5 text-blue-600 dark:text-blue-400"}),e.jsx("span",{className:"font-bold text-slate-700 dark:text-slate-300",children:a.name}),e.jsxs("span",{className:"font-mono text-blue-600 text-[11px] font-bold",children:["(",a.client_code,")"]}),a.company_name&&e.jsxs("span",{children:["• ",a.company_name]})]})]})}),e.jsxs("div",{className:"grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4",children:[e.jsxs("div",{className:"p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-2",children:[e.jsxs("div",{className:"flex items-center justify-between",children:[e.jsx("span",{className:"text-xs font-bold uppercase tracking-wider text-slate-400",children:"Monthly Fee"}),e.jsx("div",{className:"p-2 rounded-xl bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400",children:e.jsx(de,{className:"size-4"})})]}),e.jsxs("p",{className:"text-xl font-extrabold text-slate-900 dark:text-white",children:[l(s.monthly_fee)," ",e.jsx("span",{className:"text-xs text-slate-400 font-semibold",children:"/ mo"})]}),e.jsxs("p",{className:"text-xs text-slate-400 font-medium pt-2 border-t border-slate-100 dark:border-slate-800",children:["Billing Currency: ",e.jsx("strong",{className:"text-slate-700 dark:text-slate-300 font-mono",children:s.currency||a.currency})]})]}),e.jsxs("div",{className:"p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-2",children:[e.jsxs("div",{className:"flex items-center justify-between",children:[e.jsx("span",{className:"text-xs font-bold uppercase tracking-wider text-slate-400",children:"Contract Value"}),e.jsx("div",{className:"p-2 rounded-xl bg-purple-50 dark:bg-purple-950 text-purple-600 dark:text-purple-400",children:e.jsx(ne,{className:"size-4"})})]}),e.jsx("p",{className:"text-xl font-extrabold text-slate-900 dark:text-white",children:l(C)}),e.jsxs("p",{className:"text-xs text-slate-400 font-medium pt-2 border-t border-slate-100 dark:border-slate-800",children:["Duration: ",e.jsxs("strong",{className:"text-slate-700 dark:text-slate-300",children:[P," Months"]})]})]}),e.jsxs("div",{className:"p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-2",children:[e.jsxs("div",{className:"flex items-center justify-between",children:[e.jsx("span",{className:"text-xs font-bold uppercase tracking-wider text-slate-400",children:"Billing Cycle"}),e.jsx("div",{className:"p-2 rounded-xl bg-amber-50 dark:bg-amber-950 text-amber-600 dark:text-amber-400",children:e.jsx(ie,{className:"size-4"})})]}),e.jsxs("p",{className:"text-base font-extrabold text-slate-900 dark:text-white",children:["Day ",s.billing_day," of month"]}),e.jsxs("p",{className:"text-xs text-slate-400 font-medium pt-2 border-t border-slate-100 dark:border-slate-800",children:["Started: ",S(s.start_date)]})]}),e.jsxs("div",{className:"p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-2",children:[e.jsxs("div",{className:"flex items-center justify-between",children:[e.jsx("span",{className:"text-xs font-bold uppercase tracking-wider text-slate-400",children:"Total Paid"}),e.jsx("div",{className:"p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400",children:e.jsx(oe,{className:"size-4"})})]}),e.jsx("p",{className:"text-xl font-extrabold text-emerald-600 dark:text-emerald-400",children:l(I)}),e.jsx("div",{className:"w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden",children:e.jsx("div",{className:"bg-emerald-500 h-1.5 rounded-full transition-all duration-500",style:{width:`${J}%`}})})]})]}),e.jsxs("div",{className:"grid grid-cols-1 lg:grid-cols-3 gap-6",children:[e.jsxs("div",{className:"lg:col-span-2 p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-4",children:[e.jsxs("h3",{className:"text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2",children:[e.jsx(F,{className:"size-4 text-blue-600"}),e.jsx("span",{children:"Service Scope & Deliverables"})]}),e.jsxs("div",{className:"grid grid-cols-1 md:grid-cols-3 gap-4 mb-2",children:[e.jsxs("div",{className:"p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800 space-y-1",children:[e.jsx("span",{className:"text-[10px] font-extrabold uppercase tracking-wider text-slate-400",children:"Category"}),e.jsx("p",{className:"text-sm font-extrabold text-slate-900 dark:text-white",children:((B=s.category)==null?void 0:B.name)||"General Service"})]}),e.jsxs("div",{className:"p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800 space-y-1",children:[e.jsx("span",{className:"text-[10px] font-extrabold uppercase tracking-wider text-slate-400",children:"Monthly Due Day"}),e.jsxs("p",{className:"text-sm font-extrabold text-slate-900 dark:text-white",children:["Day ",s.billing_day," of month"]})]}),e.jsxs("div",{className:"p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800 space-y-1",children:[e.jsx("span",{className:"text-[10px] font-extrabold uppercase tracking-wider text-slate-400",children:"Contract Duration"}),e.jsxs("p",{className:"text-sm font-extrabold text-slate-900 dark:text-white",children:[P," Months"]})]})]}),e.jsx("div",{className:"p-5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800 text-xs font-medium text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed",children:s.notes||"No custom scope notes logged for this service subscription."})]}),e.jsxs("div",{className:"p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-4",children:[e.jsxs("h3",{className:"text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2",children:[e.jsx(ee,{className:"size-4 text-blue-600"}),e.jsx("span",{children:"Account Info"})]}),e.jsxs("div",{className:"space-y-4 text-xs",children:[e.jsxs("div",{className:"flex items-center gap-3 p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800",children:[e.jsx("div",{className:"size-10 rounded-xl bg-gradient-to-br from-[#003796] to-[#1d4ed8] text-white font-black text-sm flex items-center justify-center shrink-0",children:a.name.charAt(0).toUpperCase()}),e.jsxs("div",{children:[e.jsx("h4",{className:"font-extrabold text-slate-900 dark:text-white text-sm",children:a.name}),e.jsx("span",{className:"font-mono text-blue-600 dark:text-blue-400 text-[11px] font-bold",children:a.client_code})]})]}),e.jsxs("div",{className:"space-y-2 text-slate-600 dark:text-slate-300 font-medium",children:[e.jsxs("div",{className:"flex items-center justify-between py-1 border-b border-slate-100 dark:border-slate-800",children:[e.jsx("span",{className:"text-slate-400",children:"Company Name"}),e.jsx("span",{className:"font-bold text-slate-800 dark:text-slate-200",children:a.company_name||"N/A"})]}),e.jsxs("div",{className:"flex items-center justify-between py-1 border-b border-slate-100 dark:border-slate-800",children:[e.jsx("span",{className:"text-slate-400",children:"Account Currency"}),e.jsx("span",{className:"font-mono font-bold text-slate-800 dark:text-slate-200",children:a.currency||"USD"})]}),e.jsxs("div",{className:"flex items-center justify-between py-1 border-b border-slate-100 dark:border-slate-800",children:[e.jsx("span",{className:"text-slate-400",children:"Subscription Status"}),e.jsx("span",{className:"font-bold capitalize text-slate-800 dark:text-slate-200",children:s.status})]})]})]})]})]})]}),x==="payments"&&e.jsxs("div",{className:"space-y-4",children:[e.jsxs("div",{className:"flex items-center justify-between",children:[e.jsxs("h3",{className:"text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2",children:[e.jsx(_,{className:"size-4 text-emerald-600"}),e.jsx("span",{children:"Monthly Billing & Payment History"})]}),e.jsxs("button",{type:"button",onClick:U,className:"px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-md shadow-emerald-600/20 flex items-center gap-1.5 cursor-pointer",children:[e.jsx(ce,{className:"size-4"}),e.jsx("span",{children:"Generate Monthly Bill"})]})]}),e.jsx("div",{className:"rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 overflow-hidden shadow-2xs w-full min-w-0",children:e.jsx("div",{className:"w-full overflow-x-auto scrollbar-thin",children:e.jsxs("table",{className:"w-full min-w-[750px] text-left text-xs",children:[e.jsx("thead",{className:"bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 font-extrabold uppercase text-[10px] tracking-wider border-b border-slate-200 dark:border-slate-800",children:e.jsxs("tr",{children:[e.jsx("th",{className:"px-2 py-4",children:"Billing Month"}),e.jsx("th",{className:"px-2 py-4",children:"Amount Due"}),e.jsx("th",{className:"px-2 py-4",children:"Amount Paid"}),e.jsx("th",{className:"px-2 py-4",children:"Status"}),e.jsx("th",{className:"px-2 py-4",children:"Payment Date"}),e.jsx("th",{className:"px-2 py-4 text-right",children:"Actions"})]})}),e.jsx("tbody",{className:"divide-y divide-slate-100 dark:divide-slate-800 font-medium text-slate-700 dark:text-slate-300",children:u.length>0?u.map(t=>e.jsxs("tr",{className:"hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors",children:[e.jsx("td",{className:"px-2 py-4 font-bold text-slate-900 dark:text-white font-mono",children:t.billing_month}),e.jsx("td",{className:"px-2 py-4 font-bold text-slate-900 dark:text-white font-mono",children:l(t.amount_due)}),e.jsx("td",{className:"px-2 py-4 font-bold text-emerald-600 dark:text-emerald-400 font-mono",children:l(t.amount_paid)}),e.jsx("td",{className:"px-2 py-4",children:e.jsx("span",{className:`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${t.status==="paid"?"bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800":t.status==="overdue"?"bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200 dark:border-rose-800":"bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-800"}`,children:t.status==="paid"?"Paid / Cleared":t.status==="overdue"?"Overdue":"Due Pending"})}),e.jsx("td",{className:"px-2 py-4 text-slate-500 font-medium",children:S(t.payment_date)}),e.jsx("td",{className:"px-2 py-4 text-right",children:e.jsxs("div",{className:"flex items-center justify-end gap-1.5",children:[e.jsxs("button",{type:"button",onClick:()=>K(t),className:"h-8 px-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-blue-600 hover:text-white transition-all font-bold text-[11px] inline-flex items-center gap-1.5 cursor-pointer",title:"View / Print Dedicated Statement Invoice",children:[e.jsx(xe,{className:"size-3.5"}),e.jsx("span",{children:"Print"})]}),t.status!=="paid"?e.jsxs("button",{type:"button",onClick:()=>y(t),className:"h-8 px-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-600 hover:text-white transition-all font-extrabold text-[11px] inline-flex items-center gap-1 cursor-pointer border border-emerald-200/80 dark:border-emerald-800",title:"Mark payment as Paid",children:[e.jsx(k,{className:"size-3.5"}),e.jsx("span",{children:"Mark Paid"})]}):e.jsxs("span",{className:"h-8 px-3 rounded-xl bg-emerald-100/70 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 font-extrabold text-[11px] inline-flex items-center gap-1 cursor-default border border-emerald-200 dark:border-emerald-800",children:[e.jsx(k,{className:"size-3.5 text-emerald-600"}),e.jsx("span",{children:"Paid"})]}),t.status==="paid"?e.jsx("button",{disabled:!0,className:"size-8 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-600 cursor-not-allowed flex items-center justify-center opacity-60",title:"Paid payment records cannot be deleted",children:e.jsx(me,{className:"size-3.5"})}):e.jsx("button",{type:"button",onClick:()=>N(t),className:"size-8 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 hover:bg-rose-600 hover:text-white transition-all flex items-center justify-center cursor-pointer",title:"Delete Payment Record",children:e.jsx(pe,{className:"size-3.5"})})]})})]},t.id)):e.jsx("tr",{children:e.jsx("td",{colSpan:6,className:"px-6 py-8 text-center text-slate-400 italic",children:'No billing records logged yet. Click "Generate Monthly Bill" to create a billing statement.'})})})]})})})]})]}),E&&e.jsx("div",{className:"fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/60 backdrop-blur-xs overflow-y-auto",children:e.jsxs("div",{className:"w-full max-w-md max-h-[90vh] my-auto overflow-y-auto rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 sm:p-6 shadow-2xl space-y-4",children:[e.jsxs("div",{className:"flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3",children:[e.jsxs("div",{className:"flex items-center gap-2",children:[e.jsx(_,{className:"size-5 text-emerald-600"}),e.jsx("h3",{className:"text-base font-extrabold text-slate-900 dark:text-white",children:"Generate Monthly Bill"})]}),e.jsx("button",{type:"button",onClick:()=>m(!1),className:"p-1 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer",children:e.jsx(te,{className:"size-5"})})]}),e.jsxs("form",{noValidate:!0,onSubmit:V,className:"space-y-4",children:[e.jsxs("p",{className:"text-xs text-slate-500 dark:text-slate-400 leading-relaxed",children:["Select the target billing month for ",e.jsx("strong",{className:"text-slate-800 dark:text-slate-200",children:s.service_name})," to generate the monthly payment record."]}),e.jsxs("div",{children:[e.jsxs("label",{className:"block text-xs font-extrabold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5",children:["Billing Month ",e.jsx("span",{className:"text-rose-500",children:"*"})]}),e.jsx("input",{type:"month",value:M,onChange:t=>A(t.target.value),className:"w-full h-10 px-3.5 rounded-xl bg-slate-50/50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:border-blue-600 font-mono",required:!0})]}),e.jsxs("div",{className:"flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800",children:[e.jsx("button",{type:"button",onClick:()=>m(!1),className:"px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 text-xs font-bold transition-all cursor-pointer",children:"Cancel"}),e.jsx("button",{type:"submit",disabled:T,className:"px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-md shadow-emerald-600/20 flex items-center gap-2 cursor-pointer disabled:opacity-50",children:T?e.jsxs(e.Fragment,{children:[e.jsx($,{className:"size-4 animate-spin"}),e.jsx("span",{children:"Generating..."})]}):e.jsx("span",{children:"Generate Bill"})})]})]})]})}),i&&e.jsx("div",{className:"fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto",children:e.jsxs("div",{className:"bg-white dark:bg-slate-900 rounded-3xl p-4 sm:p-6 max-w-md w-full max-h-[90vh] my-auto overflow-y-auto border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4",children:[e.jsxs("div",{className:"flex items-center gap-3",children:[e.jsx("div",{className:"p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 shrink-0",children:e.jsx(k,{className:"size-6"})}),e.jsxs("div",{children:[e.jsx("h3",{className:"font-extrabold text-slate-900 dark:text-white text-base",children:"Mark Payment as Paid"}),e.jsx("p",{className:"text-xs text-slate-500 font-medium",children:"Confirm payment settlement"})]})]}),e.jsxs("p",{className:"text-xs text-slate-600 dark:text-slate-400 leading-relaxed",children:["Are you sure you want to mark billing payment of ",e.jsx("strong",{className:"text-emerald-600 dark:text-emerald-400 font-mono font-bold",children:l(i.amount_due)})," for ",e.jsx("strong",{className:"text-slate-900 dark:text-white font-mono font-bold",children:i.billing_month})," as ",e.jsx("strong",{children:"Paid / Cleared"}),"?"]}),e.jsxs("div",{className:"flex items-center justify-end gap-3 pt-2",children:[e.jsx("button",{type:"button",onClick:()=>y(null),disabled:v,className:"px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 text-xs font-bold transition-all cursor-pointer",children:"Cancel"}),e.jsx("button",{type:"button",onClick:H,disabled:v,className:"px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-md shadow-emerald-600/20 flex items-center gap-2 cursor-pointer disabled:opacity-50",children:v?e.jsxs(e.Fragment,{children:[e.jsx($,{className:"size-4 animate-spin"}),e.jsx("span",{children:"Updating..."})]}):e.jsx("span",{children:"Confirm & Mark Paid"})})]})]})}),h&&e.jsx("div",{className:"fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto",children:e.jsxs("div",{className:"bg-white dark:bg-slate-900 rounded-3xl p-4 sm:p-6 max-w-md w-full max-h-[90vh] my-auto overflow-y-auto border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4",children:[e.jsxs("div",{className:"flex items-center gap-3",children:[e.jsx("div",{className:"p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 shrink-0",children:e.jsx(be,{className:"size-6"})}),e.jsxs("div",{children:[e.jsx("h3",{className:"font-extrabold text-slate-900 dark:text-white text-base",children:"Delete Payment Record"}),e.jsx("p",{className:"text-xs text-slate-500 font-medium",children:"This action cannot be undone."})]})]}),e.jsxs("p",{className:"text-xs text-slate-600 dark:text-slate-400 leading-relaxed",children:["Are you sure you want to delete payment log for ",e.jsx("strong",{className:"text-slate-900 dark:text-white",children:h.billing_month}),"?"]}),e.jsxs("div",{className:"flex items-center justify-end gap-3 pt-2",children:[e.jsx("button",{type:"button",onClick:()=>N(null),disabled:w,className:"px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 text-xs font-bold transition-all cursor-pointer",children:"Cancel"}),e.jsx("button",{type:"button",onClick:q,disabled:w,className:"px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-all shadow-md shadow-rose-600/20 flex items-center gap-2 cursor-pointer disabled:opacity-50",children:w?e.jsxs(e.Fragment,{children:[e.jsx($,{className:"size-4 animate-spin"}),e.jsx("span",{children:"Deleting..."})]}):e.jsx("span",{children:"Delete Record"})})]})]})})]})}export{Oe as default};
