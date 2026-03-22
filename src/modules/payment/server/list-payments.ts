// src/modules/payment/server/list-payments.ts

export type AdminPaymentItem = {
  id: string
  amount: string
  status: "succeeded" | "pending" | "failed" | "refunded"
  paymentType: "subscription" | "tip" | "one-time purchase"
  createdAt: string
  user: {
    username: string
    displayName: string
  } | null
  creator: {
    username: string
    displayName: string
  } | null
}

export async function listPayments(): Promise<AdminPaymentItem[]> {
  // TODO: replace with real database query
  return [
    {
      id: "payment_1",
      amount: "$14.99",
      status: "succeeded",
      paymentType: "subscription",
      createdAt: new Date().toISOString(),
      user: {
        username: "alex",
        displayName: "Alex Kim",
      },
      creator: {
        username: "janedoe",
        displayName: "Jane Doe",
      },
    },
    {
      id: "payment_2",
      amount: "$24.00",
      status: "pending",
      paymentType: "tip",
      createdAt: new Date().toISOString(),
      user: {
        username: "sofia",
        displayName: "Sofia Park",
      },
      creator: {
        username: "nova",
        displayName: "Nova Room",
      },
    },
    {
      id: "payment_3",
      amount: "$39.00",
      status: "refunded",
      paymentType: "one-time purchase",
      createdAt: new Date().toISOString(),
      user: {
        username: "ryan",
        displayName: "Ryan Lee",
      },
      creator: {
        username: "mika",
        displayName: "Mika Studio",
      },
    },
  ]
}