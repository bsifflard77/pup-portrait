// Supabase Edge Function: Create Stripe Checkout Session
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';
import Stripe from 'https://esm.sh/stripe@14.10.0?target=deno';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// 2026-05-19 relaunch: extend the planType union to include the new tiers.
// 'pack' = $9.99 one-time, 12-portrait pack from photo upload.
// 'realism_yearly' = $49.99/yr Premium Annual + Realism (Flux Kontext Pro toggle).
interface CheckoutRequest {
  planType: 'monthly' | 'yearly' | 'lifetime' | 'pack' | 'realism_yearly';
  successUrl?: string;
  cancelUrl?: string;
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const stripeKey = Deno.env.get('STRIPE_SECRET_KEY')!;
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    const stripe = new Stripe(stripeKey, {
      apiVersion: '2023-10-16',
      httpClient: Stripe.createFetchHttpClient(),
    });

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verify user is authenticated
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Authentication required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid authentication' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get request body
    const { planType, successUrl, cancelUrl }: CheckoutRequest = await req.json();

    // Get or create Stripe customer
    const { data: profile } = await supabase
      .from('profiles')
      .select('stripe_customer_id, email')
      .eq('id', user.id)
      .single();

    let stripeCustomerId = profile?.stripe_customer_id;

    if (!stripeCustomerId) {
      // Create new Stripe customer
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: {
          supabase_user_id: user.id,
        },
      });

      stripeCustomerId = customer.id;

      // Save customer ID to profile
      await supabase
        .from('profiles')
        .update({ stripe_customer_id: stripeCustomerId })
        .eq('id', user.id);
    }

    // Price IDs (configure these in Stripe Dashboard)
    // 2026-05-19: added pack + realism_yearly. Bill creates these in Stripe
    // per the Pricing Config spec, then sets the env vars on this function.
    const priceIds: Record<string, string> = {
      monthly: Deno.env.get('STRIPE_PRICE_MONTHLY') || Deno.env.get('STRIPE_PRICE_PREMIUM_MONTHLY') || 'price_monthly_placeholder',
      yearly: Deno.env.get('STRIPE_PRICE_YEARLY') || Deno.env.get('STRIPE_PRICE_PREMIUM_YEARLY') || 'price_yearly_placeholder',
      lifetime: Deno.env.get('STRIPE_PRICE_LIFETIME') || 'price_lifetime_placeholder',
      pack: Deno.env.get('STRIPE_PRICE_PACK') || 'price_pack_placeholder',
      realism_yearly: Deno.env.get('STRIPE_PRICE_REALISM_YEARLY') || 'price_realism_yearly_placeholder',
    };

    const priceId = priceIds[planType];
    if (!priceId) {
      return new Response(
        JSON.stringify({ error: 'Invalid plan type' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Determine checkout mode — 'lifetime' and 'pack' are one-time payments;
    // monthly / yearly / realism_yearly are recurring subscriptions.
    const mode = (planType === 'lifetime' || planType === 'pack') ? 'payment' : 'subscription';

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: stripeCustomerId,
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode,
      success_url: successUrl || `${req.headers.get('origin')}/?checkout=success&plan=${planType}`,
      cancel_url: cancelUrl || `${req.headers.get('origin')}/?checkout=canceled`,
      metadata: {
        user_id: user.id,
        plan_type: planType,
      },
      subscription_data: mode === 'subscription' ? {
        metadata: {
          user_id: user.id,
          plan_type: planType,
        },
      } : undefined,
    });

    return new Response(
      JSON.stringify({
        sessionId: session.id,
        url: session.url,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Checkout error:', error);
    return new Response(
      JSON.stringify({
        error: 'Checkout failed',
        message: error instanceof Error ? error.message : 'Unknown error'
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
