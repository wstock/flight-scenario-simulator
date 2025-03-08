import { createApiLogger } from '@/lib/utils/logger';

const logger = createApiLogger('[...nextauth]Route');
import NextAuth from "next-auth";
import { authOptions } from "@/lib/auth";

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
