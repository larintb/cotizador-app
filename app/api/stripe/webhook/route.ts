import { NextRequest, NextResponse } from 'next/server'
import { getStripe } from '@/lib/stripe'
import { createServiceClient } from '@/lib/supabase/server'
import {
  sendSubscriptionConfirmEmail,
  sendBillingReminderEmail,
  sendBillingSuccessEmail,
  sendCancellationScheduledEmail,
  sendCancellationConfirmedEmail,
  sendPaymentFailedEmail,
} from '@/lib/email'

const MONTHLY_PRICE_ID = process.env.STRIPE_PRICE_MONTHLY_ID
const ANNUAL_PRICE_ID  = process.env.STRIPE_PRICE_ANNUAL_ID

type StripeSub     = { current_period_end: number; current_period_start: number }
type StripeInvoice = {
  customer: string | null
  customer_email: string | null
  billing_reason: string | null
  subscription: string | null
}

function getPlanLabel(priceId: string | null | undefined): 'Mensual' | 'Anual' {
  return priceId === ANNUAL_PRICE_ID ? 'Anual' : 'Mensual'
}

function getPlanAmount(priceId: string | null | undefined): string {
  return priceId === ANNUAL_PRICE_ID ? '$2,000 USD/año' : '$200 USD/mes'
}

function fmtDate(ts: number) {
  return new Date(ts * 1000).toLocaleDateString('es-MX', {
    day: 'numeric', month: 'long', year: 'numeric',
  })
}

