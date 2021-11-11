const stripe = require('stripe')(process.env.STRIPE_API_SECRET_KEY, stripeOptions)
const HttpError = rootRequire('services/error/http')

const webhookSignatureHeader = 'stripe-signature'

async function createCheckoutSession(lineItems, metadata = {}, shippingRates = []) {
  const payload = checkoutSessionCreationPayload(lineItems, metadata, shippingRates)
  return await stripe.checkout.sessions.create(payload)
}

async function checkoutSession(sessionId, expandedData = []) {
  return await stripe.checkout.sessions.retrieve(sessionId, { expand: expandedData })
}

async function promotionCode(promotionId) {
  return await stripe.promotionCodes.retrieve(promotionId)
}

function completedCheckoutSession(payload, payloadHeaders) {
  const event = webhookEvent(
    payload,
    payloadHeaders,
    process.env.STRIPE_CHECKOUT_SESSION_COMPLETED_WEBHOOK_SECRET,
    'checkout.session.completed'
  )

  return webhookEventData(event)
}

function webhookEvent(payload, payloadHeaders, secret, eventTypes) {
  try {
    const event = constructWebhookEvent(payload, payloadHeaders, secret)

    if ((Array.isArray(eventTypes) && !eventTypes.includes(event.type)) || event.type !== eventTypes) {
      throw new HttpError(403)
    }

    return event
  } catch (err) {
    if (err instanceof HttpError) {
      throw err
    }

    console.error(err)
    throw new HttpError(400, 'Webhook signature verification failed.')
  }
}

function constructWebhookEvent(payload, payloadHeaders, secret) {
  return stripe.webhooks.constructEvent(payload, payloadHeaders[webhookSignatureHeader], secret)
}

function webhookEventData(event) {
  return event.data.object
}

function checkoutSessionCreationPayload(lineItems, metadata = {}, shippingRates = []) {
  const paymentMethodTypes = process.env.PAYMENT_METHOD_TYPES
    ? process.env.PAYMENT_METHOD_TYPES.split(',') : 'card'

  const shippingAddressAllowedCountries = process.env.SHIPPING_ADDRESS_ALLOWED_COUNTRIES
    ? process.env.SHIPPING_ADDRESS_ALLOWED_COUNTRIES.split(',') : 'GB'

  const successUrlPath = process.env.SUCCESS_URL_PATH ? `/${process.env.SUCCESS_URL_PATH}` : ''

  const cancelUrlPath = process.env.CANCEL_URL_PATH ? `/${process.env.CANCEL_URL_PATH}` : ''

  const payload = {
    mode: process.env.CHECKOUT_SESSION_MODE || 'payment',
    payment_method_types: paymentMethodTypes,
    line_items: lineItems,
    payment_intent_data: {
      capture_method: process.env.PAYMENT_INTENT_CAPTURE_METHOD || 'manual',
    },
    shipping_address_collection: {
      allowed_countries: shippingAddressAllowedCountries
    },
    allow_promotion_codes: !!process.env.ALLOW_PROMOTION_CODES ? true : false,
    metadata: metadata || {},
    success_url: `${process.env.DOMAIN}${successUrlPath}`,
    cancel_url: `${process.env.DOMAIN}${cancelUrlPath}`
  }

  if (payload.mode === 'payment') {
    payload.shipping_rates = shippingRates
  }

  return payload
}

function stripeOptions() {
  const options = {}

  if (process.env.STRIPE_MAX_NETWORK_RETRIES) {
    options.maxNetworkRetries = process.env.STRIPE_MAX_NETWORK_RETRIES
  }

  if (process.env.STRIPE_TIMEOUT) {
    options.timeout = process.env.STRIPE_TIMEOUT
  }

  return options
}

module.exports = {
  createCheckoutSession,
  checkoutSession,
  promotionCode,
  completedCheckoutSession
}
