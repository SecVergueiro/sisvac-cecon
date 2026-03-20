import NextAuth from 'next-auth'
import Google from 'next-auth/providers/google'
import Credentials from 'next-auth/providers/credentials'
import { createClient } from '@supabase/supabase-js'
import type { UserRole } from '@sisvac/types'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

export const { handlers, auth, signIn, signOut } = NextAuth({
  secret: process.env.AUTH_SECRET!,

  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: { params: { prompt: 'select_account' } },
    }),

    Credentials({
      name: 'credentials',
      credentials: {
        email:    { label: 'E-mail', type: 'email' },
        password: { label: 'Senha',  type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null

        const { data, error } = await supabaseAdmin.auth.signInWithPassword({
          email:    credentials.email as string,
          password: credentials.password as string,
        })

        if (error || !data?.user || !data?.session) {
          console.error('[NestAuth Credentials] Falha na autenticação via Supabase:', error?.message)
          return null
        }

        const { data: profile, error: profileErr } = await supabaseAdmin
          .from('profiles')
          .select('id, role, nome, cpf_validado, ativo')
          .eq('id', data.user.id)
          .single()

        if (profileErr || !profile) {
          console.error('[NestAuth Credentials] Profile não encontrado ou erro do banco:', profileErr)
          return null
        }
        
        if (!profile.ativo) {
          console.error('[NestAuth Credentials] Conta inativa para o profile:', profile.id)
          return null
        }

        if (!profile.cpf_validado) {
          console.error('[NestAuth Credentials] CPF não validado')
          throw new Error('CPF_NAO_VALIDADO')
        }

        return {
          id:           data.user.id,
          email:        data.user.email!,
          name:         profile.nome,
          role:         profile.role as UserRole,
          cpf_validado: profile.cpf_validado,
          accessToken:  data.session.access_token,
        }
      },
    }),
  ],

  callbacks: {
    async jwt({ token, user, account }) {
      if (user) {
        token.id           = user.id
        token.role         = (user as any).role
        token.cpf_validado = (user as any).cpf_validado
        token.accessToken  = (user as any).accessToken
      }
      if (account?.provider === 'google' && token.email) {
        const { data: profile } = await supabaseAdmin
          .from('profiles')
          .select('id, role, cpf_validado, ativo')
          .eq('email', token.email)
          .single()

        if (!profile?.ativo) throw new Error('CONTA_INATIVA')

        token.id           = profile.id
        token.role         = profile.role
        token.cpf_validado = profile.cpf_validado
        token.accessToken  = account.access_token
      }
      return token
    },

    async session({ session, token }) {
      (session.user as any).id           = token.id as string
      ;(session.user as any).role         = token.role as UserRole
      ;(session.user as any).cpf_validado = token.cpf_validado as boolean
      // expõe o token JWT do Supabase para o api-client chamar o NestJS
      ;(session as any).accessToken = token.accessToken
      return session
    },
  },

  pages: {
    signIn:  '/auth/login',
    error:   '/auth/login',
    signOut: '/auth/login',
  },

  session: {
    strategy: 'jwt',
    maxAge:   8 * 60 * 60,
  },

  debug: process.env.NODE_ENV === 'development',
})