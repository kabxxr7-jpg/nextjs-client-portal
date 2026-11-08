import { InvoiceBadge } from "@/components/bits";
import { SubmitButton } from "@/components/SubmitButton";
import { markPaid } from "@/app/portal/actions";
import { requireViewer } from "@/lib/auth";
import { listInvoices } from "@/lib/data";
import { money, shortDate, sumOpen } from "@/lib/format";

export const metadata = { title: "Invoices" };

export default async function Invoices() {
  const { supabase, isAdmin } = await requireViewer();
  const invoices = await listInvoices(supabase);
  return (
    <>
      <div className="page-head">
        <h1>Invoices</h1>
        <span className="muted">Due now: <strong>{money(sumOpen(invoices))}</strong></span>
      </div>
      <div className="card table-wrap">
        <table className="stack">
          <thead>
            <tr>
              <th>Invoice</th>{isAdmin && <th>Client</th>}<th>Project</th><th>Due</th><th className="num">Amount</th><th>Status</th>
              {isAdmin && <th><span className="sr-only">Action</span></th>}
            </tr>
          </thead>
          <tbody>
            {invoices.map((i) => (
              <tr key={i.id}>
                <td data-label="Invoice"><strong>{i.number}</strong></td>
                {isAdmin && <td data-label="Client">{i.clients?.name}</td>}
                <td data-label="Project">{i.projects?.name ?? "–"}</td>
                <td data-label="Due">{shortDate(i.due_date)}</td>
                <td data-label="Amount" className="num">{money(i.amount_cents)}</td>
                <td data-label="Status">
                  <InvoiceBadge inv={i} />
                  {i.paid_at && <div className="small muted">{shortDate(i.paid_at)}</div>}
                </td>
                {isAdmin && (
                  <td data-label="">
                    {i.status === "open" && (
                      <form action={markPaid}>
                        <input type="hidden" name="invoice_id" value={i.id} />
                        <SubmitButton className="btn small" pending="Saving…">Mark paid</SubmitButton>
                      </form>
                    )}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="small muted" style={{ marginTop: 12 }}>
        Payments are recorded by the agency here; no card is charged in this demo.
      </p>
    </>
  );
}
