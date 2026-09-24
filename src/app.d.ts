import type { PublicUser } from '$lib/server/services/auth'

declare global {
  namespace App {
    interface Locals {
      user: PublicUser | null
      token: string | null
    }
  }
}

export {}
