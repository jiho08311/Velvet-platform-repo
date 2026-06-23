export const NOTIFICATION_ROW_SELECT = `
  id,
  user_id,
  type,
  status,
  title,
  body,
  data,
  created_at,
  read_at
`

export const NOTIFICATION_LIST_ROW_SELECT = `
  id,
  type,
  status,
  body,
  created_at,
  read_at
`
export const NOTIFICATION_BADGE_ROW_SELECT = `
  status,
  read_at
`