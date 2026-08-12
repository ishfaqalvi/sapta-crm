import{r as S,j as e,L as C,$ as P}from"./app-B44lyIJU.js";import{A}from"./app-layout-n5I34w84.js";import{F as k,U as M}from"./app-toaster-B3WtKB4x.js";import{R as v}from"./receipt-BScHAj44.js";import{A as T}from"./arrow-left-w_r7kCY0.js";import{C as g}from"./circle-check-P7A9B9jr.js";import{C as B}from"./circle-pause-CRLR9hCG.js";import{C as I}from"./circle-stop-CXD1sre3.js";import{B as L}from"./building-CnaY7J3h.js";import{D as F}from"./dollar-sign-tq2LwjxO.js";import{P as J,R}from"./refresh-cw-Dw91sS26.js";import{C as U}from"./calendar-C6bqtKmI.js";import{P as O}from"./printer-BjIHyogF.js";import"./button-FkCh6mYg.js";import"./layout-grid-CbG45EjS.js";import"./folder-kanban-BQ4LsfG1.js";import"./layers-BBnnsQEJ.js";import"./building-2-XGhMIaiL.js";import"./coins-DHOcMDbF.js";import"./index-hXXqdqPu.js";import"./index-D00CtJ2r.js";import"./input-BPbx18WE.js";function me({service:a,company:N}){var j;const d=N||{name:"Sapta Technologies",email:"contact@saptatechnologies.com",phone:"+92 300 1234567",address:"Office #402, Software Technology Park, Lahore, Pakistan",tax_id:"NTN-892415-0",logo:"/app-logo-icon.png"},w=[{title:"Dashboard",href:"/dashboard"},{title:"Services",href:"/services"},{title:a.service_name,href:`/services/${a.id}`}],r=a.client||{id:a.client_id,name:"Client",client_code:"CL-000",company_name:"",currency:a.currency||"$"},y=()=>{if(typeof window<"u"){const s=new URLSearchParams(window.location.search).get("tab");if(s==="payments"||s==="details")return s}return"details"},[n,$]=S.useState(y),f=t=>{if($(t),typeof window<"u"){const s=new URL(window.location.href);s.searchParams.set("tab",t),window.history.replaceState({},"",s.toString())}},p=t=>{if(!t)return"N/A";const s=t.includes("T")?t.split("T")[0]:t.split(" ")[0],o=s.split("-");if(o.length===3){const i=parseInt(o[0],10),x=parseInt(o[1],10)-1,m=parseInt(o[2],10);if(!isNaN(i)&&!isNaN(x)&&!isNaN(m)&&x>=0&&x<12){const D=["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];return`${m<10?`0${m}`:`${m}`} ${D[x]} ${i}`}}return s},l=(t,s=a.currency||"$")=>{const o=typeof t=="number"?t:parseFloat(t||"0");return`${s} ${o.toLocaleString("en-US",{minimumFractionDigits:2,maximumFractionDigits:2})}`},b=a.contract_months||12,h=Number(a.monthly_fee)*b,c=a.payments||[],u=c.filter(t=>t.status==="paid").reduce((t,s)=>t+Number(s.amount_paid||0),0),_=h>0?Math.min(100,Math.round(u/h*100)):0,z=t=>{var i;const s=window.open("","_blank");if(!s)return;const o=`
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
                            <div class="meta-title">${r.company_name||r.name}</div>
                            <div class="meta-text"><strong>Attn:</strong> ${r.name}</div>
                            <div class="meta-text"><strong>Client Code:</strong> ${r.client_code}</div>
                        </div>

                        <div style="text-align: right;">
                            <div class="meta-label">Invoice & Service Details:</div>
                            <div class="meta-text"><strong>Service:</strong> ${a.service_name}</div>
                            <div class="meta-text"><strong>Category:</strong> ${((i=a.category)==null?void 0:i.name)||"General"}</div>
                            <div class="meta-text"><strong>Billing Month:</strong> ${t.billing_month}</div>
                            <div class="meta-text"><strong>Date:</strong> ${t.payment_date?p(t.payment_date):new Date().toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric"})}</div>
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
                                        <div style="font-weight: 800; color: #0f172a;">${a.service_name} (${t.billing_month})</div>
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
        `;s.document.write(o),s.document.close()};return e.jsxs(A,{breadcrumbs:w,children:[e.jsx(C,{title:`Service Details: ${a.service_name}`}),e.jsxs("div",{className:"p-4 sm:p-6 w-full space-y-6 bg-slate-50/50 dark:bg-slate-950",children:[e.jsxs("div",{className:"flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs",children:[e.jsxs("div",{className:"flex flex-wrap items-center gap-1.5",children:[e.jsxs("button",{type:"button",onClick:()=>f("details"),className:`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${n==="details"?"bg-gradient-to-r from-[#003796] via-[#0052D4] to-[#1d4ed8] text-white shadow-md shadow-blue-600/20":"text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"}`,children:[e.jsx(k,{className:"size-4"}),e.jsx("span",{children:"1. Details"})]}),e.jsxs("button",{type:"button",onClick:()=>f("payments"),className:`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${n==="payments"?"bg-gradient-to-r from-[#003796] via-[#0052D4] to-[#1d4ed8] text-white shadow-md shadow-blue-600/20":"text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"}`,children:[e.jsx(v,{className:"size-4"}),e.jsxs("span",{children:["2. Payments (",c.length,")"]})]})]}),e.jsxs(P,{href:"/services",className:"px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shrink-0",children:[e.jsx(T,{className:"size-4"}),e.jsx("span",{children:"Back to Services"})]})]}),n==="details"&&e.jsxs("div",{className:"space-y-6",children:[e.jsx("div",{className:"p-6 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6",children:e.jsxs("div",{className:"space-y-2",children:[e.jsxs("div",{className:"flex flex-wrap items-center gap-2",children:[e.jsx("h1",{className:"text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight",children:a.service_name}),a.category&&e.jsx("span",{className:"px-2.5 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800",children:a.category.name}),e.jsx("span",{className:`px-3 py-1 rounded-full text-xs font-extrabold capitalize inline-flex items-center gap-1 ${a.status==="active"?"bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800":a.status==="paused"?"bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800":"bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800"}`,children:a.status==="active"?e.jsxs(e.Fragment,{children:[e.jsx(g,{className:"size-3.5"}),e.jsx("span",{children:"Active"})]}):a.status==="paused"?e.jsxs(e.Fragment,{children:[e.jsx(B,{className:"size-3.5"}),e.jsx("span",{children:"Paused"})]}):e.jsxs(e.Fragment,{children:[e.jsx(I,{className:"size-3.5"}),e.jsx("span",{children:"Stopped"})]})})]}),e.jsxs("p",{className:"text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2",children:[e.jsx(L,{className:"size-3.5 text-blue-600 dark:text-blue-400"}),e.jsx("span",{className:"font-bold text-slate-700 dark:text-slate-300",children:r.name}),e.jsxs("span",{className:"font-mono text-blue-600 text-[11px] font-bold",children:["(",r.client_code,")"]}),r.company_name&&e.jsxs("span",{children:["• ",r.company_name]})]})]})}),e.jsxs("div",{className:"grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4",children:[e.jsxs("div",{className:"p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-2",children:[e.jsxs("div",{className:"flex items-center justify-between",children:[e.jsx("span",{className:"text-xs font-bold uppercase tracking-wider text-slate-400",children:"Monthly Fee"}),e.jsx("div",{className:"p-2 rounded-xl bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400",children:e.jsx(F,{className:"size-4"})})]}),e.jsxs("p",{className:"text-xl font-extrabold text-slate-900 dark:text-white",children:[l(a.monthly_fee)," ",e.jsx("span",{className:"text-xs text-slate-400 font-semibold",children:"/ mo"})]}),e.jsxs("p",{className:"text-xs text-slate-400 font-medium pt-2 border-t border-slate-100 dark:border-slate-800",children:["Billing Currency: ",e.jsx("strong",{className:"text-slate-700 dark:text-slate-300 font-mono",children:a.currency||r.currency})]})]}),e.jsxs("div",{className:"p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-2",children:[e.jsxs("div",{className:"flex items-center justify-between",children:[e.jsx("span",{className:"text-xs font-bold uppercase tracking-wider text-slate-400",children:"Contract Value"}),e.jsx("div",{className:"p-2 rounded-xl bg-purple-50 dark:bg-purple-950 text-purple-600 dark:text-purple-400",children:e.jsx(J,{className:"size-4"})})]}),e.jsx("p",{className:"text-xl font-extrabold text-slate-900 dark:text-white",children:l(h)}),e.jsxs("p",{className:"text-xs text-slate-400 font-medium pt-2 border-t border-slate-100 dark:border-slate-800",children:["Duration: ",e.jsxs("strong",{className:"text-slate-700 dark:text-slate-300",children:[b," Months"]})]})]}),e.jsxs("div",{className:"p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-2",children:[e.jsxs("div",{className:"flex items-center justify-between",children:[e.jsx("span",{className:"text-xs font-bold uppercase tracking-wider text-slate-400",children:"Billing Cycle"}),e.jsx("div",{className:"p-2 rounded-xl bg-amber-50 dark:bg-amber-950 text-amber-600 dark:text-amber-400",children:e.jsx(U,{className:"size-4"})})]}),e.jsxs("p",{className:"text-base font-extrabold text-slate-900 dark:text-white",children:["Day ",a.billing_day," of month"]}),e.jsxs("p",{className:"text-xs text-slate-400 font-medium pt-2 border-t border-slate-100 dark:border-slate-800",children:["Started: ",p(a.start_date)]})]}),e.jsxs("div",{className:"p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-2",children:[e.jsxs("div",{className:"flex items-center justify-between",children:[e.jsx("span",{className:"text-xs font-bold uppercase tracking-wider text-slate-400",children:"Total Paid"}),e.jsx("div",{className:"p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400",children:e.jsx(R,{className:"size-4"})})]}),e.jsx("p",{className:"text-xl font-extrabold text-emerald-600 dark:text-emerald-400",children:l(u)}),e.jsx("div",{className:"w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden",children:e.jsx("div",{className:"bg-emerald-500 h-1.5 rounded-full transition-all duration-500",style:{width:`${_}%`}})})]})]}),e.jsxs("div",{className:"grid grid-cols-1 lg:grid-cols-3 gap-6",children:[e.jsxs("div",{className:"lg:col-span-2 p-6 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-4",children:[e.jsxs("h3",{className:"text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2",children:[e.jsx(k,{className:"size-4 text-blue-600"}),e.jsx("span",{children:"Service Scope & Deliverables"})]}),e.jsxs("div",{className:"grid grid-cols-1 md:grid-cols-3 gap-4 mb-2",children:[e.jsxs("div",{className:"p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800 space-y-1",children:[e.jsx("span",{className:"text-[10px] font-extrabold uppercase tracking-wider text-slate-400",children:"Category"}),e.jsx("p",{className:"text-sm font-extrabold text-slate-900 dark:text-white",children:((j=a.category)==null?void 0:j.name)||"General Service"})]}),e.jsxs("div",{className:"p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800 space-y-1",children:[e.jsx("span",{className:"text-[10px] font-extrabold uppercase tracking-wider text-slate-400",children:"Monthly Due Day"}),e.jsxs("p",{className:"text-sm font-extrabold text-slate-900 dark:text-white",children:["Day ",a.billing_day," of month"]})]}),e.jsxs("div",{className:"p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800 space-y-1",children:[e.jsx("span",{className:"text-[10px] font-extrabold uppercase tracking-wider text-slate-400",children:"Contract Duration"}),e.jsxs("p",{className:"text-sm font-extrabold text-slate-900 dark:text-white",children:[b," Months"]})]})]}),e.jsx("div",{className:"p-5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800 text-xs font-medium text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed",children:a.notes||"No custom scope notes logged for this service subscription."})]}),e.jsxs("div",{className:"p-6 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-4",children:[e.jsxs("h3",{className:"text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2",children:[e.jsx(M,{className:"size-4 text-blue-600"}),e.jsx("span",{children:"Client Profile"})]}),e.jsxs("div",{className:"space-y-4 text-xs",children:[e.jsxs("div",{className:"flex items-center gap-3 p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800",children:[e.jsx("div",{className:"size-10 rounded-xl bg-gradient-to-br from-[#003796] to-[#1d4ed8] text-white font-black text-sm flex items-center justify-center shrink-0",children:r.name.charAt(0).toUpperCase()}),e.jsxs("div",{children:[e.jsx("h4",{className:"font-extrabold text-slate-900 dark:text-white text-sm",children:r.name}),e.jsx("span",{className:"font-mono text-blue-600 dark:text-blue-400 text-[11px] font-bold",children:r.client_code})]})]}),e.jsxs("div",{className:"space-y-2 text-slate-600 dark:text-slate-300 font-medium",children:[e.jsxs("div",{className:"flex items-center justify-between py-1 border-b border-slate-100 dark:border-slate-800",children:[e.jsx("span",{className:"text-slate-400",children:"Company Name"}),e.jsx("span",{className:"font-bold text-slate-800 dark:text-slate-200",children:r.company_name||"N/A"})]}),e.jsxs("div",{className:"flex items-center justify-between py-1 border-b border-slate-100 dark:border-slate-800",children:[e.jsx("span",{className:"text-slate-400",children:"Account Currency"}),e.jsx("span",{className:"font-mono font-bold text-slate-800 dark:text-slate-200",children:r.currency||"USD"})]}),e.jsxs("div",{className:"flex items-center justify-between py-1 border-b border-slate-100 dark:border-slate-800",children:[e.jsx("span",{className:"text-slate-400",children:"Subscription Status"}),e.jsx("span",{className:"font-bold capitalize text-slate-800 dark:text-slate-200",children:a.status})]})]})]})]})]})]}),n==="payments"&&e.jsxs("div",{className:"space-y-4",children:[e.jsx("div",{className:"flex items-center justify-between",children:e.jsxs("h3",{className:"text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2",children:[e.jsx(v,{className:"size-4 text-emerald-600"}),e.jsx("span",{children:"Monthly Billing & Payment History"})]})}),e.jsx("div",{className:"rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 overflow-hidden shadow-2xs",children:e.jsx("div",{className:"overflow-x-auto",children:e.jsxs("table",{className:"w-full text-left text-xs",children:[e.jsx("thead",{className:"bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 font-extrabold uppercase text-[10px] tracking-wider border-b border-slate-200 dark:border-slate-800",children:e.jsxs("tr",{children:[e.jsx("th",{className:"px-6 py-4",children:"Billing Month"}),e.jsx("th",{className:"px-6 py-4",children:"Amount Due"}),e.jsx("th",{className:"px-6 py-4",children:"Amount Paid"}),e.jsx("th",{className:"px-6 py-4",children:"Status"}),e.jsx("th",{className:"px-6 py-4",children:"Payment Date"}),e.jsx("th",{className:"px-6 py-4 text-right",children:"Actions"})]})}),e.jsx("tbody",{className:"divide-y divide-slate-100 dark:divide-slate-800 font-medium text-slate-700 dark:text-slate-300",children:c.length>0?c.map(t=>e.jsxs("tr",{className:"hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors",children:[e.jsx("td",{className:"px-6 py-4 font-bold text-slate-900 dark:text-white font-mono",children:t.billing_month}),e.jsx("td",{className:"px-6 py-4 font-bold text-slate-900 dark:text-white font-mono",children:l(t.amount_due)}),e.jsx("td",{className:"px-6 py-4 font-bold text-emerald-600 dark:text-emerald-400 font-mono",children:l(t.amount_paid)}),e.jsx("td",{className:"px-6 py-4",children:e.jsx("span",{className:`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${t.status==="paid"?"bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800":t.status==="overdue"?"bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200 dark:border-rose-800":"bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-800"}`,children:t.status==="paid"?"Paid / Cleared":t.status==="overdue"?"Overdue":"Due Pending"})}),e.jsx("td",{className:"px-6 py-4 text-slate-500 font-medium",children:p(t.payment_date)}),e.jsx("td",{className:"px-6 py-4 text-right",children:e.jsxs("div",{className:"flex items-center justify-end gap-1.5",children:[e.jsxs("button",{type:"button",onClick:()=>z(t),className:"h-8 px-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-blue-600 hover:text-white transition-all font-bold text-[11px] inline-flex items-center gap-1.5 cursor-pointer",title:"View / Print Dedicated Statement Invoice",children:[e.jsx(O,{className:"size-3.5"}),e.jsx("span",{children:"Print"})]}),t.status!=="paid"?e.jsxs("span",{className:"h-8 px-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 font-extrabold text-[11px] inline-flex items-center gap-1 cursor-default border border-amber-200 dark:border-amber-800",children:[e.jsx(g,{className:"size-3.5"}),e.jsx("span",{children:"Not Paid"})]}):e.jsxs("span",{className:"h-8 px-3 rounded-xl bg-emerald-100/70 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 font-extrabold text-[11px] inline-flex items-center gap-1 cursor-default border border-emerald-200 dark:border-emerald-800",children:[e.jsx(g,{className:"size-3.5 text-emerald-600"}),e.jsx("span",{children:"Paid"})]})]})})]},t.id)):e.jsx("tr",{children:e.jsx("td",{colSpan:6,className:"px-6 py-8 text-center text-slate-400 italic",children:"No billing records logged yet."})})})]})})})]})]})]})}export{me as default};
