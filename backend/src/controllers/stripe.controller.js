const { getStripe } = require("../config/stripe");
const { supabase } = require("../config/supabase");
const { notifySafely } = require("../services/notification.service");

async function updateConnectedAccount(account) {
  const status = account.details_submitted && account.charges_enabled && account.payouts_enabled ? "active" : "restricted";
  const { data: payout } = await supabase.from("payouts").update({
    connected: status === "active", provider: "stripe", account: account.id,
    stripe_account_id: account.id, stripe_details_submitted: Boolean(account.details_submitted),
    stripe_charges_enabled: Boolean(account.charges_enabled), stripe_payouts_enabled: Boolean(account.payouts_enabled),
    stripe_account_status: status,
  }).eq("stripe_account_id", account.id).select().maybeSingle();
  return payout;
}

async function webhook(req, res) {
  let event;
  try {
    const secret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!secret) throw new Error("STRIPE_WEBHOOK_SECRET is not configured");
    event = getStripe().webhooks.constructEvent(req.body, req.headers["stripe-signature"], secret);
  } catch (error) { return res.status(400).send(`Webhook Error: ${error.message}`); }

  try {
    const claimed=await supabase.from("stripe_webhook_events").insert({id:event.id,type:event.type,stripe_account_id:event.account||null,livemode:event.livemode,processed_at:new Date().toISOString()});
    if(claimed.error?.code==="23505")return res.json({received:true,duplicate:true});
    if(claimed.error)throw claimed.error;

    const object = event.data.object;
    if (event.type === "account.updated") await updateConnectedAccount(object);
    if ((event.type === "checkout.session.completed" && object.payment_status === "paid") || event.type === "checkout.session.async_payment_succeeded") {
      const { data: order } = await supabase.from("marketplace_orders").update({ status:"paid", stripe_payment_intent_id:object.payment_intent, paid_at:new Date().toISOString() }).eq("stripe_checkout_session_id",object.id).neq("status","paid").select().maybeSingle();
      if (order) {
        for (const item of order.items || []) await supabase.rpc("increment_product_sold_count", { product_id:item.id, increment_by:item.quantity || 1 });
        notifySafely(order.buyer_id,"order","Payment successful","Your marketplace order has been paid.",{entityId:order.id});
      }
    }
    if (event.type === "checkout.session.async_payment_failed" || event.type === "checkout.session.expired") {
      await supabase.from("marketplace_orders").update({ status:event.type.endsWith("expired")?"expired":"payment-failed" }).eq("stripe_checkout_session_id",object.id);
    }
    if (event.type === "charge.refunded") await supabase.from("marketplace_orders").update({ status:object.refunded?"refunded":"partially-refunded" }).eq("stripe_payment_intent_id",object.payment_intent);
    if (event.type.startsWith("charge.dispute.")) {
      const {data:order}=await supabase.from("marketplace_orders").select("id").eq("stripe_payment_intent_id",object.payment_intent).maybeSingle();
      await supabase.from("stripe_disputes").upsert({ id:object.id, order_id:order?.id||null, charge_id:object.charge, payment_intent_id:object.payment_intent, amount:object.amount, currency:object.currency, reason:object.reason, status:object.status, evidence_due_by:object.evidence_details?.due_by ? new Date(object.evidence_details.due_by*1000).toISOString():null, raw:object },{onConflict:"id"});
      await supabase.from("marketplace_orders").update({ status:`dispute-${object.status}` }).eq("stripe_payment_intent_id",object.payment_intent);
    }
    if (event.type === "refund.updated" || event.type === "refund.failed") {
      await supabase.from("stripe_refunds").update({status:object.status,reason:object.reason||object.failure_reason||null,raw:object}).eq("id",object.id);
    }
    if (event.type === "payout.paid" || event.type === "payout.failed") {
      const accountId = event.account;
      const { data:payout }=await supabase.from("payouts").select("*").eq("stripe_account_id",accountId).maybeSingle();
      if(payout){const history=(payout.history||[]).map(x=>x.stripePayoutId===object.id?{...x,status:object.status,failureCode:object.failure_code||null}:x);await supabase.from("payouts").update({history}).eq("id",payout.id);}
    }
    res.json({ received:true });
  } catch (error) { if(event?.id)await supabase.from("stripe_webhook_events").delete().eq("id",event.id);res.status(500).json({ success:false, message:"Webhook processing failed" }); }
}

module.exports = { webhook, updateConnectedAccount };
