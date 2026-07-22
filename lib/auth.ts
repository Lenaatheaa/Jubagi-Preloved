import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import GoogleProvider from 'next-auth/providers/google';
import { db } from './db';
import bcrypt from 'bcryptjs';
import { sendEmail } from './email';

export const authOptions: NextAuthOptions = {
  session: {
    strategy: 'jwt',
  },
  pages: {
    signIn: '/',
  },
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
    }),
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'text' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Email dan password wajib diisi');
        }

        const user = await db.user.findUnique({
          where: { email: credentials.email },
          include: { profile: true },
        });

        if (!user) throw new Error('Email tidak terdaftar');

        const isPasswordValid = await bcrypt.compare(credentials.password, user.password);
        if (!isPasswordValid) throw new Error('Password salah');

        return {
          id: user.id.toString(),
          email: user.email,
          name: user.profile?.name || user.email.split('@')[0],
          role: user.role || 'user',
          image: user.profile?.avatar || null,
        } as any;
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      if (account?.provider === 'google') {
        const email = user.email;
        if (!email) return false;

        let existingUser = await db.user.findUnique({
          where: { email },
        });

        if (!existingUser) {
          const hashedPassword = await bcrypt.hash(Math.random().toString(36).substring(2, 15), 10);
          existingUser = await db.user.create({
            data: {
              email,
              password: hashedPassword,
              profile: {
                create: {
                  name: user.name || email.split('@')[0],
                  avatar: user.image || null,
                }
              }
            }
          });
        }
        user.id = existingUser.id.toString();
        (user as any).role = 'user';

        // Send login notification to Gmail
        await sendEmail(
          email,
          'Notifikasi Login JUBAGI',
          `Halo ${user.name}, anda berhasil login ke JUBAGI E-commerce melalui akun Google Anda pada ${new Date().toLocaleString('id-ID')}. Jika ini bukan Anda, segera amankan akun Anda.`
        );
      }
      return true;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.name = token.name as string;
        session.user.email = token.email as string;
        session.user.image = token.picture as string | null;
        (session.user as any).id = token.sub;
        (session.user as any).role = token.role;
      }
      return session;
    },
    async jwt({ token, user, trigger, session }) {
      if (trigger === 'update' && session?.image !== undefined) {
        token.picture = session.image;
      }
      if (user && user.email) {
        // Ambil data profil terbaru dari database saat pertama kali login
        const dbUser = await db.user.findUnique({
          where: { email: user.email },
          include: { profile: true }
        });
        
        token.name = dbUser?.profile?.name || user.name;
        token.email = user.email;
        token.sub = dbUser?.id.toString() || user.id;
        token.role = dbUser?.role || (user as any).role || 'user';
        token.picture = dbUser?.profile?.avatar || user.image;
      }
      return token;
    },
  },
  secret: process.env.NEXTAUTH_SECRET || 'rahasia_jubagi_123',
};