export async function POST(request: NextRequest) {
  const body      = await request.text()
  const signature = request.headers.get('stripe-signature')

  if (!signature) {
    return new NextResponse('Missing stripe-signature header', { status: 400 })
  }

  const stripe = getStripe()
  let event

  try {
    event = stripe.webhooks.constructEvent(body, signature, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    console.error(`Webhook signature verification failed: ${message}`)
    return new NextResponse(`Webhook Error: ${message}`, { status: 400 })
  }

  const supabase = await createServiceClient()

  try {
    switch (event.type) {

      // ── New subscription purchased ────────────────────────────────────────
      case 'checkout.session.completed': {
        const session        = event.data.object
        const customerId     = session.customer as string
        const subscriptionId = session.subscription as string

        if (!customerId || !subscriptionId) break

        const subscription = await stripe.subscriptions.retrieve(subscriptionId)
        const priceId      = subscription.items.data[0]?.price.id ?? null
        const plan         = getPlanLabel(priceId)

        // Activate subscription + promote to admin role
        await supabase
          .from('profiles')
          .update({
            stripe_subscription_id: subscriptionId,
            subscription_status: 'active',
            subscription_plan: plan.toLowerCase(),
            role: 'admin',
          })
          .eq('stripe_customer_id', customerId)

        // Send confirmation email
        const { data: profile } = await supabase
          .from('profiles')
          .select('nombre, apellido')
          .eq('stripe_customer_id', customerId)
          .single()

        const email = session.customer_email ?? session.customer_details?.email
        if (profile && email) {
          sendSubscriptionConfirmEmail({
            to: email,
            nombre: profile.nombre,
            plan,
            monto: getPlanAmount(priceId),
            nextBilling: fmtDate((subscription as unknown as StripeSub).current_period_end),
          })
        }
        break
      }

      // ── Recurring payment success ─────────────────────────────────────────
      case 'invoice.payment_succeeded': {
        const invoice    = event.data.object as unknown as StripeInvoice
        const customerId = invoice.customer as string
        // billing_reason 'subscription_create' is already handled by checkout.session.completed
        if (!customerId || invoice.billing_reason === 'subscription_create') break

        await supabase
          .from('profiles')
          .update({ subscription_status: 'active', role: 'admin' })
          .eq('stripe_customer_id', customerId)

        // Send renewal email
        const { data: profile } = await supabase
          .from('profiles')
          .select('nombre, subscription_plan')
          .eq('stripe_customer_id', customerId)
          .single()

        const email = invoice.customer_email
        if (profile && email && invoice.subscription) {
          const sub     = await stripe.subscriptions.retrieve(invoice.subscription as string)
          const priceId = sub.items.data[0]?.price.id ?? null
          const plan    = getPlanLabel(priceId)
          const periodo = plan === 'Anual' ? 'anual' : 'mensual'

          sendBillingSuccessEmail({
            to: email,
            nombre: profile.nombre,
            plan,
            monto: getPlanAmount(priceId),
            nextBilling: fmtDate((sub as unknown as StripeSub).current_period_end),
            periodo,
          })
        }
        break
      }

      // ── Payment failed ────────────────────────────────────────────────────
      case 'invoice.payment_failed': {
        const invoice    = event.data.object as unknown as StripeInvoice
        const customerId = invoice.customer as string
        if (!customerId) break

        await supabase
          .from('profiles')
          .update({ subscription_status: 'past_due' })
          .eq('stripe_customer_id', customerId)

        const { data: profile } = await supabase
          .from('profiles')
          .select('nombre, subscription_plan')
          .eq('stripe_customer_id', customerId)
          .single()

        const email = invoice.customer_email
        if (profile && email) {
          const priceId = invoice.subscription
            ? (await stripe.subscriptions.retrieve(invoice.subscription as string)).items.data[0]?.price.id ?? null
            : null
          sendPaymentFailedEmail({
            to: email,
            nombre: profile.nombre,
            plan: getPlanLabel(priceId),
            monto: getPlanAmount(priceId),
          })
        }
        break
      }

      // ── Upcoming invoice — 7 days before billing ──────────────────────────
      case 'invoice.upcoming': {
        const invoice    = event.data.object as unknown as StripeInvoice
        const customerId = invoice.customer as string
        if (!customerId) break

        const { data: profile } = await supabase
          .from('profiles')
          .select('nombre, subscription_plan')
          .eq('stripe_customer_id', customerId)
          .single()

        const email = invoice.customer_email
        if (profile && email && invoice.subscription) {
          const sub     = await stripe.subscriptions.retrieve(invoice.subscription as string)
          const priceId = sub.items.data[0]?.price.id ?? null
          const plan    = getPlanLabel(priceId)

          sendBillingReminderEmail({
            to: email,
            nombre: profile.nombre,
            plan,
            monto: getPlanAmount(priceId),
            billingDate: fmtDate((sub as unknown as StripeSub).current_period_end),
          })
        }
        break
      }

      // ── Subscription cancelled ────────────────────────────────────────────
      case 'customer.subscription.deleted': {
        const subscription = event.data.object
        const customerId   = subscription.customer as string
        if (!customerId) break

        const { data: profile } = await supabase
          .from('profiles')
          .select('nombre, subscription_plan')
          .eq('stripe_customer_id', customerId)
          .single()

        await supabase
          .from('profiles')
          .update({
            subscription_status: 'inactive',
            subscription_plan: null,
            stripe_subscription_id: null,
            role: 'cliente',
          })
          .eq('stripe_customer_id', customerId)

        const stripe2 = getStripe()
        const customer = await stripe2.customers.retrieve(customerId)
        const email = !customer.deleted ? customer.email : null
        if (profile && email) {
          const priceId = subscription.items.data[0]?.price.id ?? null
          sendCancellationConfirmedEmail({
            to: email,
            nombre: profile.nombre,
            plan: getPlanLabel(priceId),
          })
        }
        break
      }

      // ── Subscription updated (plan change / cancellation scheduled) ─────────
      case 'customer.subscription.updated': {
        const subscription = event.data.object
        const customerId   = subscription.customer as string
        if (!customerId) break

        const priceId  = subscription.items.data[0]?.price.id ?? null
        const plan     = getPlanLabel(priceId)
        const isActive = subscription.status === 'active'

        await supabase
          .from('profiles')
          .update({
            subscription_status: isActive ? 'active' : 'inactive',
            subscription_plan: isActive ? plan.toLowerCase() : null,
            role: isActive ? 'admin' : 'cliente',
          })
          .eq('stripe_customer_id', customerId)

        // Send email when user schedules cancellation (cancel_at_period_end just turned true)
        const prev = event.data.previous_attributes as Record<string, unknown> | undefined
        const justScheduledCancel =
          subscription.cancel_at_period_end === true &&
          prev?.cancel_at_period_end === false

        if (justScheduledCancel && subscription.cancel_at) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('nombre')
            .eq('stripe_customer_id', customerId)
            .single()

          const stripe2  = getStripe()
          const customer = await stripe2.customers.retrieve(customerId)
          const email    = !customer.deleted ? customer.email : null

          if (profile && email) {
            sendCancellationScheduledEmail({
              to: email,
              nombre: profile.nombre,
              plan,
              accessUntil: fmtDate(subscription.cancel_at),
            })
          }
        }
        break
      }

      default:
        break
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    console.error(`Error processing webhook event ${event.type}: ${message}`)
    return new NextResponse('Internal server error', { status: 500 })
  }

  return NextResponse.json({ received: true })
}
