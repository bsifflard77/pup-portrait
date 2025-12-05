// Supabase Edge Function: Stripe Webhook Handler
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';
import Stripe from 'https://esm.sh/stripe@14.10.0?target=deno';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, stripe-signature',
};

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const stripeKey = Deno.env.get('STRIPE_SECRET_KEY')!;
    const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET')!;
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    const stripe = new Stripe(stripeKey, {
      apiVersion: '2023-10-16',
      httpClient: Stripe.createFetchHttpClient(),
    });

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verify webhook signature
    const signature = req.headers.get('stripe-signature');
    if (!signature) {
      return new Response('Missing signature', { status: 400 });
    }

    const body = await req.text();
    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err) {
      console.error('Webhook signature verification failed:', err);
      return new Response('Invalid signature', { status: 400 });
    }

    console.log('Received event:', event.type);

    // Handle the event
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.metadata?.user_id;
        const planType = session.metadata?.plan_type;

        if (!userId) {
          console.error('No user_id in session metadata');
          break;
        }

        if (session.mode === 'payment') {
          // One-time payment (Lifetime plan)
          await supabase
            .from('profiles')
            .update({
              subscription_tier: 'lifetime',
              subscription_status: 'active',
              lifetime_credits: 100, // Lifetime gets 100 credits
            })
            .eq('id', userId);

          // Record the subscription
          await supabase
            .from('subscriptions')
            .insert({
              user_id: userId,
              plan_type: 'lifetime',
              amount: session.amount_total || 1999,
              status: 'active',
            });

        } else if (session.mode === 'subscription') {
          // Subscription created
          const subscriptionId = session.subscription as string;
          const subscription = await stripe.subscriptions.retrieve(subscriptionId);

          await supabase
            .from('profiles')
            .update({
              subscription_tier: 'premium',
              subscription_status: 'active',
            })
            .eq('id', userId);

          await supabase
            .from('subscriptions')
            .insert({
              user_id: userId,
              stripe_subscription_id: subscriptionId,
              stripe_price_id: subscription.items.data[0]?.price.id,
              plan_type: planType || 'monthly',
              amount: subscription.items.data[0]?.price.unit_amount || 799,
              status: 'active',
              current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
              current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
            });
        }

        console.log(`Checkout completed for user ${userId}, plan: ${planType}`);
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        const userId = subscription.metadata?.user_id;

        if (!userId) {
          // Try to find user by stripe subscription ID
          const { data: existingSub } = await supabase
            .from('subscriptions')
            .select('user_id')
            .eq('stripe_subscription_id', subscription.id)
            .single();

          if (!existingSub) {
            console.error('Could not find user for subscription:', subscription.id);
            break;
          }
        }

        const status = subscription.status === 'active' ? 'active' :
                       subscription.status === 'past_due' ? 'past_due' :
                       subscription.status === 'canceled' ? 'canceled' : 'expired';

        // Update subscription record
        await supabase
          .from('subscriptions')
          .update({
            status,
            current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
            current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
            cancel_at_period_end: subscription.cancel_at_period_end,
          })
          .eq('stripe_subscription_id', subscription.id);

        // Update profile
        await supabase
          .from('profiles')
          .update({
            subscription_status: status,
            subscription_tier: status === 'active' ? 'premium' : 'free',
          })
          .eq('stripe_customer_id', subscription.customer as string);

        console.log(`Subscription ${subscription.id} updated to ${status}`);
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;

        // Mark subscription as expired
        await supabase
          .from('subscriptions')
          .update({ status: 'expired' })
          .eq('stripe_subscription_id', subscription.id);

        // Downgrade user to free tier
        await supabase
          .from('profiles')
          .update({
            subscription_tier: 'free',
            subscription_status: 'expired',
          })
          .eq('stripe_customer_id', subscription.customer as string);

        console.log(`Subscription ${subscription.id} deleted/expired`);
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        const subscriptionId = invoice.subscription as string;

        if (subscriptionId) {
          await supabase
            .from('subscriptions')
            .update({ status: 'past_due' })
            .eq('stripe_subscription_id', subscriptionId);

          await supabase
            .from('profiles')
            .update({ subscription_status: 'past_due' })
            .eq('stripe_customer_id', invoice.customer as string);
        }

        console.log(`Payment failed for invoice ${invoice.id}`);
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return new Response(
      JSON.stringify({ received: true }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Webhook error:', error);
    return new Response(
      JSON.stringify({ error: 'Webhook handler failed' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
