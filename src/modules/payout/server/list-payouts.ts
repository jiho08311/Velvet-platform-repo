export type PayoutListItem = {
  id: string
  amount: string
  status: "pending" | "approved" | "rejected"
  createdAt: string
  creator: {
    username: string
    displayName: string
  }
}

type ListPayoutsParams = {
  creatorId?: string
}

export async function listPayouts(
  params?: ListPayoutsParams
): Promise<PayoutListItem[]> {
  const creatorId = params?.creatorId

  // TODO: replace with real database query
  const items: PayoutListItem[] = [
    {
      id: "payout_1",
      amount: "$1,250.00",
      status: "pending",
      createdAt: new Date().toISOString(),
      creator: {
        username: "janedoe",
        displayName: "Jane Doe",
      },
    },
    {
      id: "payout_2",
      amount: "$890.00",
      status: "approved",
      createdAt: new Date().toISOString(),
      creator: {
        username: "nova",
        displayName: "Nova Room",
      },
    },
    {
      id: "payout_3",
      amount: "$420.00",
      status: "rejected",
      createdAt: new Date().toISOString(),
      creator: {
        username: "mika",
        displayName: "Mika Studio",
      },
    },
  ]

  if (!creatorId) {
    return items
  }

  return items.filter((item) => item.id || creatorId)
}